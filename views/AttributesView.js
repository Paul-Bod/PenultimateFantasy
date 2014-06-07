define([
	'./helpers/Menu',
    './helpers/Hero',
    '../Utils/Translations'
], function (Menu, Hero, Translations) {
	var exports = {},
		controller;

	exports.initialise = function (controllerInstance) {
		controller = controllerInstance;
	};

    exports.renderAttributes = function(hero, update) {
        var attributes = controller.getAttributes(hero),
            cost = controller.getAttributeUpgradeCost(hero),
            isAffordable = controller.isAttributeAffordable(hero),
            button,
            heroExp = controller.getExp(hero),
            disabled = null,
            title,
            funcs = [],
            items = [];

        if (typeof update === 'undefined') {
            update = false;
        }

        title = $('<div id="attributestitle"><h3>' + Translations.translate('attributesupgrade_title') + '</h3>'
              + '<p>' + Translations.translate('attributesupgrade_cost', [cost]) + '</p>'
              + Hero.renderExperience(hero, heroExp)
              + Hero.renderExperienceToLevelUp(hero, controller.getExpToLevelUp(hero))
              + '</div>');

        if (!isAffordable) {
            disabled = 'disabled';
        }

        for (attribute in attributes) {
            button = $('<button id="'
                + attribute
                + '" type="button">'
                + attribute
                + ' ' + attributes[attribute]
                + '</button>');

            button.attr('disabled', disabled);

            funcs.push(function(e) {controller.upgradeAttribute(hero, e.srcElement.id); renderAttributes(hero, true);});
            items.push(button);
        }

        if (!update) {
            Menu.logMenu(title, items, funcs);
        }
        Menu.renderMenu(title, items, funcs);
    };

    return exports;
});