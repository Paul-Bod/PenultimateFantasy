define(['./MoveSupport', './Translations'], function (MoveSupport, Translations) {

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
                        resistance = MoveSupport.getResistanceToMove(this.details.element, target.resistances);

                    if (user.vitals.type == this.details.characterClass) {
                        hpIncrease *= alchemistMultiplier;
                    }

                    action = MoveSupport.getActionFromResistance(resistance);
                    target.receive[action](hpIncrease);

                    logMess = Translations.translate('items_healthvile' + Translations.getResistanceKey(resistance) + '_message', [user.vitals.name, target.vitals.name, hpIncrease]);

                    MoveSupport.checkTotalMoveExperience(this.baseExp, this.details.characterClass, user);
                    return logMess;
                }
        },

        bomb : {
            selectionType : MoveSupport.selectionTypes['one'],
            dollarCost : 50,
            baseExp : 3,
            details : { characterClass : 'al',
                        type           : 'item',
                        element        : 'none' },

            execute :
                function (user, target) {

                    var baseDamage = 350,
                        damage,
                        logMess,
                        alchemistMultiplier = 2.8;

                    damage = MoveSupport.getDamageWithDefense(baseDamage, target.attributes.defense, target.training.level);

                    if (user.vitals.type == this.details.characterClass) {
                        damage *= alchemistMultiplier;
                        damage = parseInt(Math.ceil(damage));
                    }

                    target.receive.damage(damage);
                    logMess = Translations.translate('items_bomb_message', [user.vitals.name, target.vitals.name, damage]);

                    MoveSupport.checkTotalMoveExperience(
                        this.baseExp,
                        this.details.characterClass,
                        user,
                        { state    : target.vitals.state,
                          deathExp : MoveSupport.getDeathExperienceFromRewards(target.rewards) }
                    );

                    return logMess;
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
                    var logMess = Translations.translate('items_lifeorb_message', [user.vitals.name, target.vitals.name]);

                    target.receive.reviveInBattleWithPercentageOfHp(15);

                    MoveSupport.checkTotalMoveExperience(this.baseExp, this.details.characterClass, user);
                    return logMess;
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

                    if (user.vitals.type == this.details.characterClass) {
                        mpIncrease *= alchemistMultiplier;
                    }

                    target.receive.mp(mpIncrease);
                    logMess = Translations.translate('items_magicvial_message', [user.vitals.name, target.vitals.name, mpIncrease]);

                    MoveSupport.checkTotalMoveExperience(this.baseExp, this.details.characterClass, user);
                    return logMess;
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
