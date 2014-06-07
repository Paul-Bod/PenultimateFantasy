define([
    'require',
    './helpers/Menu',
    '../Utils/Translations',
    '../models/Routes'
], function (require, Menu, Translations, Routes) {
	var exports = {},
        controller;

    function renderPowerUpMenu(hero) {
        var attributes = $('<button id="attributes" type="button">' + Translations.translate('upgrademenu_attributes') + '</button>'),
            abilities = $('<button id="skills" type="button">' + Translations.translate('upgrademenu_skills') + '</button>'),
            items = [],
            funcs = [],
            title;

        title = $('<div id="attributestitle"><h3>' + Translations.translate('upgrademenu_title') + '</h3></div>');

        items.push(attributes);
        funcs.push(function() {require('../models/Routes').route('attributes', hero)});

        items.push(abilities);
        funcs.push(function() {require('../models/Routes').route('skills', hero)});
        
        Menu.logMenu(title, items, funcs);
        Menu.renderMenu(title, items, funcs);
    }

    exports.initialise = function (controllerInstance) {
        controller = controllerInstance;
    };

    exports.renderPowerUpCharacters = function() {
        var heroes = controller.getHeroes(),
            button,
            items = [],
            funcs = [],
            title;

        title = $('<div>');
        title.attr('id', 'attributestitle');
        title.append('<h3>' + Translations.translate('upgrademenu_heroes_title') + '</h3>');

        for (var hero in heroes) {
            button = $('<button>');
            button.attr('type', 'button');
            button.attr('id', heroes[hero]);
            button.html(heroes[hero]);

            funcs.push(function(e) {renderPowerUpMenu(e.srcElement.id)});
            items.push(button);
        }

        Menu.logMenu(title, items, funcs);
        Menu.renderMenu(title, items, funcs);
    };

    return exports;
});