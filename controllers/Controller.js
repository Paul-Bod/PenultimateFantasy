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
