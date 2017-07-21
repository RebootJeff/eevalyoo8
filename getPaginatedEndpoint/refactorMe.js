var _ = require('lodash');

// User, Notification, and Company are mongoose models
var User = require('../models/user.js');
var Company = require('../models/company.js');
// Notification model uses `mongoose-paginate` plugin
var Notification = require('../models/notification.js');

// Imagine there is other code for `NotificationsController`,
// but we will focus on just 1 method.

/*
 * getUserNotifications
 * Find all unread notifications that a given user should see.
 * This includes notifications with `.recipient` = the user,
 * `.recipient` = the subgroup that the user belongs to,
 * and `.recipient` = the company that the user owns.
*/
NotificationsController.getUserNotifications = function(req, res, next) {
  var offset = req.query.offset;
  var limit = req.query.limit;
  var userId = new ObjectId(req.param('userId'));

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
    notificationsReadAt = user.notificationsReadAt;
    userQuery.recipient = {$in: [user._id]};
    subGroupQuery.recipient = {$in: [user.subGroup._id]};

    return Company.find({'owner.$id': user._id});
  })
  .then(function(companies) {
    var companyIds = [];
    companies.forEach(function(company) {
      companyIds.push(company._id);
    });

    companyQuery.recipient = {$in: companyIds};

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

    return Notification.count(query);
  })
  .then(function(unreadCount){
    response.unreadCount = unreadCount;
    this.addHeaders(res);
    res.send(response);
  }, function(err) {
    console.error('err');
  });
}

module.exports = NotificationsController;
