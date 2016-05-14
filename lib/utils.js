module.exports = {
  generateCacheKeyForCourse: function(course) {
    return `${course.id}_${course.instructor.toLowerCase().replace(/ /g, "_")}_${course.type}`;
  }
};