define(['./MoveSupport', './Translations'], function (MoveSupport, Translations) {

    function executeOffensive (active, defender, ability) {

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
        else if (ability.details.type === 'physical') {
            attack = active.attributes.strength;
            defense = defender.attributes.defense;
        }

        damage = MoveSupport.getDamageWithDefenseAndAttack(
            attack,
            active.training.level,
            defense,
            defender.training.level,
            ability.baseMultiplier,
            ability.details.element,
            resistance
        );

        action = MoveSupport.getActionFromResistance(resistance);
        defender.receive[action](damage);

        logMess = Translations.translate('abilities_' + ability.name + Translations.getResistanceKey(resistance) + '_message', [active.vitals.name, defender.vitals.name, damage]);

        if (active.vitals.baseType === 'hero') {
            active.receive.collectedExp(MoveSupport.getOnDeathExperience(defender.vitals.state, MoveSupport.getDeathExperienceFromRewards(defender.rewards)));
        }

        return logMess;
    }

    function executeHealing (active, target, spell) {

        var resistance = MoveSupport.getResistanceToMove(spell.details.element, target.resistances),
            hpIncrease,
            logMess;

        hpIncrease = MoveSupport.getHealing(active.attributes.magic, active.training.level, spell.baseMultiplier);
        if (resistance === 'weak') {
            target.receive.damage(hpIncrease);
        }
        else {
            target.receive.hp(hpIncrease);
        }

        logMess = Translations.translate('abilities_' + spell.name + Translations.getResistanceKey(resistance) + '_message', [active.vitals.name, target.vitals.name, hpIncrease]);

        MoveSupport.checkTotalMoveExperience(spell.baseExp, spell.details.characterClass, active);

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
            allWithSelection : 'allWithSelection'
        };

    var abilities = {
        // white magic
        cure : {
            name           : 'cure',
            selectionType  : exports.selectionTypes['one'],
            baseMultiplier : 1.2,
            mpCost         : 15,
            experienceCost : 100,
            baseExp        : 3,
            details        : { characterClass : 'wm',
                               type           : 'magic',
                               element        : 'heal' },
            execute        :
                function (active, target) {

                    return executeOneHealing(active, target, this);
                }
        },

        // black magic
        fire : {
            name           : 'fire',
            selectionType  : exports.selectionTypes['one'],
            baseMultiplier : 1.2,
            mpCost         : 15,
            experienceCost : 100,
            baseExp        : 3,
            details        : { characterClass : 'bm',
                               type           : 'magic',
                               element        : 'fire' },
            execute        :
                function (active, defender) {

                    return executeOneOffensive(active, defender, this);
                }
        },

        thunder : {
            name           : 'thunder',
            selectionType  : exports.selectionTypes['one'],
            baseMultiplier : 1.2,
            mpCost         : 15,
            experienceCost : 100,
            baseExp        : 3,
            details        : { characterClass : 'bm',
                               type           : 'magic',
                               element        : 'electric' },
            execute        :
                function (active, defender) {

                    return executeOneOffensive(active, defender, this);
                }
        },

        storm : {
            name           : 'storm',
            selectionType  : exports.selectionTypes['all'],
            baseMultiplier : 1.1,
            mpCost         : 30,
            experienceCost : 500,
            baseExp        : 3,
            details        : { characterClass : 'bm',
                               type           : 'magic',
                               element        : 'electric' },
            execute        :
                function (active, defenders) {

                    return executeManyOffensive(active, defenders, this);
                }
        },

        blizzard : {
            name           : 'blizzard',
            selectionType  : exports.selectionTypes['one'],
            baseMultiplier : 1.2,
            mpCost         : 15,
            experienceCost : 100,
            baseExp        : 3,
            details        : { characterClass : 'bm',
                               type           : 'magic',
                               element        : 'ice' },
            execute        :
                function(active, defender) {

                    return executeOneOffensive(active, defender, this);
                }
        },

        // physical
        attack : {
            name           : 'attack',
            selectionType  : exports.selectionTypes['one'],
            baseMultiplier : 1.2,
            mpCost         : '',
            experienceCost : 100,
            baseExp        : 3,
            details        : { characterClass : 'w',
                               type           : 'physical',
                               element        : 'physical' },
            execute        :
                function(active, defender) {

                    return executeOneOffensive(active, defender, this);
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
