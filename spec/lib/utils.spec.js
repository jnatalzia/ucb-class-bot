var Utils = require('../../lib/utils');

describe('Utils', function() {
  describe('#generateRedisKeyForCourse', function() {
    it('returns a correct redis key', function() {
      var testObj = {
        id: '164527',
        instructor: "Joe Natalzia",
        type: 'improv'
      };

      expect(Utils.generateRedisKeyForCourse(testObj)).toBe('164527_joe_natalzia_improv');
    });
  });
});