define(function () {
	var exports = {},
		achievements = [];

	exports.achieve = function(achievement) {
		achievements.push(achievement);
	};

	exports.achieved = function() {
		return achievements;
	};

	return exports;
});