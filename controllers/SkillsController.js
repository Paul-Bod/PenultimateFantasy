define([
    '../views/SkillsView',
    '../models/Abilities',
    '../models/Heroes'
], function (View, Abilities, Heroes) {
	var exports = {};

	/**
     * TODO: Very similar to Utils.createBattleAbilities.
     */
    function unpack(abilities) {
        var absObj = {};
        
        for (var ability in abilities) {
            if ($.isArray(abilities[ability])) {
                var superAbilities = abilities[ability]
                for (var subAbility in unpack(abilities[ability])) {
                    var name = superAbilities[subAbility].name;
                    absObj[name] = name;
                }
            }
            else {
                absObj[ability] = abilities[ability].name;
            }
        }

        return absObj;
    }

	exports.action = function (hero) {
		View.initialise(this);
		View.renderPurchaseAbilities(hero);
	};

	exports.getAbilities = function(hero) {
        return unpack(Heroes.get()[hero].abilities);
    };

    exports.getAllAbilities = function() {
        return Abilities.getAbilities();
    };

    exports.getExp = function(hero) {
        return Heroes.get()[hero].training.experience;
    };

    exports.getExpToLevelUp = function(hero) {
        return Heroes.get()[hero].training.experienceSpendToNextLevel;
    };

    exports.getAbilityUpgradeCost = function(ability, hero) {
        return Abilities.getAbilityPurchaseCost(ability, Heroes.get()[hero].training.level);
    };

    exports.isAbilityAffordable = function (ability, hero) {
        var heroExperience = exports.getExp(hero),
            abilityUpgradeCost = exports.getAbilityUpgradeCost(ability, hero),
            affordable = false;

        if (heroExperience >= abilityUpgradeCost) {
            affordable = true;
        }

        return affordable;
    };

    exports.purchaseAbility = function(hero, ab) {
        Heroes.get()[hero].receive.ability(ab);
    };

	return exports;
});