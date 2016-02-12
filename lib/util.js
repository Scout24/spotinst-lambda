var response = require('cfn-response')


var done = module.exports.done = function (err, event, context, obj, physicalResourceId) {
    if (event.StackId) {
        console.log("done: with stack ID");
        var responseStatus = response.SUCCESS;
        if (err) {
            responseStatus = response.FAILED;
            obj = err;
            console.log("done: ... failed " + err);
        }
        response.send(event, context, responseStatus, obj, physicalResourceId);
    }
    else {
        console.log("done: without stack ID");
        context.done(err, obj);
    }
};



