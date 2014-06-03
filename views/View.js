define(['../utils/Translations'], function (Translations) {
    var exports = {},
        controller,
        battleMenus = [],
        battleMenuCounter = -1,
        superActions = [],
        saCounter = -1,
        _this = this, /* need consistant approach to this */

        renderPurchaseAbilities = function(hero, update) {

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
                update = false;renderPurchaseAbilities
            }

            title = $('<div id="abilitiestitle"><h3>' + Translations.translate('abilitiesupgrade_title') + '</h3>'
                + renderHeroExperience(hero, heroExperience)
                + renderHeroExperienceToLevelUp(hero)
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
                        renderPurchaseAbilities(hero, true);
                    });
                }
                items.push(button);
            }

            if (!update) {
                logMenu(title, items, funcs);
            }
            renderMenu(title, items, funcs);
        },

        renderShop = function (update) {
            var items = [],
                funcs = [],
                title,
                itemsForPurchase = controller.getItems(),
                button,
                isAffordable,
                disabled;

            if (typeof update === 'undefined') {
                updte = false;
            }

            title = $('<div id="shoptitle"><h3>' + Translations.translate('shop_title') + '</h3>'
                + '<p>' + Translations.translate('shop_dollars', [controller.getPartyMoney()]) + '</p></div>');

            for (item in itemsForPurchase) {
                button = $('<button id="'
                    + item
                    + '" type="button">'
                    + item
                    + ' ' + itemsForPurchase[item].dollarCost
                    + ' ' + controller.getAmountOfPartyItem(item)
                    + '</button>');

                isAffordable = controller.isItemAffordable(item);

                if (isAffordable) {
                    disabled = null;
                }
                else {
                    disabled = 'disabled';
                }

                button.attr('disabled', disabled);

                items.push(button);
                funcs.push(function (e) {
                    controller.purchaseItem(e.srcElement.id);
                    renderShop(true);
                });
            }

            if (!update) {
                logMenu(title, items, funcs);
            }
            renderMenu(title, items, funcs);
        },

        logBattleMenu = function(menu) {
            battleMenus.push(menu);
            battleMenuCounter++;
        },

        logSuperAction = function(topMenu) {
            superActions.push(topMenu);
            saCounter++;
        },

        unlogBattleMenu = function() {
            battleMenus.splice(battleMenuCounter, 1);
            battleMenuCounter--;
        },

        unlogSuperAction = function() {
            superActions.splice(saCounter, 1);
            saCounter--;
        },

    return exports;
});
