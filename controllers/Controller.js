define([
    '../views/View',
    '../models/Model',
    '../lib/EventEmitter',
    '../utils/Utils',
    '../models/Achievements'
], function (view, model, Pubsub, Utils, Achievements) {

    var exports = {},

        
        nextMove,

        
        
        
        
        

        targetTypes = {
            enemies          : 'enemies',
            enemiesWithFocus : 'enemies-',
            heroes           : 'heroes',
            heroesWithFocus  : 'heroes-',
            none             : 'none'
        };
        
        





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
    };

    exports.getAbilities = function(hero) {

        return unpack(heroes[hero].abilities);
    };

    exports.getAllAbilities = function() {

        return Abilities.getAbilities();
    };

    exports.getItems = function () {

        return Items.getItems();
    };

    exports.getAmountOfPartyItem = function (item) {

        return Items.getAmountOfPartyItem(item);
    };

    exports.purchaseItem = function (item) {

        var itemCost = Items.getItemCost(item);

        Money.debitPartyMoney(itemCost);

        Items.addPartyItem(item, 1);
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

    exports.getPartyMoney = function () {

        return Money.getPartyMoney();
    };

    exports.getAbilityUpgradeCost = function(ability, hero) {
        return Abilities.getAbilityPurchaseCost(ability, heroes[hero].training.level);
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
        heroes[hero].receive.ability(ab);
    };

    /*
     * @param selection either a string for top level menu options or an array
     * index for sub options
     */ 
    function getBattleCost(abilityNumber, abilityName, superAction) {
        var cost;
        switch (superAction) {
            case 'items':
                cost = active.abilities.items[abilityNumber].amount;
                break;
            default:
                cost = Abilities.getMpCost(abilityName);
                break;
        }
        return cost;
    };

    return exports;
});
