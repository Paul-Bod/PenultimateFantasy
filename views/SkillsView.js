define([
	'./helpers/Menu',
	'./helpers/Hero',
	'../utils/Translations'
], function (Menu, Hero, Translations) {
	var exports = {},
		controller;

    exports.initialise = function (controllerInstance) {
		controller = controllerInstance;
	};

	exports.renderPurchaseAbilities = function(hero, update) {
        var heroAbs = controller.getAbilities(hero),
            abilities = controller.getAllAbilities(),
            cost,
            isAffordable,
            disabled,
            button,
            heroExperience = controller.getExp(hero),
            title,
            funcs = [],
            items = [];
        if (typeof update === 'undefined') {
            update = false;
        }
        title = $('<div id="abilitiestitle"><h3>' + Translations.translate('abilitiesupgrade_title') + '</h3>'
            + Hero.renderExperience(hero, heroExperience)
            + Hero.renderExperienceToLevelUp(hero, controller.getExpToLevelUp(hero))
            + '</div>');
        for (ability in abilities) {
            button = $('<button id="' + ability + '" type="button">' + ability + '</button>');
            
            if (heroAbs[ability]) {
                button.css('border-color', 'blue', 'border-width', '5px');
                funcs.push(null);
            }
            else {
                cost = controller.getAbilityUpgradeCost(ability, hero);
                button.append(' ', cost);
                isAffordable = controller.isAbilityAffordable(ability, hero);
                if (isAffordable) {
                    disabled = null;
                }
                else {
                    disabled = 'disabled';
                }
                button.attr('disabled', disabled);
                funcs.push(function (e) {
                    controller.purchaseAbility(hero, e.srcElement.id);
                    exports.renderPurchaseAbilities(hero, true);
                });
            }
            items.push(button);
        }
        if (!update) {
            Menu.logMenu(title, items, funcs);
        }
        Menu.renderMenu(title, items, funcs);
    };

    return exports;
});