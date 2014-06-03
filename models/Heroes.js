define(['../models/Model'], function (model) {
	var exports = {},
		heroes = {};

	exports.initialise = function(heroesToInitialise) {

        var name,
            typeKey;

        for (var type in heroesToInitialise) {

            name = heroesToInitialise[type];

            typeKey = type.split('.')[1];
            heroes[name] = new model.heroes[typeKey](name);

            if (heroes[name].training.baseExperienceSpendToNextLevel <= 0) {
                throw new Error('Hero\'s baseExperienceSpendToNextLevel must be > 0');
            }

            heroes[name].receive.checkMpLoss();
        }
    };

    exports.get = function () {
    	return heroes;
    };

    return exports;
});