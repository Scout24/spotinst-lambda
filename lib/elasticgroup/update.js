var util = require('../util')

module.exports.handler = function(event,context) {
  console.log("event: ", event)
  util.done("failed on dummy");
};

