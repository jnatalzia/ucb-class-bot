module.exports = {
  generateCacheKeyForObj: function(obj) {
    return `${obj.id}_${obj.instructor.toLowerCase().replace(/ /g, "_")}`;
  }
};