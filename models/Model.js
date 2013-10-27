define(['./Abilities', './Items', '../utils/Utils', './ActivityGauge'], function (Abilities, Items, Utils, ActivityGauge) {

    var exports = {},

    easyMonsterTypes = ['Demon', 'IceDemon', 'FireDemon', 'ElectricDemon'],

    mediumMonsterTypes = ['Demon', 'IceDemon', 'FireDemon', 'Undead'],

    upgradePurchaseCost = function (cost, level) {
        return cost * level;
    },

    attributeExperienceCost = function () {
        return 50;
    },

    Character = (function () {
        function Character() {
            this.training = {
                level : ''
            };


            this.vitals = {
                name  : '',
                state : 'alive',
                hp    : '',
                maxHp : '',
                mp    : '',
                maxMp : '',
                type  : ''
            };

            this.attributes = {
                strength     : '',
                defense      : '',
                magic        : '',
                magicdefense : '',
                speed        : '',
                accuracy     : '',
                evasion      : ''
            };

            this.abilities = {};
            this.battleAbilities = [];


            Abilities.teachAbility(this, 'attack');

            this.resistances = { absorb : [],
                                 weak   : [],
                                 immune : [],
                                 strong : [] };

            this.rewards = {};

            this.activityGauge = new ActivityGauge(this);

            this.receive = {};

            this.receive.me = this;

            // these are helper functions. Should they be here?
            this.receive.checkHpLoss = function() {
                if (this.me.vitals.hp <= 0) {
                    this.me.vitals.hp = 0;
                    this.me.vitals.state = "dead";
                    this.me.activityGauge.stop();
                    this.me.activityGauge.clear();
                }
            };

            this.receive.checkHpGain = function () {

                if (this.me.vitals.hp > this.me.vitals.maxHp) {
                    this.me.vitals.hp = this.me.vitals.maxHp;
                }
            };

            this.receive.checkMpLoss = function() {
                if (this.me.vitals.mp < 0) {
                    this.me.vitals.mp = 0;
                }

                var magic = this.me.abilities.magic;

                for (var spellInstance in magic) {
                    if (this.me.vitals.mp < Abilities.getMpCost(magic[spellInstance].name)) {
                        this.me.abilities.magic[spellInstance].available = false;
                    }
                }
            };

            this.receive.checkMpGain = function () {

                if (this.me.vitals.mp > this.me.vitals.maxMp) {
                    this.me.vitals.mp = this.me.vitals.maxMp;
                }

                var magic = this.me.abilities.magic;

                for (var spellInstance in magic) {
                    if (this.me.vitals.mp > Abilities.getMpCost(magic[spellInstance].name)) {
                        this.me.abilities.magic[spellInstance].available = true;
                    }
                }
            };

            this.receive.damage = function(damage) {
                this.me.vitals.hp -= damage;
                this.checkHpLoss();
            };

            this.receive.mpCost = function(cost) {

                this.me.vitals.mp -= cost;
                this.checkMpLoss();
            };

            this.receive.hp = function(points) {
                this.me.vitals.hp += points;
                this.checkHpGain();
            };

            this.receive.reviveInBattleWithPercentageOfHp = function (percentage) {
                if (this.me.vitals.state === 'dead') {
                    this.me.vitals.state = 'alive';
                    this.me.receive.percentageOfHp(percentage);
                    this.me.activityGauge.start();
                }
            };

            this.receive.reviveWithPercentageOfHp = function (percentage) {
                if (this.me.vitals.state === 'dead') {
                    this.me.vitals.state = 'alive';
                    this.me.receive.percentageOfHp(percentage);
                }
            };

        }

        Character.prototype.createBattleAbilities = function () {
            this.battleAbilities = Utils.createBattleAbilities(this.abilities);
        };

        return Character;
    })(),

    Hero = (function () {
        function Hero(name) {
            Character.call(this);

            // initialise vital stats
            this.vitals.name = name;
            this.vitals.hp = this.vitals.maxHp = 300;
            this.vitals.mp = this.vitals.maxMp = 50;
            this.vitals.baseType = 'hero';

            // initialise attribute stats
            for (var attr in this.attributes) {
                this.attributes[attr] = 5;
            }

            // initialise training stats
            this.training.level = 1;

            this.training.experience = 0;
            this.training.collectedExp = 0;
            this.training.baseExperienceSpendToNextLevel = 200;
            this.training.experienceSpendToNextLevel = this.training.baseExperienceSpendToNextLevel;

            this.abilities.items = Items.getPartyItems();
            Abilities.teachAbility(this, 'skip');

            // define additional receive properties for heroes
            this.receive.mp = function(points) {
                this.me.vitals.mp += points;
                this.checkMpGain();
            };

            this.receive.experience = function() {
                    this.me.training.experience += this.me.training.collectedExp;
                    this.me.training.collectedExp = 0;
            };

            this.receive.collectedExp = function(exp) {
                    if (exp) {
                        this.me.training.collectedExp += exp;
                    }
                    else {
                        this.me.training.collectedExp = 0;
                    }
            };

            this.receive.attrUpgrade = function(attr) {

                var expCost = attributeExperienceCost(),
                    cost = upgradePurchaseCost(expCost, this.me.training.level);

                this.me.attributes[attr] += 1;
                this.me.receive.expCost(cost);
            };

            this.receive.ability = function(ability) {
                Abilities.purchaseAbility(this.me, ability);
            };

            this.receive.checkExp = function() {
                if (this.me.training.experience < 0) {
                    this.me.training.experience = 0;
                }
            };

            this.receive.expCost = function(exp) {
                var spent = exp,
                    diff;

                while (true) {
                    diff = this.me.training.experienceSpendToNextLevel - spent;

                    if (diff > 0) {
                        this.me.training.experienceSpendToNextLevel = diff;
                        break;
                    }
                    else if (diff == 0) {
                        this.me.receive.levelUp();
                        break;
                    }
                    else if (diff < 0) {
                        this.me.receive.levelUp();
                        spent = -diff;
                    }
                }

                this.me.training.experience -= exp;
                this.checkExp();
            };

            this.receive.levelUp = function() {
                this.me.training.level++;
                this.me.training.experienceSpendToNextLevel = this.me.training.baseExperienceSpendToNextLevel * this.me.training.level;
            };

            

            this.receive.maxHp = function() {
                this.me.vitals.hp = this.me.vitals.maxHp;
            };

            this.receive.percentageOfHp = function(percentage) {
                var multiplier = percentage / 100;
                var health = parseInt(this.me.vitals.maxHp * multiplier);
                this.me.vitals.hp = health;
            };
        }
        Hero.prototype = Object.create(Character.prototype);
        Hero.prototype.constructor = Hero;

        return Hero;
    })(),

    Mage = (function () {
        function Mage(name) {
            Hero.call(this, name);
            this.abilities.magic = [];
        }
        Mage.prototype = Object.create(Hero.prototype);
        Mage.prototype.constructor = Mage;

        return Mage;
    })(),

    Monster = (function () {
        function Monster(name) {
            Character.call(this);

            this.vitals.name = name;
            this.vitals.baseType = 'monster';
            this.vitals.element = 'none';

            this.training.baseExp = '';
            this.training.deathExp = '';
        }
        Monster.prototype = Object.create(Character.prototype);
        Monster.prototype.constructor = Monster;

        Monster.prototype.selectAbility = function() {
            var randomNum = Math.random(),
                randomAbility;

            randomAbility = Math.floor(randomNum * (this.battleAbilities.length));

            return this.battleAbilities[randomAbility];
        };

        return Monster;
    })(),

    EasyMonster = (function () {
        function EasyMonster(name) {
            Monster.call(this, name);

            // initialise vital stats
            this.vitals.hp = this.vitals.maxHp = 200;
            this.vitals.mp = this.vitals.maxMp = 0;

            // initialise attribute stats
            for (var attr in this.attributes) {
                this.attributes[attr] = 3;
            }

            this.attributes.strength = 10;

            // initialise training stats
            this.training.level = 1;
            this.training.baseExp = 50 * this.training.level;
            this.training.deathExp = 100 * this.training.level;

            this.rewards.money = 100;
            this.rewards.baseExperience = 50 * this.training.level;
            this.rewards.deathExperience = 100 * this.training.level;
        }
        EasyMonster.prototype = Object.create(Monster.prototype);
        EasyMonster.prototype.constructor = EasyMonster;

        return EasyMonster;
    })(),

    MediumMonster = (function () {
        function MediumMonster(name) {
            Monster.call(this, name);

            // initialise vital stats
            this.vitals.hp = this.vitals.maxHp = 300;
            this.vitals.mp = this.vitals.maxMp = 0;

            // initialise attribute stats
            for (var attr in this.attributes) {
                this.attributes[attr] = 5;
            }

            this.attributes.strength = 20;

            // initialise training stats
            this.training.level = 3;
            this.training.baseExp = 75 * this.training.level;
            this.training.deathExp = 125 * this.training.level;

            this.rewards.money = 150;
            this.rewards.baseExperience = 75 * this.training.level;
            this.rewards.deathExperience = 125 * this.training.level;
        }
        MediumMonster.prototype = Object.create(Monster.prototype);
        MediumMonster.prototype.constructor = MediumMonster;

        return MediumMonster;
    })(),

    Warrior = (function () {
        function Warrior(name) {
            Hero.call(this, name);

            this.vitals.type = 'w';
            this.attributes.strength = 10;
            this.vitals.hp = this.vitals.maxHp = 350;
        }
        Warrior.prototype = Object.create(Hero.prototype);
        Warrior.prototype.constructor = Warrior;

        return Warrior;
    })(),

    Beast = (function () {
        function Beast(name) {
            Hero.call(this, name);

            this.vitals.type = 'b';
            this.attributes.strength = 13;
            this.vitals.hp = this.vitals.maxHp = 400;

            Abilities.teachAbility(this, 'cannonball');
        }
        Beast.prototype = Object.create(Hero.prototype);
        Beast.prototype.constructor = Beast;

        return Beast;
    })(),

    Blackmage = (function () {
        function Blackmage(name) {
            Mage.call(this, name);

            this.vitals.type = 'bm';
            this.attributes.magic = 10;
            this.vitals.mp = this.vitals.maxMp = 100;

            Abilities.teachAbility(this, 'thunder');
            Abilities.teachAbility(this, 'fire');
            Abilities.teachAbility(this, 'blizzard');

            Abilities.teachAbility(this, 'storm');
            Abilities.teachAbility(this, 'implosion');
        }
        Blackmage.prototype = Object.create(Mage.prototype);
        Blackmage.prototype.constructor = Blackmage;

        return Blackmage;
    })(),

    Whitemage = (function () {
        function Whitemage(name) {
            Mage.call(this, name);

            this.vitals.type = 'wm';
            this.attributes.magic = 8;
            this.vitals.mp = this.vitals.maxMp = 75;

            Abilities.teachAbility(this, 'cure');
            Abilities.teachAbility(this, 'healingwind');
            Abilities.teachAbility(this, 'healerupt');
        }
        Whitemage.prototype = Object.create(Mage.prototype);
        Whitemage.prototype.constructor = Whitemage;

        return Whitemage;
    })(),

    Alchemist = (function () {
        function Alchemist(name) {
            Hero.call(this, name);

            this.vitals.type = 'al';

            Items.addPartyItem('lifeorb', 2);
            Items.addPartyItem('healthvial', 5);
            Items.addPartyItem('bomb', 10);
            Items.addPartyItem('magicvial', 5);
        }
        Alchemist.prototype = Object.create(Hero.prototype);
        Alchemist.prototype.constructor = Alchemist;

        return Alchemist;
    })();

    exports.heroes = {
        'warrior'   : Warrior,
        'beast'     : Beast,
        'blackmage' : Blackmage,
        'whitemage' : Whitemage,
        'alchemist' : Alchemist
    };

    exports.easyDemon = (function () {
        function EasyDemon(name) {
            EasyMonster.call(this, name);
            this.vitals.type = 'ed';
        }
        EasyDemon.prototype = Object.create(EasyMonster.prototype);
        EasyDemon.prototype.constructor = EasyDemon;

        return EasyDemon;
    })();

    exports.easyIceDemon = (function () {
        function EasyIceDemon(name) {
            EasyMonster.call(this, name);

            this.vitals.type = 'eid';
            this.vitals.element = 'ice';

            this.resistances.absorb.push('ice');
            this.resistances.weak.push('fire');

            Abilities.teachAbility(this, 'blizzard');
        }
        EasyIceDemon.prototype = Object.create(EasyMonster.prototype);
        EasyIceDemon.prototype.constructor = EasyIceDemon;

        return EasyIceDemon;
    })();

    exports.easyElectricDemon = (function () {
        function EasyElectricDemon(name) {
            EasyMonster.call(this, name);

            this.vitals.type = 'eed';
            this.vitals.element = 'electric';

            this.resistances.absorb.push('electric');

            Abilities.teachAbility(this, 'thunder');
        }
        EasyElectricDemon.prototype = Object.create(EasyMonster.prototype);
        EasyElectricDemon.prototype.constructor = EasyElectricDemon;

        return EasyElectricDemon;
    })();

    exports.easyFireDemon = (function () {
        function EasyFireDemon(name) {
            EasyMonster.call(this, name);

            this.vitals.type = 'efd';
            this.vitals.element = 'fire';

            this.resistances.absorb.push('fire');
            this.resistances.weak.push('ice');

            Abilities.teachAbility(this, 'fire');
        }
        EasyFireDemon.prototype = Object.create(EasyMonster.prototype);
        EasyFireDemon.prototype.constructor = EasyFireDemon;

        return EasyFireDemon;
    })();

    exports.mediumDemon = (function () {
        function MediumDemon(name) {
            MediumMonster.call(this, name);
            this.vitals.type = 'md';
        }
        MediumDemon.prototype = Object.create(MediumMonster.prototype);
        MediumDemon.prototype.constructor = MediumDemon;

        return MediumDemon;
    })();

    exports.mediumIceDemon = (function () {
        function MediumIceDemon(name) {
            MediumMonster.call(this, name);

            this.vitals.type = 'mid';
            this.vitals.element = 'ice';

            this.resistances.absorb.push('ice');
            this.resistances.weak.push('fire');
        }
        MediumIceDemon.prototype = Object.create(MediumMonster.prototype);
        MediumIceDemon.prototype.constructor = MediumIceDemon;

        return MediumIceDemon;
    })();

    exports.mediumFireDemon = (function () {
        function MediumFireDemon(name) {
            MediumMonster.call(this, name);

            this.vitals.type = 'mfd';
            this.vitals.element = 'fire';

            this.resistances.absorb.push('fire');
            this.resistances.weak.push('ice');
        }
        MediumFireDemon.prototype = Object.create(MediumMonster.prototype);
        MediumFireDemon.prototype.constructor = MediumFireDemon;

        return MediumFireDemon;
    })();

    exports.mediumUndead = (function () {
        function MediumUndead(name) {
            MediumMonster.call(this, name);

            this.vitals.type = 'mu';

            this.resistances.strong.push('physical');
            this.resistances.weak.push('heal');
        }
        MediumUndead.prototype = Object.create(MediumMonster.prototype);
        MediumUndead.prototype.constructor = MediumUndead;

        return MediumUndead;
    })();

    exports.yellowEyedDemon = (function () {
        function YellowEyedDemon() {
            Monster.call(this, name);

            this.vitals.hp = this.vitals.maxHp = 1000;
            this.vitals.mp = this.vitals.maxMp = 0;
            this.vitals.type = 'b';

            for (var attr in this.attributes) {
                this.attributes[attr] = 7;
            }

            this.attributes.strength = 15;
            this.attributes.magic = 15;

            this.training.level = 5;
            this.training.baseExp = 50 * this.training.level;
            this.training.deathExp = 100 * this.training.level;

            this.resistances.absorb.push('electric');

            this.rewards.achievements = ['defeated.yelloweyeddemon'];
            this.rewards.baseExperience = 50 * this.training.level;
            this.rewards.deathExperience = 100 * this.training.level;
            this.rewards.money = 500;

            Abilities.teachAbility(this, 'thunder');
            Abilities.teachAbility(this, 'fire');
            Abilities.teachAbility(this, 'blizzard');
        }
        YellowEyedDemon.prototype = Object.create(Monster.prototype);
        YellowEyedDemon.prototype.constructor = YellowEyedDemon;

        return YellowEyedDemon;
    })();

    exports.getAttributePurchaseCost = function(level) {

        var cost = attributeExperienceCost();
        return upgradePurchaseCost(cost, level);
    };

    exports.getMonsterTypes = function(difficulty) {
        var types;

        switch (difficulty) {
            case 'easy':
                types = easyMonsterTypes;
                break;
            case 'medium':
                types = mediumMonsterTypes;
                break;
            default:
                types = easyMonsterTypes;
                break;
        };
        return types;
    };

    return exports;
});
