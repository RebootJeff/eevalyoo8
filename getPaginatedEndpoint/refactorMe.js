var _ = require('lodash');

// Imagine there is other code for `NotificationsController` class.
// User, Notification, and Company are mongoose models
// Notification model uses https://github.com/edwardhotchkiss/mongoose-paginate

NotificationsController.prototype.getUserNotifications = function(req, res, next) {
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
    if (!user) {
      throw new NotFoundError('No such User: ' + userId);
    }

    notificationsReadAt = user.notifications_read_at;
    userQuery.recipients = {$in: [user._id]};
    subGroupQuery.recipients = {$in: [user.subGroup._id]};
    return Company.find({'employees.$id': user._id});
  })
  .then(function(campaigns) {
    companyQuery.recipients = {$in: _.map(companies, '_id')};
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

    return Notification.count(query);
  })
  .then(function(unread){
    response.unread = unread;
    this.addHeaders(res);
    res.send(response);
  }, function(err) {
    console.error('err');
  });
}

module.exports = new NotificationsController();
