var util = require('../util'),
  request = require('request');

module.exports.handler = function(event,context) {
  console.log("event: ", event)
  util.getTokenAndConfig(event, function(err,tc) {
    if (err) return util.done(err,event,context);

    delete tc.config.compute.product;

    var groupId = event.groupId || event.PhysicalResourceId;

    var createOptions = {
      method: 'PUT',
      url: 'https://www.spotinst.com:8081/aws/ec2/group/'+groupId,
      headers: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + tc.token
      },
      json: {
        group: tc.config
      }
    };

    var updateCallback ;
    
    if ( tc.rollPercentage ){
      var rollOptions = {
        method: 'PUT',
        url: 'https://www.spotinst.com:8081/aws/ec2/group/'+groupId+'/roll',
        headers: {
          'content-type': 'application/json',
          'Authorization': 'Bearer ' + tc.token
        },
        json: {
          batchSizePercentage: tc.rollPercentage
        }
      };
      updateCallback = function(err, res, body){
        if (res.statusCode > 201) {
          console.log("Elasticgroup update failed : ",res);
          if (err){
            console.log(err);
          }else{
            err="failed "+res.statusCode;
          }
          util.done(err, event, context, body, groupId);
        }else {
          console.log("update suceeded now call roll");

          request(rollOptions, function (err, res, body) {
            console.log("res: ", res);
            if (body) console.log("body: ",body);
            if (err) console.log("err: ",err);
            if (res.statusCode > 201) {
              console.log("Elasticgroup update failed : ",res);
              if (err){
                console.log(err);
              }else{
                err="failed "+res.statusCode;
              }
            }else {
              console.log("roll suceeded")
            }
            util.done(err, event, context, body, groupId);
          });
        }
      }
      
    }else{
      updateCallback = function(err, res, body){
        if (res.statusCode > 201) {
          console.log("Elasticgroup update failed : ",res);
          if (err){
            console.log(err);
          }else{
            err="failed "+res.statusCode;
          }
        }else {
          console.log("update suceeded without call to roll")
        }
        util.done(err,event,context,body,groupId);
      }
    }

    console.log("call update")
    request(createOptions, updateCallback);
  });
};

