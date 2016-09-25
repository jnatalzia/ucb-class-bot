var loadModule = require('../test_helpers/load_module').loadModule;

describe('Poller', function() {
  var reqMock = require('../test_helpers/mocks/deps/req.mock');
  var Poller = loadModule('lib/poller.js', {request: reqMock});
  describe('#pingUcbCourseList', () => {
    it('sends a request to the UCB server and checks the data', () => {
      Poller.pingUcbCourseList()
    });
    it('also sends a request to the redis handler to clear old data', () => {

    });
  });
});