var _ = require('lodash'),
  util = require('../util')

module.exports.handler = function(event,context) {
  console.log("event: ", event)
  body = JSON.parse('{"key": "value"}');
  util.done(null, event, context, body);
};
