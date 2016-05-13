var redis = require('redis');
var CourseTweeter = require('./course_tweeter');
var client;

if (process.env.REDIS_URL) {
  client = redis.createClient(process.env.REDIS_URL, {password: process.env.REDIS_PASS || ''});
} else {
  client = redis.createClient(); //creates a new client
}

function checkRedisStateChange(ucbCourse) {
  client.get(ucbCourse.key, function(err, oldState) {
    if (err) {
      raise(new Error(err));
    } else if (oldState) {
      if (oldState !== ucbCourse.state) {
        client.set(ucbCourse.key, ucbCourse.state);
        if (oldState.match(/sold out/i)) CourseTweeter.tweetCourseChange(ucbCourse);
      }
    } else {
      console.log('New course! Setting state for ' + ucbCourse.key + ' to ' + ucbCourse.state);
      client.set(ucbCourse.key, ucbCourse.state);
    }
  });
}

function addEventListeners(cb) {
  client.on("error", function (err) {
    console.log("Error " + err);;
    process.exit();
  });

  client.on('connect', function() {
    console.log('connected to redis');
    cb();
  });
}

module.exports = { addEventListeners: addEventListeners, checkRedisStateChange: checkRedisStateChange };