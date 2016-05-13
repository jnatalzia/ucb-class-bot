var r = require('request');
var cheerio = require('cheerio');
var twitter = require('twitter');
var htmlParser = require('htmlparser');
var _ = require('underscore');

var UCB_CLASS_URL = 'https://newyork.ucbtrainingcenter.com/course/open';

// redis
var redis = require('redis');
var client;
if (process.env.REDIS_URL) {
  client = redis.createClient(process.env.REDIS_URL, {password: process.env.REDIS_PASS || ''});
} else {
  client = redis.createClient(); //creates a new client
}

var twitterCreds, tClient;
try {
  twitterCreds = require('./config/twitter_creds');
} catch (e) {
  console.log(e);
  console.log('ERR: There is no config file in the config/twitter_creds path - Hope you have process envs set');
  twitterCreds = {};
}

tClient = new twitter({
  consumer_key: process.env.CONSUMER_KEY || twitterCreds.consumer_key,
  consumer_secret: process.env.CONSUMER_SECRET || twitterCreds.consumer_secret,
  access_token_key: process.env.ACCESS_TOKEN_KEY || twitterCreds.access_token_key,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET || twitterCreds.access_token_secret
});

client.on("error", function (err) {
  console.log("Error " + err);;
  process.exit();
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
      console.log('Checking course list now.');
      checkAllClasses(cheerio.load(body.toString()));
    }

    setTimeout(pingUcbCourseList, 60000);
  });

  // var classes = checkAllClasses(cheerio.load(require('./mock_data/html.mock'))); //instead of hitting ucb while testing
}

function checkAllClasses($) {
  var classBlocks = $('.table');
  var allClasses = [];

  // console.log('found ' + classBlocks.length + ' class blocks');

  _.each(classBlocks, function(node, ind) {
    var rows = $(node).find('tr');
    // console.log('number of rows in this classBlock' + rows.length);
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
      // console.log('checking redis change for class ' + ucbClass);
      checkRedisStateChange(ucbClass);
      allClasses.push(ucbClass);
    });
  });

  return allClasses;
}

function checkRedisStateChange(ucbClass) {
  // console.log('checking redis for ' + ucbClass.level);
  client.get(ucbClass.key, function(err, oldState) {
    // console.log('oldState is: ' + oldState);
    if (err) {
      raise(new Error(err));
    } else if (oldState) {
      // oldState = 'Sold Out'; //for testing

      if (oldState !== ucbClass.state) {
        client.set(ucbClass.key, ucbClass.state);
        if (oldState.match(/sold out/i)) tweetClassChange(ucbClass);
      }
    } else {
      console.log('New Class! Setting state for ' + ucbClass.key + ' to ' + ucbClass.state);
      client.set(ucbClass.key, ucbClass.state);
    }
  });
}

function tweetClassChange(ucbClass) {
  if (ucbClass.instructor.match(/intensive/i)) return; //filter out intensives for now because no way to differentiate redis key

  var tweetText = `Spot just opened up in ${ucbClass.level} with ${ucbClass.instructor}. Starts ${ucbClass.start}. https://newyork.ucbtrainingcenter.com/course/open`;

  tClient.post('statuses/update', {status: tweetText},  function(error, tweet, response){
    if (error) throw error;
    console.log('Tweet sent out. Message: ' + tweet);
  });
}

function generateCacheKeyForObj(obj) {
  return `${obj.instructor.toLowerCase().replace(/ /g, "_")}_${obj.start.toLowerCase().replace(/,? |:/g, "_")}`;
}

client.on('connect', function() {
  console.log('connected to redis');
  init();
});
