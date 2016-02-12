var _ = require('lodash'),
  util = require('../util'),
  request = require('request');

module.exports.handler = function(event,context) {
  console.log("event: ", event)
  util.getToken(event, function(err,token) {
    if (err) return util.done(err,event,context);

    var groupId = event.groupId || event.PhysicalResourceId;

    // Let CloudFormation rollbacks happen for failed stacks
    if (event.StackId && !_.startsWith(groupId,'sig'))
      return util.done(null,event,context);

    var createOptions = {
      method: 'DELETE',
      url: 'https://www.spotinst.com:8081/aws/ec2/group/'+groupId,
      headers: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    };
    request(createOptions, function (err, res, body) {

      if (res.statusCode > 201){
          console.log("res :",res);
          if (body) console.log("body: ", body);
          util.done("Elasticgroup deletion failed: " + res.statusMessage,event,context);
      } else {

        // Ensure JSON
        body = JSON.parse(body.toString());

        util.done(err, event, context, body);
      }
    });
  });
};
