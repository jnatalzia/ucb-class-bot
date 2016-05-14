var req = require('request');
var cheerio = require('cheerio');
var RedisHandler = require('./lib/redis_handler');
var Utils = require('./lib/utils');
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
      var allCourses = checkAllCourses(cheerio.load(body.toString()));
      RedisHandler.clearOldCourses(allCourses);
    }

    setTimeout(pingUcbCourseList, 60000);
  });

  // var courses = checkAllCourses(cheerio.load(require('./mock_data/html.mock'))); //instead of hitting ucb while testing
  // RedisHandler.clearOldCourses(courses);
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

      var linkNode = $(courseInfo[4]).find('a');
      var currentState = linkNode.text().trim();
      var classHref = linkNode.attr('href');
      var splitHref = classHref.split('/');
      var classID = splitHref.pop();
      var classType = splitHref.pop();
      ucbCourse.state = currentState;
      ucbCourse.url = classHref;
      ucbCourse.type = classType;
      ucbCourse.id = classID;
      ucbCourse.key = Utils.generateCacheKeyForCourse(ucbCourse);

      RedisHandler.checkRedisStateChange(ucbCourse);
      allCourses.push(ucbCourse);
    });
  });

  return allCourses;
}

init();
