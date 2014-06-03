define([
    'require',
	'../views/IndexView',
	'../models/Model',
	'../models/Heroes',
	'../utils/Translations',
    '../models/Routes'
], function(require, view, model, Heroes, Translations, Routes) {

console.log(Routes);
	var exports = {};

    exports.action = function() {
        view.initialise(this);
        view.renderNameHeroes();
    };

    exports.getHeroChoices = function () {
        var choices = [];
        for (var type in model.heroes) {
            choices.push(type);
        }
        return choices;
    };

    exports.nameHeroesHandler = function (heroTypes, heroNames) {
        var errors = [],
            names = {},
            heroes = {},
            typeKey;

        heroNames.each(function (key, element) {

            if (names[element.value]) {
                errors.push(Translations.translate('nameheroes_errors_samename', [heroTypes[key].value, element.value]));
            }

            if (element.value.length == 0 || element.value.length > 10) {
                errors.push(Translations.translate('nameheroes_errors_length', [heroTypes[key].value]));
            }

            names[element.value] = element.value;

            typeKey = key + '.' + heroTypes[key].value;
            heroes[typeKey] = element.value;
        });

        if (errors.length > 0) {
        	view.renderErrors(errors);
        }
        else {
        	Heroes.initialise(heroes);
            require('../models/Routes').route('main');
        }
    };

    return exports;
});