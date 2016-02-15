var aws = require('aws-sdk');
var response = require('cfn-response')

var kms = new aws.KMS();


var decrypt = function (cipherText, successCallback, errorCallback) {
    var ciphertextBlob = new Buffer(cipherText, 'base64');
    kms.decrypt({
        CiphertextBlob: ciphertextBlob,
        EncryptionContext: {
            app: "spotinst-lambda"
        }
    }, function (err, data) {
        if (err) {
            errorCallback(err);
        } else {
            var decrypted = data['Plaintext'].toString();
            successCallback(decrypted);
        }
    });
};

var getToken = module.exports.getToken = function (event, cb) {
    var config = event.ResourceProperties || event;

    if (config.username && config.password && config.clientId && config.clientSecret) {
        var decrypedPasswd = decrypt(config.password, function(decryptedPassword) {
            var request = require('request');
            var tokenOptions = {
                method: 'POST',
                url: 'https://www.spotinst.com:9540/token',
                headers: {'content-type': 'application/x-www-form-urlencoded'},
                body: 'username=' + config.username + '&password=' + decryptedPassword + '&grant_type=password&client_id=' + config.clientId + '&client_secret=' + config.clientSecret
            };
            request(tokenOptions, function (err, response, body) {
                if (err) return cb("Token creation failed: " + err);
                if (response.statusCode > 201) return cb("Token creation failed: " + response.statusMessage);

                var accessToken = JSON.parse(body)['response']['items'][0]['accessToken'];
                cb(null, accessToken);
            });
        }, cb);
    }
    else if (config.accessToken) {
        cb(null, config.accessToken);
    }
    else {
        cb("No valid long or short term credentials provided");
    }
};

var getConfig = module.exports.getConfig = function (event, cb) {
    var config = (event.ResourceProperties ? event.ResourceProperties.group : null) || event.group;

    if (config) {
        cb(null, config);
    } else {
        cb("Must define groupConfig");
    }

};

var getRollPercentage = module.exports.getRollPercentage = function (event, cb) {
    var config = event.ResourceProperties || event;

    if (config.rollPercentage) {
        cb(null, config.rollPercentage);
    }
    else {
        cb(null, null);
    }
};


var getTokenAndConfig = module.exports.getTokenAndConfig = function (event, cb) {
    var count = 0;
    var response = {};

    var done = function (err, name, obj) {
        if (err) return cb(err);
        count = count + 1;
        if (obj) {
            response[name] = obj;
        }
        if (count === 3) {
            return cb(null, response);
        }
    };

    getConfig(event, function (err, cfg) {
        done(err, 'config', cfg);
    });

    getToken(event, function (err, t) {
        done(err, 'token', t);
    });
    getRollPercentage(event, function (err, t) {
        done(err, 'rollPercentage', t);
    });
}


var done = module.exports.done = function (err, event, context, obj, physicalResourceId) {
    if (event.StackId) {
        console.log("done: with stack ID");
        var responseStatus = response.SUCCESS;
        if (err) {
            responseStatus = response.FAILED;
            obj = err;
            console.log("done: ... failed " + err);
        }
        // ensure obj is an object
        if ( obj === null ) {
            obj = {};            
        } else if ( typeof obj !== 'object'){
            obj = { value: obj};
        }

        response.send(event, context, responseStatus, obj, physicalResourceId);
    }
    else {
        console.log("done: without stack ID");
        context.done(err, obj);
    }
};



