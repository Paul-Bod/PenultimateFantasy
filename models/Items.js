define(['../utils/MoveSupport', '../utils/Translations'], function (MoveSupport, Translations) {

    var exports = {},

    items = {
        healthvial : {
            selectionType : MoveSupport.selectionTypes['one'],
            dollarCost : 100,
            baseExp : 3,
            details : { characterClass : 'al',
                        type           : 'item',
                        element        : 'heal' },

            execute :
                function (user, target) {

                    var hpIncrease = 100,
                        logMess,
                        action,
                        alchemistMultiplier = 2,
                        resistance = MoveSupport.getResistanceToMove(this.details.element, target.resistances),
                        moveResult = {
                            message : '',
                            alive : [],
                            dead : []
                        };

                    if (user.vitals.type == this.details.characterClass) {
                        hpIncrease *= alchemistMultiplier;
                    }

                    if (resistance === 'weak') {
                        target.receive.damage(hpIncrease);
                    }
                    else {
                        target.receive.hp(hpIncrease);
                    }

                    moveResult.message = Translations.translate('items_healthvile' + Translations.getResistanceKey(resistance) + '_message', [user.vitals.name, target.vitals.name, hpIncrease]);

                    var defenderDeathExp = MoveSupport.getOnDeathExperience(target.vitals.state, target.rewards.deathExperience);
                    MoveSupport.assignMoveExperienceToHero(user, defenderDeathExp, this.baseExp, this.details.characterClass);
                    moveResult[target.vitals.state].push(target.vitals.name);
                    return moveResult;
                }
        },

        bomb : {
            name: 'bomb',
            selectionType : MoveSupport.selectionTypes['one'],
            dollarCost : 50,
            baseExp : 3,
            details : { characterClass : 'al',
                        type           : 'item',
                        element        : 'none' },
            getBaseMultiplier: function(modifiers) {
                var alchemistMultiplier = 2.8;
                if (modifiers.activeType == this.details.characterClass) {
                    return alchemistMultiplier;
                }
                return 1.0;
            },
            baseDamage: 350,
            execute :
                function (user, target) {
                    return MoveSupport.executeOneOffensive(user, target, this);
                }
        },

        lifeorb : {
            selectionType : MoveSupport.selectionTypes['one'],
            dollarCost : 150,
            baseExp : 3,
            details : { characterClass : 'al',
                        type           : 'item',
                        element        : 'none' },

            execute :
                function(user, target) {
                    var moveResult = {
                        message : '',
                        alive : [],
                        dead : []
                    };
                    moveResult.message = Translations.translate('items_lifeorb_message', [user.vitals.name, target.vitals.name]);

                    target.receive.reviveInBattleWithPercentageOfHp(15);

                    var defenderDeathExp = MoveSupport.getOnDeathExperience(target.vitals.state, target.rewards.deathExperience);
                    MoveSupport.assignMoveExperienceToHero(user, defenderDeathExp, this.baseExp, this.details.characterClass);
                    moveResult[target.vitals.state].push(target.vitals.name);
                    return moveResult;
                }
        },

        magicvial : {
            selectionType : MoveSupport.selectionTypes['one'],
            dollarCost : 50,
            baseExp : 3,
            details : { characterClass : 'al',
                        type           : 'item',
                        element        : 'none' },

            execute :
                function(user, target) {
                    var mpIncrease = 50,
                        logMess,
                        alchemistMultiplier = 2;
                    var moveResult = {
                        message : '',
                        alive : [],
                        dead : []
                    };

                    if (user.vitals.type == this.details.characterClass) {
                        mpIncrease *= alchemistMultiplier;
                    }

                    target.receive.mp(mpIncrease);
                    moveResult.message = Translations.translate('items_magicvial_message', [user.vitals.name, target.vitals.name, mpIncrease]);

                    var defenderDeathExp = MoveSupport.getOnDeathExperience(target.vitals.state, target.rewards.deathExperience);
                    MoveSupport.assignMoveExperienceToHero(user, defenderDeathExp, this.baseExp, this.details.characterClass);
                    moveResult[target.vitals.state].push(target.vitals.name);
                    return moveResult;
                }
        }
    },

    partyItems = [];

    function debitPartyItems(itemIndex) {
        if (--partyItems[itemIndex].amount == 0) {
            partyItems.splice(itemIndex, 1);
        }
    }

    function getPartyItemIndexByName(name) {
        var index = -1;
        for (var item in partyItems) {
            if (partyItems[item].name === name) {
                index = item;
                break;
            }
        }
        return index;
    }

    exports.addPartyItem = function(item, amount) {
        if (typeof items[item] === 'undefined') {
            throw new Error('Not an item.');
        }

        if (typeof amount === 'undefined') {
            throw new Error('Must specify an amount when adding party items.');
        }

        var itemIndex = getPartyItemIndexByName(item);

        if (itemIndex > -1) {
            partyItems[itemIndex].amount += amount;
        }
        else {
            var newItem = {
                name   : item,
                amount : amount,
                selectionType : items[item].selectionType,
                type : items[item].details.type
            };
            partyItems.push(newItem);
            partyItems.sort(function(a, b) {
                if (a.name < b.name) {
                    return -1;
                }
                else {
                    return 1;
                }
            });
        }
    };

    exports.getItems = function () {
        return items;
    };

    exports.getPartyItems = function () {
        return partyItems;
    };

    exports.getAmountOfPartyItem = function (item) {

        var itemIndex = getPartyItemIndexByName(item),
            amount = 0;

        if (itemIndex > -1) {
            amount = partyItems[itemIndex].amount;
        }

        return amount;
    };

    exports.getItemCost = function (item) {

        return items[item].dollarCost;
    };

    exports.useItem = function (item, user, target, freebie) {

        if (!freebie) {
            debitPartyItems(getPartyItemIndexByName(item));
        }

        return items[item].execute(user, target);
    };

    return exports;
});
