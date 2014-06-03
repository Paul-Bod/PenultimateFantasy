define([
	'../views/PowerUpView',
	'../models/Heroes',
	'../utils/Utils'
], function (View, Heroes, Utils) {
	var exports = {};

	exports.action = function () {
		View.initialise(this);
		View.renderPowerUpCharacters();
	};

    exports.getHeroes = function() {
        var names = Utils.operateOnAll.call(
            this,
            Heroes.get(),
            function(hero) {
                this.params.push(hero.vitals.name);
                return true;
            },
            []
        );

        return names;
    };

	return exports;
});