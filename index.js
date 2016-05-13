var r = require('request');
var cheerio = require('cheerio');
var mockData = require('./mock_data/html.mock');
var htmlParser = require('htmlparser');
var _ = require('underscore');
var UCB_CLASS_URL = 'https://newyork.ucbtrainingcenter.com/course/open';

// redis
var redis = require('redis');
var PORT, HOST;
var client = redis.createClient(); //creates a new client

client.on("error", function (err) {
  console.log("Error " + err);
});

var classInfoStructure = {
  level: 0,
  time: 1,
  start: 2,
  instructor: 3
}

function init() {
  pingUcbCourseList();
}

function pingUcbCourseList() {
  r(UCB_CLASS_URL, function (error, response, body) {
    if (error) {
      console.log('Error in request');
      raise(new Error(error));
    }
    if (response.statusCode == 200) {
      // console.log(body.toString());
      checkAllClasses(cheerio.load(body.toString));
    }
  });

  // var classes = checkAllClasses(cheerio.load(mockData)); //instead of hitting ucb while testing
}

function checkAllClasses($) {
  var classBlocks = $('.table');
  var allClasses = [];

  _.each(classBlocks, function(node, ind) {
    var rows = $(node).find('tr');
    _.each(rows, function(r, rowIndex) {
      var classInfo = $(r).find('td');
      var ucbClass = {};

      _.each(classInfoStructure, function(index, desc) {
        ucbClass[desc] = $(classInfo[index]).text();
      });

      var linkNode = $(classInfo[4]);
      var currentState = $(linkNode).find('a').text().trim();
      ucbClass.state = currentState;

      ucbClass.key = generateCacheKeyForObj(ucbClass);

      checkRedisStateChange(ucbClass);
      allClasses.push(ucbClass);
    });
  });

  return allClasses;
}

function checkRedisStateChange(ucbClass) {
  client.get(ucbClass.key, function(err, oldState) {
    if (err) {
      raise(new Error(err));
    } else if (oldState) {
      // oldState = 'Sold Out'; //for testing

      if (oldState !== ucbClass.state) {
        client.set(ucbClass.key, ucbClass.state);
        if (oldState.match(/sold out/i)) tweetClassChange(ucbClass);
      }
    } else {
      console.log('setting state for ' + ucbClass.key + ' to ' + ucbClass.state);
      client.set(ucbClass.key, ucbClass.state);
    }
  });
}

function tweetClassChange(ucbClass) {
  console.log(`Spot just opened up in ${ucbClass.level} with ${ucbClass.instructor}. Starts ${ucbClass.start}. https://newyork.ucbtrainingcenter.com/course/open`);
}

function generateCacheKeyForObj(obj) {
  return `${obj.instructor.toLowerCase().replace(/ /g, "_")}_${obj.start.toLowerCase().replace(/,? |:/g, "_")}`;
}

client.on('connect', function() {
  console.log('connected to redis');
  init();
  client.quit();
});
