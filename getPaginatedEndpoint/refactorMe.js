var _ = require('lodash');

// User, Notification, and Company are mongoose models
var User = require('../models/user.js');
var Company = require('../models/company.js');
// Notification model uses `mongoose-paginate` plugin
var Notification = require('../models/notification.js');

// Imagine there is other code for `NotificationsController`,
// but we will focus on just 1 method.

// #getUserNotifications
// Return paginated notifications that a given user should see, plus some counts.
// This includes notifications with `.recipient` = the user,
// `.recipient` = the subgroup that the user belongs to,
// and `.recipient` = the company that the user owns.
NotificationsController.getUserNotifications = function(req, res, next) {
  // * Perhaps the method body should be wrapped in a `Promise.try` to help catch errors.
  // * We should add validation to these query params and URL params.
  var offset = req.query.offset;
  var limit = req.query.limit;
  var userId = new ObjectId(req.param('userId'));

  // * All this query building code + query modification code that comes a bit
  // later could be bundled into a function for easier readability.
  var userQuery = {
    recipientType: 'user'
  };
  var subGroupQuery = {
    recipientType: 'sub-group'
  };
  var companyQuery = {
    recipientType: 'company'
  };
  var query = {$or:[
    userQuery,
    subGroupQuery,
    companyQuery
  ]};

  var response = {};
  var notificationsReadAt;

  return User.findById(userId)
  .then(function(user) {
    // * We should throw an error if the user isn't found

    notificationsReadAt = user.notificationsReadAt;

    // * We can avoid relying on mutation of the query objects (and also make
    // the code generally easier to follow) if we just define them when they're
    // needed rather than at the start of the method.
    userQuery.recipient = {$in: [user._id]};
    subGroupQuery.recipient = {$in: [user.subGroup._id]};

    // * Company and User queries could've be done in parallel instead of sequentially
    // (by using `Promise.all`)
    return Company.find({'owner.$id': user._id});
  })
  .then(function(companies) {
    // * Cleaner to use `map` rather than `forEach`.
    var companyIds = [];
    companies.forEach(function(company) {
      companyIds.push(company._id);
    });

    companyQuery.recipient = {$in: companyIds};

    // * CRITICAL: The empty object given to `#paginate` is questionable.
    // (It should be the `query` variable!)
    return Notification.paginate({}, {
      offset: offset,
      limit: limit,
      lean: true,
      sort: {createdAt: -1}
    });
  })
  .then(function(results) {
    response = results;

    // Check for `notificationsReadAt` because a new user wouldn't have read any
    // yet, so their `notificationsReadAt` would be undefined.
    if (notificationsReadAt) {
      var unreadQuery = _.extend({
        createdAt: { $gt: notificationsReadAt }
      }, query);
      return Notification.count(unreadQuery);
    }

    // * No need for this `#count` query. Just use the `total` value returned as
    // part of the results from the `#paginate` query.
    return Notification.count(query);
  })
  .then(function(unreadCount){
    response.unreadCount = unreadCount;
    res.send(response);
  }, function(err) {
    // * Bad practice to use error callback within `#then`.
    // Just use `#catch` instead.
    console.error('err');
  });
}

module.exports = NotificationsController;
