var r = require('request');
var mockJson = require('./mock_data/html_json.mock');
var htmlParser = require('htmlparser');
var _ = require('underscore');
var UCB_CLASS_URL = 'https://newyork.ucbtrainingcenter.com/course/open';

// r(UCB_CLASS_URL, function (error, response, body) {
//   if (error) {
//     console.log('Error in request');
//     raise(new Error(error));
//   }
//   if (response.statusCode == 200) {
//     var handler = new htmlParser.DefaultHandler(function (error, dom) {
//       if (error)
//         raise(new Error(error));
//     });
//     var parser = new htmlParser.Parser(handler);
//     parser.parseComplete(body.toString());
//     var htmlTag = _.filter(handler.dom, function(node) { return node.type === 'tag' && node.name === 'html' });
//     findContentContainer(JSON.stringify(htmlTag));
//   }
// });

findContentContainer(mockJson);

function findContentContainer(html) {
  var arrIndex = 0;
  var depthIndex = 0;
  function search(cluster, allElements) {
    _.each(cluster, function(node, i) {
      if (node.children && node.children.length) {
        search(node.children, allElements);
      }

      allElements.push(node);
    });
  }

  // if no node was found

  var allElements = [];
  search(html, allElements);
  var classesContainer = _.find(allElements, function(el) { return el.attribs && el.attribs.id === 'content_container' }));
}