var util = require('../util'),
  request = require('request');

module.exports.handler = function(event,context) {
  util.getTokenAndConfig(event, function(err,tc) {
    if (err) return util.done(err,event,context);

    console.log(tc.config);
    
    var createOptions = {
      method: 'POST',
      url: 'https://www.spotinst.com:8081/aws/ec2/group',
      headers: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + tc.token
      },
      json: {
        group: tc.config
      }
    };
    request(createOptions, function (err, res, body) {
      if ( err ) console.log("err: "+err);
      if (res.statusCode > 201)
      {
        console.log("res :"+res);
        if ( body) console.lgo("body: "+ body);
        return util.done("Elasticgroup creation failed: " + res.statusMessage,event,context);
      }

      console.log("create suceeded ");
      console.log(body.response.items[0].id);
      
      util.done(err,event,context,body,body.response.items[0].id);
    });
  });
};

