var CourseTweeterMock = function() {
  this.mockedCalls = {
    tweetCourseChange: []
  };

  var addMockCall = function(func, opts) {
    this.mockedCalls[func].push(opts);
  }.bind(this);

  this.tweetCourseChange = function() {
    addMockCall('tweetCourseChange', {args: arguments});
    return true;
  };

  /** Mock helpers */
  this.clearMockedCalls = function() {
    for (var key in this.mockedCalls) {
      if (this.mockedCalls.hasOwnProperty(key)) this.mockedCalls[key] = [];
    }
  };
};

var mock = new CourseTweeterMock();

module.exports = mock;
