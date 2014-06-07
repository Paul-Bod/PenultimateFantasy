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
