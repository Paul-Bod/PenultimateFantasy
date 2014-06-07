define(['../utils/Translations'], function (Translations) {
    var exports = {},
        controller,
        battleMenus = [],
        battleMenuCounter = -1,
        superActions = [],
        saCounter = -1,
        _this = this, /* need consistant approach to this */

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
