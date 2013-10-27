define(['../utils/MoveSupport', '../lib/EventEmitter'], function (MoveSupport, Pubsub) {

    var exports = {};

    var abilities = {
        // white magic
        cure : {
            name           : 'cure',
            selectionType  : MoveSupport.selectionTypes['one'],
            mpCost         : 15,
            experienceCost : 100,
            baseExp        : 3,
            details        : { characterClass : 'wm',
                               type           : 'magic',
                               element        : 'heal' },
            getBaseMultiplier :
                function () {
                    return 1.2;
                },
            execute        :
                function (active, target) {
                    return MoveSupport.executeOne(MoveSupport.healing, active, target, this);
                }
        },

        healingwind : {
            name             : 'healingwind',
            selectionType    : MoveSupport.selectionTypes['all'],
            mpCost           : 30,
            experienceCost   : 200,
            baseExp          : 3,
            details          : { characterClass : 'wm',
                                 type           : 'magic',
                                 element        : 'heal' },
            getBaseMultiplier :
                function () {
                    return 1.1;
                },
            execute          : 
                function (active, target) {
                    return MoveSupport.executeMany(MoveSupport.healing, active, target, this);
                }
        },

        healerupt : {
            name           : 'healerupt',
            selectionType  : MoveSupport.selectionTypes['splash'],
            mpCost         : 30,
            experienceCost : 200,
            baseExp        : 3,
            details        : { characterClass : 'wm',
                               type           : 'magic',
                               element        : 'heal'},
            getBaseMultiplier :
                function (modifiers) {
                    var baseMultiplier = 1.1;
                    return baseMultiplier * (1 + (modifiers.splashIndex * -0.1));
                },
            execute        :
                function (active, defenders) {
                    return MoveSupport.executeSplash(MoveSupport.healing, active, defenders, this);
                }
        },

        // black magic
        fire : {
            name           : 'fire',
            selectionType  : MoveSupport.selectionTypes['one'],
            mpCost         : 15,
            experienceCost : 100,
            baseExp        : 3,
            details        : { characterClass : 'bm',
                               type           : 'magic',
                               element        : 'fire' },
            getBaseMultiplier :
                function () {
                    return 1.2;
                },
            execute        :
                function (active, defender) {
                    return MoveSupport.executeOne(MoveSupport.offensive, active, defender, this);
                }
        },

        implosion : {
            name           : 'implosion',
            selectionType  : MoveSupport.selectionTypes['splash'],
            mpCost         : 30,
            experienceCost : 200,
            baseExp        : 3,
            details        : { characterClass : 'bm',
                               type           : 'magic',
                               element        : 'fire'},
            getBaseMultiplier :
                function (modifiers) {
                    var baseMultiplier = 1.1;
                    return baseMultiplier * (1 + (modifiers.splashIndex * -0.1));
                },
            execute        :
                function (active, defenders) {
                    return MoveSupport.executeSplash(MoveSupport.offensive, active, defenders, this);
                }
        },

        thunder : {
            name           : 'thunder',
            selectionType  : MoveSupport.selectionTypes['one'],
            mpCost         : 15,
            experienceCost : 100,
            baseExp        : 3,
            details        : { characterClass : 'bm',
                               type           : 'magic',
                               element        : 'electric' },
            getBaseMultiplier :
                function () {
                    return 1.2;
                },
            execute        :
                function (active, defender) {
                    return MoveSupport.executeOne(MoveSupport.offensive, active, defender, this);
                }
        },

        storm : {
            name           : 'storm',
            selectionType  : MoveSupport.selectionTypes['all'],
            mpCost         : 30,
            experienceCost : 500,
            baseExp        : 3,
            details        : { characterClass : 'bm',
                               type           : 'magic',
                               element        : 'electric' },
            getBaseMultiplier :
                function () {
                    return 1.1;
                },
            execute        :
                function (active, defenders) {
                    return MoveSupport.executeMany(MoveSupport.offensive, active, defenders, this);
                }
        },

        blizzard : {
            name           : 'blizzard',
            selectionType  : MoveSupport.selectionTypes['one'],
            mpCost         : 15,
            experienceCost : 100,
            baseExp        : 3,
            details        : { characterClass : 'bm',
                               type           : 'magic',
                               element        : 'ice' },
            getBaseMultiplier :
                function () {
                    return 1.2;
                },
            execute        :
                function(active, defender) {
                    return MoveSupport.executeOne(MoveSupport.offensive, active, defender, this);
                }
        },

        // physical
        attack : {
            name           : 'attack',
            selectionType  : MoveSupport.selectionTypes['one'],
            mpCost         : '',
            experienceCost : 100,
            baseExp        : 3,
            details        : { characterClass : 'w',
                               type           : 'physical',
                               element        : 'physical' },
            getBaseMultiplier :
                function () {
                    return 1.2;
                },
            execute        :
                function(active, defender) {
                    return MoveSupport.executeOne(MoveSupport.offensive, active, defender, this);
                }
        },

        cannonball : {
            name           : 'cannonball',
            selectionType  : MoveSupport.selectionTypes['splash'],
            mpCost         : '',
            experienceCost : 200,
            baseExp        : 3,
            details        : { characterClass : 'b',
                               type           : 'skill',
                               element        : 'physical' },
            getBaseMultiplier :
                function (modifiers) {
                    var baseMultiplier = 0.9;
                    return baseMultiplier * (1 + (modifiers.splashIndex * -0.1));
                },
            execute        :
                function (active, defenders) {
                    return MoveSupport.executeSplash(MoveSupport.offensive, active, defenders, this);
                }
        },

        //neutral
        skip : {
            name           : 'skip',
            selectionType  : MoveSupport.selectionTypes['none'],
            mpCost         : '',
            experienceCost : 0,
            baseExp        : 0,
            details        : { characterClass : 'a',
                               type           : 'neutral',
                               element        : 'none' },
            execute        :
                function () {

                    Pubsub.emitEvent('abilities:skip');
                }
        }
    };

    exports.getAbilityPurchaseCost = function(ability, level) {
        return abilities[ability].experienceCost * level;
    };

    exports.purchaseAbility = function(student, ability) {
        var cost = exports.getAbilityPurchaseCost(ability, student.training.level);
        exports.teachAbility(student, ability);
        student.receive.expCost(cost);
    };

    exports.teachAbility = function(student, ability) {
        var cost,
            newAbility = {
                name          : ability,
                available     : true,
                selectionType : abilities[ability].selectionType,
                type : abilities[ability].details.type
            };

        switch (abilities[ability].details.type) {
            case 'magic':
                if (!student.abilities.magic) {
                    student.abilities.magic = [];
                }

                student.abilities.magic.push(newAbility);
                student.abilities.magic.sort(function(a, b) {
                    if (a.name < b.name) {
                        return -1;
                    }
                    else {
                        return 1;
                    }
                });
                break;
             case 'skill':
                if (!student.abilities.skills) {
                    student.abilities.skills = [];
                }

                student.abilities.skills.push(newAbility);
                student.abilities.skills.sort(function(a, b) {
                    if (a.name < b.name) {
                        return -1;
                    }
                    else {
                        return 1;
                    }
                });
                break;
            case 'physical':
            case 'neutral':
                student.abilities[ability] = newAbility;
                break;
        }
    };

    exports.getMpCost = function (ability) {
        return abilities[ability].mpCost;
    };

    exports.executeAbility = function (active, target, ability, freebie) {

        if (abilities[ability].mpCost && !freebie) {
            active.receive.mpCost(abilities[ability].mpCost);
        }

        return abilities[ability].execute(active, target, ability);
    };

    exports.executeNeutralAbility = function (ability) {

        return abilities[ability].execute();
    };

    exports.getAbilities = function () {
        abilities[ability].execute();
    };

    exports.selectionTypes = MoveSupport.selectionTypes;

    return exports;
});
