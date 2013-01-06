define(['./MoveSupport', './EventEmitter'], function (MoveSupport, Pubsub) {

    var exports = {};

    exports.selectionTypes = {
        none             : 'none',
        one              : 'one',
        all              : 'all',
        allWithSelection : 'allWithSelection',
        splash           : 'splash'
    };

    var abilities = {
        // white magic
        cure : {
            name           : 'cure',
            selectionType  : exports.selectionTypes['one'],
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

                    return MoveSupport.executeOneHealing(active, target, this);
                }
        },

        healingwind : {
            name             : 'healingwind',
            selectionType    : exports.selectionTypes['all'],
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
                    return MoveSupport.executeManyHealing(active, target, this);
                }
        },

        healerupt : {
            name           : 'healerupt',
            selectionType  : exports.selectionTypes['splash'],
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

                    var splashDefenders = {};

                    for (var index in defenders.target) {

                        if (defenders.target[index].vitals.name === defenders.focus) {
                            splashDefenders.focusIndex = index;
                            break;
                        }
                    }

                    splashDefenders.target = defenders.target;
                    splashDefenders.focus = defenders.focus;

                    return MoveSupport.executeSplashHealing(active, splashDefenders, this);
                }
        },

        // black magic
        fire : {
            name           : 'fire',
            selectionType  : exports.selectionTypes['one'],
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

                    return MoveSupport.executeOneOffensive(active, defender, this);
                }
        },

        implosion : {
            name           : 'implosion',
            selectionType  : exports.selectionTypes['splash'],
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

                    var splashDefenders = {};

                    for (var index in defenders.target) {

                        if (defenders.target[index].vitals.name === defenders.focus) {
                            splashDefenders.focusIndex = index;
                            break;
                        }
                    }

                    splashDefenders.target = defenders.target;
                    splashDefenders.focus = defenders.focus;

                    return MoveSupport.executeSplashOffensive(active, splashDefenders, this);
                }
        },

        thunder : {
            name           : 'thunder',
            selectionType  : exports.selectionTypes['one'],
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

                    return MoveSupport.executeOneOffensive(active, defender, this);
                }
        },

        storm : {
            name           : 'storm',
            selectionType  : exports.selectionTypes['all'],
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

                    return MoveSupport.executeManyOffensive(active, defenders, this);
                }
        },

        blizzard : {
            name           : 'blizzard',
            selectionType  : exports.selectionTypes['one'],
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

                    return MoveSupport.executeOneOffensive(active, defender, this);
                }
        },

        // physical
        attack : {
            name           : 'attack',
            selectionType  : exports.selectionTypes['one'],
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

                    return MoveSupport.executeOneOffensive(active, defender, this);
                }
        },

        cannonball : {
            name           : 'cannonball',
            selectionType  : exports.selectionTypes['splash'],
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

                    var splashDefenders = {};

                    for (var index in defenders.target) {

                        if (defenders.target[index].vitals.name === defenders.focus) {
                            splashDefenders.focusIndex = index;
                            break;
                        }
                    }

                    splashDefenders.target = defenders.target;
                    splashDefenders.focus = defenders.focus;

                    return MoveSupport.executeSplashOffensive(active, splashDefenders, this);
                }
        },

        //neutral
        skip : {
            name           : 'skip',
            selectionType  : exports.selectionTypes['none'],
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
                selectionType : abilities[ability].selectionType
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

    return exports;
});
