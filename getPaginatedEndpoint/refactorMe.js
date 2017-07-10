var _ = require('lodash');

// Imagine there is other code for `NotificationsController` class.
// User, Notification, and Company are mongoose models
// Notification model uses https://github.com/edwardhotchkiss/mongoose-paginate

NotificationsController.prototype.getUserNotifications = function(req, res, next) {
  // * Perhaps this code should be wrapped in a `Promise.try` to help catch errors
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

    notificationsReadAt = user.notifications_read_at;
    // * We can avoid relying on mutation of the query objects if we just
    // define them when they're needed rather than before they're needed.
    userQuery.recipients = {$in: [user._id]};
    subGroupQuery.recipients = {$in: [user.subGroup._id]};
    // * Company and User queries could be done in parallel instead of sequentially
    // (by using `Promise.all`)
    return Company.find({'employees.$id': user._id});
  })
  .then(function(companies) {
    companyQuery.recipients = {$in: _.map(companies, '_id')};
    // * The empty object given to `#paginate` is questionable.
    // It should be the `query` variable.
    return Notification.paginate({}, {
      offset: offset,
      limit: limit,
      lean: true,
      sort: {createdAt: -1}
    });
  })
  .then(function(results) {
    response = results;

    if (notificationsReadAt) {
      var unreadQuery = _.extend({
        createdAt: {
          $gt: notificationsReadAt
        }
      }, query);
      return Notification.count(unreadQuery);
    }

    // * No need for this query. Just use the `total` count returned by the
    // `#paginate` query.
    return Notification.count(query);
  })
  .then(function(unread){
    response.unread = unread;
    this.addHeaders(res);
    res.send(response);
  }, function(err) {
    // * Bad practice to use error callback within `#then`. Just use `#catch` instead.
    console.error('err');
  });
}

module.exports = new NotificationsController();
