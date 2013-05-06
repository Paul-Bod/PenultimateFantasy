define(['./Translations'], function (Translations) {

    var exports = {},

        strongMultiplier = 0.5,
        weakMultiplier = 1.5,
        randomMax = 1.1,
        randomMin = 0.85;

    function getDefenseFactor(defense, defenderLevel) {
        return defense + (defense*0.66 * (1 + Math.floor(defenderLevel/25)));
    }

    function getAttackFactor(attackPower, attackerLevel) {
        return attackPower*5 + (attackPower*5 * (5 + Math.floor(attackerLevel/10)));
    }

    function getAttackMultiplier(attackPower) {
        return (attackPower/10) + 1;
    }

    function getRandomMultiplier() {
        return Math.random() * (randomMax-randomMin) + randomMin;
    }

    function getResistanceMultiplier(element, resistance) {

        if (resistance === 'strong') {
            return strongMultiplier;
        }
        else if (resistance === 'weak') {
            return weakMultiplier;
        }
        return 1;
    }

    function executeOffensive (active, defender, ability, modifiers) {

        var resistance = exports.getResistanceToMove(ability.details.element, defender.resistances);

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

        damage = exports.getDamageWithDefenseAndAttack(
            attack,
            active.training.level,
            defense,
            defender.training.level,
            ability.getBaseMultiplier(modifiers),
            ability.details.element,
            resistance
        );

        action = exports.getActionFromResistance(resistance);
        defender.receive[action](damage);

        logMess = Translations.translate('abilities_' + ability.name + Translations.getResistanceKey(resistance) + '_message', [active.vitals.name, defender.vitals.name, damage]);

        return logMess;
    }

    function executeHealing (active, target, spell, modifiers) {

        var resistance = exports.getResistanceToMove(spell.details.element, target.resistances),
            hpIncrease,
            logMess;

        hpIncrease = exports.getHealing(active.attributes.magic, active.training.level, spell.getBaseMultiplier(modifiers));
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
            active.receive.collectedExp(exports.getMoveExperience(baseExp, abilityCharacterClass, active));
        }
    }

    function executeOne (active, defender, ability, executeFunction) {

        var moveResult = {
            message : '',
            alive : [],
            dead : []
        };

        assignMoveExperienceToHero(active, ability.baseExp, ability.details.characterClass);
        moveResult.message = eval(executeFunction).call(null, active, defender, ability);
        moveResult[defender.vitals.state].push(defender.vitals.name);

        return moveResult;
    }

    

    function executeSplash (active, defenders, ability, executeFunction) {

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

            moveResult.message += eval(executeFunction).call(
                null,
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

    

    function executeMany (active, defenders, ability, executeFunction) {

        var moveResult = {
            message : '',
            alive : [],
            dead : []
        };

        for (var defender in defenders) {

            moveResult.message += eval(executeFunction).call(
                null,
                active,
                defenders[defender],
                ability
            ) + Translations.translate('format_break');

            moveResult[defenders[defender].vitals.state].push(defenders[defender].vitals.name);
        }

        assignMoveExperienceToHero(active, ability.baseExp, ability.details.characterClass);
        return moveResult;
    }

    exports.executeOneOffensive = function (active, defender, ability) {

        return executeOne(active, defender, ability, 'executeOffensive'); 
    };

    exports.executeOneHealing = function (active, defender, ability) {

        return executeOne(active, defender, ability, 'executeHealing');
    };

    exports.executeManyOffensive = function (active, defenders, ability) {

        return executeMany(active, defenders, ability, 'executeOffensive');
    };

    exports.executeManyHealing = function (active, defenders, ability) {

        return executeMany(active, defenders, ability, 'executeHealing');
    };

    exports.executeSplashOffensive = function (active, defenders, ability) {

        return executeSplash(active, defenders, ability, 'executeOffensive');
    };

    exports.executeSplashHealing = function (active, defenders, ability) {

        return executeSplash(active, defenders, ability, 'executeHealing');
    };

    exports.getDamageWithDefenseAndAttack = function(attackPower, attackerLevel, defense, defenderLevel, baseMultiplier, element, resistance) {

        var damage = getAttackMultiplier(attackPower) * (getAttackFactor(attackPower, attackerLevel)/getDefenseFactor(defense, defenderLevel));
        damage *= baseMultiplier;
        damage *= getResistanceMultiplier(element, resistance);
        damage *= getRandomMultiplier();

        return parseInt(Math.ceil(damage));
    };

    exports.getDamageWithDefense = function(baseDamage, defense, defenderLevel) {

        var damage = baseDamage / getDefenseFactor(defense, defenderLevel);
        damage *= getRandomMultiplier();
        return parseInt(Math.ceil(damage));
    };

    exports.getHealing = function(magic, level, baseMultiplier) {

        var hpIncrease = magic*2 + (magic*2 * (2 + Math.floor(level/10)));
        hpIncrease *= getAttackMultiplier(magic);
        hpIncrease *= baseMultiplier;
        hpIncrease *= getRandomMultiplier();
        return parseInt(Math.ceil(hpIncrease));
    };

    exports.getActionFromAbsorb = function(element, absorb) {
        if (exports.checkAbsorb(element, absorb)) {
            return 'hp';
        }
        return 'damage';
    };

    exports.getOnDeathExperience = function (defenderState, deathExperience) {

        var exp = 0;

        if (defenderState === 'dead') {
            exp += deathExperience;
        }

        return exp;
    };

    exports.getMoveExperience = function(moveExp, moveType, character) {

        var exp = 0;

        if (character.vitals.type == moveType) {
            moveExp *= 3;
        }
        
        exp += moveExp;

        return exp;
    }

    exports.checkImmune = function(element, immunities) {
        return !!($.inArray(element, immunities) + 1);
    }

    exports.checkStrong = function(element, strengths) {
        return !!($.inArray(element, strengths) + 1);
    }

    exports.checkAbsorb = function(element, absorb) {
        return !!($.inArray(element, absorb) + 1);
    }

    exports.checkWeak = function(element, weaknesses) {
        return !!($.inArray(element, weaknesses) + 1);
    }

    exports.getDeathExperienceFromRewards = function(rewards) {

        if (typeof rewards.deathExperience !== 'undefined') {
            return rewards.deathExperience;
        }

        return 0;
    };

    exports.getResistanceToMove = function(element, resistances) {

        if (this.checkImmune(element, resistances.immune)) {
            return 'immune';
        }

        if (this.checkAbsorb(element, resistances.absorb)) {
            return 'absorb';
        }

        if (this.checkWeak(element, resistances.weak)) {
            return 'weak';
        }

        if (this.checkStrong(element, resistances.strong)) {
            return 'strong';
        }

        return '';
    };

    exports.getActionFromResistance = function(resistance) {
        if (resistance === 'absorb') {
            return 'hp';
        }
        return 'damage';
    }

    exports.selectionTypes = {
        none             : 'none',
        one              : 'one',
        all              : 'all',
        allWithSelection : 'allWithSelection',
        splash           : 'splash'
    };

    return exports;
});
