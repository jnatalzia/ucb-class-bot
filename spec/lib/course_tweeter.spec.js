var loadModule = require('../test_helpers/load_module').loadModule;

describe('CourseTweeter', function() {
  var CourseTweeter;
  var twitterMock;

  beforeEach(function() {
    twitterMock = require('../test_helpers/mocks/deps/twitter.mock');

    // load the CourseTweeter with mock fs instead of real fs
    // publish all the private state as an object
    CourseTweeter = loadModule('lib/course_tweeter.js', {twitter: twitterMock});
  });

  describe('#tweetCourseChange', () => {
    it('creates a tweet with the proper content', () => {
      CourseTweeter.tweetCourseChange({
        instructor: 'Joe Natalzia',
        level: 'Level 201',
        url: '/courses/1235123',
        time: 'Wed 3-6pm'
      });
      expect(CourseTweeter.tClient.mockedCalls.post.length).toBe(1);
      var mockArgs = CourseTweeter.tClient.mockedCalls.post[0].args;
      expect(mockArgs[0]).toBe('statuses/update');
      expect(mockArgs[1]).toEqual({ status: 'Spot just opened up in Level 201 with Joe Natalzia. Wed 3-6pm | https://newyork.ucbtrainingcenter.com/courses/1235123 #UCB' });
    });
    describe('for an intensive', () => {
      it('uses the correct copy', () => {
        CourseTweeter.tweetCourseChange({
          instructor: 'Intensive',
          level: 'Level 201',
          url: '/courses/1235123',
          time: 'Wed 3-6pm'
        });
        expect(CourseTweeter.tClient.mockedCalls.post.length).toBe(1);
        var mockArgs = CourseTweeter.tClient.mockedCalls.post[0].args;
        expect(mockArgs[1]).toEqual({ status: 'Spot just opened up in an intensive for Level 201. Wed 3-6pm | https://newyork.ucbtrainingcenter.com/courses/1235123 #UCB' });
      });
    });
    afterEach(() => {
      CourseTweeter.tClient.clearMockedCalls();
    });
  });
});