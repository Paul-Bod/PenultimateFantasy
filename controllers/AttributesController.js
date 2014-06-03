define([
	'../views/AttributesView',
	'../models/Heroes',
	'../models/Model'
], function (View, Heroes, Model) {
	var exports = {};

	exports.action = function (hero) {
		View.initialise(this);
		View.renderAttributes(hero);
	};

    exports.getAttributes = function(hero) {
        return Heroes.get()[hero].attributes;
    };

    exports.getAttributeUpgradeCost = function(hero) {
        return Model.getAttributePurchaseCost(Heroes.get()[hero].training.level);
    };

    exports.isAttributeAffordable = function (hero) {
        var heroExperience = exports.getExp(hero),
            attributeUpgradeCost = exports.getAttributeUpgradeCost(hero),
            affordable = false;

        if (heroExperience >= attributeUpgradeCost) {
            affordable = true;
        }

        return affordable;
    };

    // checks against cost??
    exports.upgradeAttribute = function(hero, attr) {
        Heroes.get()[hero].receive.attrUpgrade(attr);
    };

    exports.getExp = function(hero) {
        return Heroes.get()[hero].training.experience;
    };

    exports.getExpToLevelUp = function(hero) {
        return Heroes.get()[hero].training.experienceSpendToNextLevel;
    };

	return exports;
});