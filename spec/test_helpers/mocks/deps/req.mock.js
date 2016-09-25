var mockBodyString = require('../data/mock_html_body');

module.exports = function(url, cb) {
  cb(null, {statusCode: 200}, mockBodyString);
};