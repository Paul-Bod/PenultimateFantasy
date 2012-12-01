define(function () {

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

    return exports;
});
