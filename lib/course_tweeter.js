var twitter = require('twitter');
var twitterCreds, tClient;

try {
  twitterCreds = require('../config/twitter_creds');
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

function tweetCourseChange(ucbCourse) {
  if (ucbCourse.instructor.match(/intensive/i)) return; //filter out intensives for now because no way to differentiate redis key

  var tweetText = `Spot just opened up in ${ucbCourse.level} with ${ucbCourse.instructor}. Starts ${ucbCourse.start}. https://newyork.ucbtrainingcenter.com/course/open`;

  tClient.post('statuses/update', {status: tweetText},  function(error, tweet, response){
    if (error) throw error;
    console.log('Tweet sent out. Message: ' + tweet);
  });
}

module.exports = { tweetCourseChange: tweetCourseChange };