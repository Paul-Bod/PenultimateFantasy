define([
	'../views/ShopView',
	'../models/Items',
	'../models/Money'
], function (View, Items, Money) {
	var exports = {};

	exports.action = function () {
		View.initialise(this);
		View.renderShop()
	};

	exports.getItems = function () {
        return Items.getItems();
    };

    exports.getPartyMoney = function () {
        return Money.getPartyMoney();
    };

    exports.getAmountOfPartyItem = function (item) {
        return Items.getAmountOfPartyItem(item);
    };

    exports.isItemAffordable = function (item) {
        var partyMoney = Money.getPartyMoney(),
            cost = Items.getItemCost(item),
            affordable = false;

        if (partyMoney >= cost) {
            affordable = true;
        }

        return affordable;
    };

    exports.purchaseItem = function (item) {
        var itemCost = Items.getItemCost(item);
        Money.debitPartyMoney(itemCost);
        Items.addPartyItem(item, 1);
    };

	return exports;
});