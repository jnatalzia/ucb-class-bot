var RedisHandler = require('./lib/redis_handler');
var Poller = require('./lib/poller');

function init() {
  console.log('Initialzing');
  RedisHandler.addEventListeners(Poller.pingUcbCourseList);
}

init();
