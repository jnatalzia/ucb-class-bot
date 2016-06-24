var _ = require('underscore');

var RedisMock = {
  createClient: function(url, opts) {
    var mockData = {};
    return new (function() {
      this.eventListeners = {};
      this.mockedCalls = {
        get: [],
        set: [],
        keys: [],
        del: [],
        on: []
      };

      var addMockCall = function(func, opts) {
        this.mockedCalls[func].push(opts);
      }.bind(this);

      this.get = function(key, callback) {
        addMockCall('get', {args: arguments});
        callback(null, mockData[key]);
      };
      this.set = function(key, value) {

        addMockCall('set', {args: arguments});
        mockData[key] = value;
      }
      this.on = function(event, callback) {
        addMockCall('on', {args: arguments});
        this.eventListeners[event] = this.eventListeners[event] || [];
        this.eventListeners[event].push(callback);
      };
      this.keys = function(match, callback) {
        addMockCall('keys', {args: arguments});
        return _.keys(mockData);
      };
      this.del = function(key) {
        addMockCall('del', {args: arguments});
        delete mockData[key];
      };
      /** Mock helpers */
      this.clearMockedCalls = function() {
        for (var key in this.mockedCalls) {
          if (this.mockedCalls.hasOwnProperty(key)) this.mockedCalls[key] = [];
        }
      };
      this.setMockData = function(data) {
        mockData = data;
      };
      this.getMockData = function() {
        return mockData;
      };
     })();
  }
};

module.exports = RedisMock;