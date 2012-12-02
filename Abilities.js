define(['./MoveSupport', './Translations'], function (MoveSupport, Translations) {

    function executeOffensive (active, defender, ability, modifiers) {

        var resistance = MoveSupport.getResistanceToMove(ability.details.element, defender.resistances);

        if (resistance === 'immune') {
            return logMess = Translations.translate('abilities_' + ability.name + Translations.getResistanceKey(resistance) + '_message', [active.vitals.name, defender.vitals.name]);
        }
        
        var action,
            damage,
            attack,
            defense,
            logMess;

        if (ability.details.type === 'magic') {
            attack = active.attributes.magic;
            defense = defender.attributes.magicdefense;
        }
        else {
            attack = active.attributes.strength;
            defense = defender.attributes.defense;
        }

        damage = MoveSupport.getDamageWithDefenseAndAttack(
            attack,
            active.training.level,
            defense,
            defender.training.level,
            ability.getBaseMultiplier(modifiers),
            ability.details.element,
            resistance
        );

        action = MoveSupport.getActionFromResistance(resistance);
        defender.receive[action](damage);

        logMess = Translations.translate('abilities_' + ability.name + Translations.getResistanceKey(resistance) + '_message', [active.vitals.name, defender.vitals.name, damage]);

        return logMess;
    }

    function executeHealing (active, target, spell, modifiers) {

        var resistance = MoveSupport.getResistanceToMove(spell.details.element, target.resistances),
            hpIncrease,
            logMess;

        hpIncrease = MoveSupport.getHealing(active.attributes.magic, active.training.level, spell.getBaseMultiplier(modifiers));
        if (resistance === 'weak') {
            target.receive.damage(hpIncrease);
        }
        else {
            target.receive.hp(hpIncrease);
        }

        logMess = Translations.translate('abilities_' + spell.name + Translations.getResistanceKey(resistance) + '_message', [active.vitals.name, target.vitals.name, hpIncrease]);

        return logMess;
    }

    function assignMoveExperienceToHero (active, baseExp, abilityCharacterClass) {

        if (active.vitals.baseType === 'hero') {
            active.receive.collectedExp(MoveSupport.getMoveExperience(baseExp, abilityCharacterClass, active));
        }
    }

    function executeOneOffensive (active, defender, ability) {

        var moveResult = {
            message : '',
            alive : [],
            dead : []
        };

        assignMoveExperienceToHero(active, ability.baseExp, ability.details.characterClass);
        moveResult.message = executeOffensive(active, defender, ability);
        moveResult[defender.vitals.state].push(defender.vitals.name);

        return moveResult;
    }

    function executeSplashOffensive (active, defenders, ability) {

        var moveResult = {
                message : '',
                alive : [],
                dead : []
            },
            targetDefenders = defenders.target,
            executionAbility = ability,
            splashIndex,
            offsetMultiplier;

        for (var index in targetDefenders) {

            offsetMultiplier = index < defenders.focusIndex ? -1 : 1;
            splashIndex = (index - defenders.focusIndex) * offsetMultiplier;

            moveResult.message += executeOffensive(
                active,
                targetDefenders[index],
                executionAbility,
                {'splashIndex' : splashIndex}
            ) + Translations.translate('format_break');

            moveResult[targetDefenders[index].vitals.state].push(targetDefenders[index].vitals.name);
        }

        assignMoveExperienceToHero(active, executionAbility.baseExp, executionAbility.details.characterClass);
        return moveResult;
    }

    function executeSplashHealing (active, defenders, ability) {

        var moveResult = {
                message : '',
                alive : [],
                dead : []
            },
            targetDefenders = defenders.target,
            executionAbility = ability,
            splashIndex,
            offsetMultiplier;

        for (var index in targetDefenders) {

            offsetMultiplier = index < defenders.focusIndex ? -1 : 1;
            splashIndex = (index - defenders.focusIndex) * offsetMultiplier;

            moveResult.message += executeHealing(
                active,
                targetDefenders[index],
                executionAbility,
                {'splashIndex' : splashIndex}
            ) + Translations.translate('format_break');

            moveResult[targetDefenders[index].vitals.state].push(targetDefenders[index].vitals.name);
        }

        assignMoveExperienceToHero(active, executionAbility.baseExp, executionAbility.details.characterClass);
        return moveResult;
    }

    function executeManyOffensive (active, defenders, ability) {

        var moveResult = {
            message : '',
            alive : [],
            dead : []
        };

        for (var defender in defenders) {
            moveResult.message += executeOffensive(active, defenders[defender], ability) + Translations.translate('format_break');
            moveResult[defenders[defender].vitals.state].push(defenders[defender].vitals.name);
        }

        assignMoveExperienceToHero(active, ability.baseExp, ability.details.characterClass);
        return moveResult;
    }

    function executeOneHealing (active, defender, ability) {

        var moveResult = {
            message : '',
            alive : [],
            dead : []
        };

        assignMoveExperienceToHero(active, ability.baseExp, ability.details.characterClass);
        moveResult.message = executeHealing(active, defender, ability);
        moveResult[defender.vitals.state].push(defender.vitals.name);

        return moveResult;
    }

    function executeManyHealing (active, defenders, ability) {

        var moveResult = {
            message : '',
            alive : [],
            dead : []
        };

        for (var defender in defenders) {
            moveResult.message += executeHealing(active, defenders[defender], ability) + Translations.translate('format_break');
            moveResult[defenders[defender].vitals.state].push(defenders[defender].vitals.name);
        }

        assignMoveExperienceToHero(active, ability.baseExp, ability.details.characterClass);
        return moveResult;
    }

    var exports = {};

    exports.selectionTypes = {
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

                    return executeOneHealing(active, target, this);
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
                    return executeManyHealing(active, target, this);
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

                    return executeSplashHealing(active, splashDefenders, this);
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

                    return executeOneOffensive(active, defender, this);
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

                    return executeSplashOffensive(active, splashDefenders, this);
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

                    return executeOneOffensive(active, defender, this);
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

                    return executeManyOffensive(active, defenders, this);
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

                    return executeOneOffensive(active, defender, this);
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

                    return executeOneOffensive(active, defender, this);
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
                               element        : 'physical'},
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

                    return executeSplashOffensive(active, splashDefenders, this);
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
                student.abilities[ability] = newAbility;
                break;
        }
    };

    exports.getMpCost = function(ability) {
        return abilities[ability].mpCost;
    };

    exports.executeAbility = function(active, target, ability, freebie) {

        if (abilities[ability].mpCost && !freebie) {
            active.receive.mpCost(abilities[ability].mpCost);
        }

        return abilities[ability].execute(active, target, ability);
    };

    exports.getAbilities = function() {
        return abilities;
    };

    return exports;
});
