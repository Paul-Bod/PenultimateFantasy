define(['require', '../views/MainView', '../models/Routes'], function (require, view, Routes) {
	var exports = {};

	exports.action = function () {
		var Routes = require('../models/Routes');

		view.renderMainMenu(function() {
			Routes.route('battle')
		},
		function() {
			Routes.route('powerup')
		},
		function () {
			Routes.route('shop')
		});
	};

	return exports;
});