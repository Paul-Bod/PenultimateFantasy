define(['../utils/Translations', './helpers/Menu'], function (Translations, Menu) {
	var exports = {},
		controller;

	exports.initialise = function (controllerInstance) {
        controller = controllerInstance;
    };

	exports.renderShop = function (update) {
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
                exports.renderShop(true);
            });
        }

        if (!update) {
            Menu.logMenu(title, items, funcs);
        }
        Menu.renderMenu(title, items, funcs);
    };

	return exports;
});