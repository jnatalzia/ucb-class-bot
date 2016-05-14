var redis = require('redis');
var CourseTweeter = require('./course_tweeter');
var _ = require('underscore');

var client;
var KEY_BLACKLIST = ['course_clean_ts'];

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

function clearOldCourses(allCourseInfo) {
  client.get('course_clean_ts', function(getErr, lastClean) {
    /** If it's been less than a day since we last cleaned */
    if (lastClean && Date.now() - lastClean < 86400000) {
      return;
    }

    var courseList = _.map(allCourseInfo, function(c) { return c.key });

    console.log('Clearing old courses');
    client.keys('*', function(err, currCourseKeys) {
      if (err) {
        raise(new Error(err));
        return;
      }

      currCourseKeys = _.filter(currCourseKeys, function(cKey, ind) { return !_.contains(KEY_BLACKLIST, cKey); });

      _.each(currCourseKeys, function(cKey) {
        if (!_.contains(courseList, cKey)) {
          console.log('Course no longer active: ' + cKey);
          client.del(cKey);
        }
      });
    });

    client.set('course_clean_ts', Date.now());
  });
}

module.exports = { addEventListeners: addEventListeners, checkRedisStateChange: checkRedisStateChange, clearOldCourses: clearOldCourses };