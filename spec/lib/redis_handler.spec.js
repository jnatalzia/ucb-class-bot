var loadModule = require('../test_helpers/load_module').loadModule;

describe('RedisHandler', function() {
  var redisMock = require('../test_helpers/mocks/deps/redis.mock');
  var courseTweeterMock = require('../test_helpers/mocks/course_tweeter.mock');
  var RedisHandler= loadModule('lib/redis_handler.js', {redis: redisMock, "./course_tweeter": courseTweeterMock});

  describe('#checkRedisStateChange', () => {
    describe('when a value exists', () => {
      beforeEach(() => {
        RedisHandler.client.setMockData({'201_ucb_wed': 'Sold Out'});
      });
      describe('when the state has not changed', () => {
        it('doesn\'t attempt to set or tweet', () => {
          RedisHandler.checkRedisStateChange({key: '201_ucb_wed', state: 'Sold Out'});
          expect(RedisHandler.client.mockedCalls.set.length).toBe(0);
        });

      });
      describe('when the state has changed from Sold Out', () => {
        it('sets the new value in the redis store and tweets the new course', () => {
          RedisHandler.checkRedisStateChange({key: '201_ucb_wed', state: 'Course Details'});
          var setCalls = RedisHandler.client.mockedCalls.set;
          expect(setCalls.length).toBe(1);
          var setCall = setCalls[0];
          expect(setCall.args[0]).toBe('201_ucb_wed');
          expect(setCall.args[1]).toBe('Course Details');
          expect(RedisHandler.client.getMockData()['201_ucb_wed']).toBe('Course Details');
          var tweetCall = RedisHandler.CourseTweeter.mockedCalls.tweetCourseChange;
          expect(tweetCall.length).toBe(1);
          expect(tweetCall[0].args[0]).toEqual({key: '201_ucb_wed', state: 'Course Details'});
        });
      });
      describe('when the state has changed from open', () => {
        beforeEach(() => {
          RedisHandler.client.setMockData({'201_ucb_wed': 'Course Details'});
        });
        it('sets the new value in the redis store but doesn\'t tweet', () => {
          RedisHandler.checkRedisStateChange({key: '201_ucb_wed', state: 'Sold Out'});
          var setCalls = RedisHandler.client.mockedCalls.set;
          expect(setCalls.length).toBe(1);
          var setCall = setCalls[0];
          expect(setCall.args[0]).toBe('201_ucb_wed');
          expect(setCall.args[1]).toBe('Sold Out');
          expect(RedisHandler.client.getMockData()['201_ucb_wed']).toBe('Sold Out');
          expect(RedisHandler.CourseTweeter.mockedCalls.tweetCourseChange.length).toBe(0);
        });
      });
    });
    describe('when a value does not exist', () => {
      beforeEach(() => {
        RedisHandler.client.setMockData({});
      });

      it('properly sets a new course in the redis store', () => {
        RedisHandler.checkRedisStateChange({key: '201_ucb_wed', state: 'Course Details'});
        expect(RedisHandler.client.mockedCalls.set.length).toBe(1);
        var setCall = RedisHandler.client.mockedCalls.set[0];
        expect(setCall.args[0]).toBe('201_ucb_wed');
        expect(setCall.args[1]).toBe('Course Details');
        expect(RedisHandler.client.getMockData()['201_ucb_wed']).toBe('Course Details');
      });
    });
  });
  describe('#addEventListeners', () => {
    it('adds proper handlers for the `connect` and `error` events', () => {
      RedisHandler.addEventListeners();
      expect(typeof RedisHandler.client.eventListeners.connect[0]).toBe('function');
      expect(typeof RedisHandler.client.eventListeners.error[0]).toBe('function');
    });
  });
  describe('#clearOldCourses', () => {
    /** TODO: Introduce time mock and add in tests for clear method */
  });
  afterEach(() => {
    RedisHandler.client.clearMockedCalls();
    RedisHandler.CourseTweeter.clearMockedCalls();
  });
});
