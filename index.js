var req = require('request');
var cheerio = require('cheerio');
var RedisHandler = require('./lib/redis_handler');
var htmlParser = require('htmlparser');
var _ = require('underscore');

var UCB_COURSE_URL = 'https://newyork.ucbtrainingcenter.com/course/open';


var courseInfoStructure = {
  level: 0,
  time: 1,
  start: 2,
  instructor: 3
}

function init() {
  console.log('Initialzing');
  RedisHandler.addEventListeners(pingUcbCourseList);
}

function pingUcbCourseList() {
  req(UCB_COURSE_URL, function (error, response, body) {
    if (error) {
      console.log('Error in request');
      raise(new Error(error));
    }

    if (response.statusCode == 200) {
      console.log('Checking course list now.');
      checkAllCourses(cheerio.load(body.toString()));
    }

    setTimeout(pingUcbCourseList, 60000);
  });

  // var coursees = checkAllCourses(cheerio.load(require('./mock_data/html.mock'))); //instead of hitting ucb while testing
}

function checkAllCourses($) {
  var courseBlocks = $('.table');
  var allCourses = [];

  _.each(courseBlocks, function(node, ind) {
    var rows = $(node).find('tr');
    _.each(rows, function(r, rowIndex) {
      var courseInfo = $(r).find('td');
      var ucbCourse = {};

      _.each(courseInfoStructure, function(index, desc) {
        ucbCourse[desc] = $(courseInfo[index]).text();
      });

      var linkNode = $(courseInfo[4]);
      var currentState = $(linkNode).find('a').text().trim();
      ucbCourse.state = currentState;

      ucbCourse.key = generateCacheKeyForObj(ucbCourse);

      RedisHandler.checkRedisStateChange(ucbCourse);
      allCourses.push(ucbCourse);
    });
  });

  return allCourses;
}

function generateCacheKeyForObj(obj) {
  return `${obj.instructor.toLowerCase().replace(/ /g, "_")}_${obj.start.toLowerCase().replace(/,? |:/g, "_")}`;
}

init();
