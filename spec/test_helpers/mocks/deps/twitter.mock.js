module.exports = function(config) {
  this.mockedCalls = {
    post: []
  };
  this.post = function(url, data, callback) {
    this.mockedCalls.post.push({
      args: arguments
    });
    callback(null , 'A tweet', {
      status: 'success'
    });
  },
  this.clearMockedCalls = function() {
    for (var key in this.mockedCalls) {
      if (this.mockedCalls.hasOwnProperty(key)) this.mockedCalls[key] = [];
    }
  };
};