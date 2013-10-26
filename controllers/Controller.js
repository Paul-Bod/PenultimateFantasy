define([
    '../views/View',
    '../models/Model',
    '../models/Abilities',
    '../models/Items',
    '../models/Money',
    '../lib/EventEmitter',
    '../models/Queue',
    '../models/BattleMenu',
    '../models/TargetSelection',
    '../utils/Utils'
], function (view, model, Abilities, Items, Money, Pubsub, Queue, BattleMenu, TargetSelection, Utils) {

    var exports = {},

        active,
        nextMove,

        _characters = {},
        enemies = {},
        _aliveEnemies = [],
        _deadEnemies = [],
        heroes = {},
        _aliveHeroes = [],
        _deadHeroes = [],

        targetTypes = {
            enemies          : 'enemies',
            enemiesWithFocus : 'enemies-',
            heroes           : 'heroes',
            heroesWithFocus  : 'heroes-',
            none             : 'none'
        },

        thisInstance,
        battleDelay = 2000,
        achievements = [],
        firstLoss = false,
        _battleContinue = 'continue',
        _battleWon = 'win',
        _battleLost = 'lose',
        _endBattleState = _battleContinue;

    TargetSelection.init(Abilities.selectionTypes);

    function moveEnd(result) {

        view.renderLog(result.message);
        updateLists(result);

        // update all characters as hero may have used mp
        view.renderEnemies(enemies);
        view.renderHeroes(heroes);
        view.clearBattleMenu();

        setTimeout(function() {

            _endBattleState = checkEndBattle();

            if (_endBattleState === _battleContinue) {

                if (active.vitals.baseType === 'hero') {
                    startActivityGauges.call(this);
                }

                if (active.vitals.state !== 'dead') {
                    active.activityGauge.restart(this);
                }
            }
            else {
                endBattle();
            }

            Pubsub.emitEvent('controller:move:end');
        }, battleDelay);
    }

    function finaliseExp() {
        operateOnAllHeroes.call(
            this,
            function (hero) {
                hero.receive.experience();
                return true;
            }
        );
    }

    function endBattleRewards() {
        var rewards = {
            'money'             : 0,
            'achievements'      : [],
            'experiencePerHero' : 0
        };

        rewards = operateOnAllEnemies.call(
            this,
            function (enemy) {
                if (typeof enemy.rewards.money !== 'undefined') {
                    Money.creditPartyMoney(enemy.rewards.money);
                    this.params.money += enemy.rewards.money
                }

                if (typeof enemy.rewards.achievements !== 'undefined') {
                    for (var achievement in enemy.rewards.achievements) {
                        achievements.push(enemy.rewards.achievements[achievement]);
                        this.params.achievements.push(enemy.rewards.achievements[achievement]);
                    }
                }

                if (typeof enemy.rewards.baseExperience !== 'undefined') {
                    this.params.experiencePerHero += enemy.rewards.baseExperience;
                }

                return true;
            },
            rewards
        );

        return rewards;
    }

    function endBattleExperience(experiencePerHero) {

        operateOnAllHeroes.call(
            this,
            function (hero) {
                if (hero.vitals.state === 'alive') {
                    hero.receive.collectedExp(experiencePerHero);
                }
                else {
                    hero.receive.collectedExp(0);
                }
                return true;
            }
        );
    }

    function endBattle() {

        var rewards = {},
            resultMessage = 'You Have Died!';

        Pubsub.emitEvent('controller:battle:end');

        operateOnAllHeroes.call(
            this,
            function (hero) {
                hero.activityGauge.stop();
                hero.activityGauge.clear();
                return true;
            }
        );

        operateOnAllEnemies.call(
            this,
            function (enemy) {
                enemy.activityGauge.stop();
                enemy.activityGauge.clear();
                return true;
            }
        );

        if (_endBattleState === _battleWon) {
            rewards = endBattleRewards();
            endBattleExperience(rewards.experiencePerHero);
            resultMessage = 'You Are Victorious!';
        }
        
        setTimeout(function(){view.renderBattleSummary(rewards, heroes, resultMessage)}, battleDelay);
    }

    function manageFirstLoss() {

        operateOnAllHeroes.call(
            this,
            function (hero) {
                hero.receive.reviveWithPercentageOfHp(100);
                return true;
            }
        );
    }

    /**
     * TODO: UTILS
     */
    function operateOnAllHeroes(operation, params) {
        if (typeof params === 'undefined') {
            params = {};
        }
        this.params = params;

        for (var hero in heroes) {
            if (!operation.call(this, heroes[hero])) {
                break;
            }
        }
        return this.params;
    }

    function operateOnAllAliveHeroes(operation, params) {
        if (typeof params === 'undefined') {
            params = {};
        }
        this.params = params;

        for (var hero in _aliveHeroes) {
            if (!operation.call(this, heroes[hero])) {
                break;
            }
        }
        return this.params;
    }

    function operateOnAllEnemies(operation, params) {
        if (typeof params === 'undefined') {
            params = {};
        }
        this.params = params;

        for (var enemy in enemies) {
            if (!operation.call(this, enemies[enemy])) {
                break;
            }
        }
        return this.params;
    }

    function operateOnAllAliveEnemies(operation, params) {
        if (typeof params === 'undefined') {
            params = {};
        }
        this.params = params;

        for (var enemy in _aliveEnemies) {
            if (!operation.call(this, enemies[enemy])) {
                break;
            }
        }
        return this.params;
    }

    exports.finishEndBattle = function() {
        var menuOptions = {};

        finaliseExp();
        enemies = [];

        if (_endBattleState === _battleLost) {
            if (firstLoss === 'yes') {
                firstLoss = 'no';
                manageFirstLoss();
                view.renderFirstLoss();
            }
            else {
                // need to check for game over condition here
                menuOptions.battle = false;
            }
        }

        view.renderMainMenu(menuOptions);
    };

    // Use signals to dispatch "dead" signals. When all expected dead signals are
    // received then go to endBattle() ?
    function checkEndBattle() {

        if (_aliveEnemies.length === 0) {
            return _battleWon;
        }
        else if (_aliveHeroes.length === 0) {

            if (firstLoss === false) {
                firstLoss = 'yes';
            }

            return _battleLost;
        }
        return _battleContinue;
    }

    function executeMove (type, name, defender, freebie) {

        var result = {};

        if (type === 'neutral') {
            Abilities.executeNeutralAbility(name);
        }
        else {
            if (type === 'item') {
                result = Items.useItem(name, active, defender, false);
            }
            else {
                result = Abilities.executeAbility(active, defender, name, false);
            }

        }

        return result;
    }

    function enemyMove() {
        
        var ability = active.selectAbility();
        var target = TargetSelection.selectRandomTarget(ability.selectionType, _aliveHeroes);
        var result = executeMove(ability.type, ability.name, target, true);
        var thisInstance = this;
        moveEnd.call(thisInstance, result);
    }

    function heroMove() {
        view.renderGoMessage(active.vitals.name);

        var battleMenu = BattleMenu.getBattleMenu(active);
        view.renderBattleMenu(battleMenu);

        var renderBattleMenu = function (menu) {view.renderBattleMenu(menu)};

        Pubsub.addListener('battlemenu:forward', renderBattleMenu);
        Pubsub.addListener('battlemenu:backward', renderBattleMenu);
        Pubsub.addListener('battlemenu:cancel', renderBattleMenu);
        Pubsub.addListener('battlemenu:action', function (characterName, abilityType, abilityName, selectionType) {

            var targetSelector = TargetSelection.getTargetSelector(selectionType, {
                'characters'   : _characters,
                'aliveEnemies' : _aliveEnemies,
                'aliveHeroes'  : _aliveHeroes
            });

            if (selectionType === Abilities.selectionTypes.none) {
                handleResult(null);
            }
            else {
                stopActivityGauges();
                view.renderSelectTarget(targetSelector);
                Pubsub.addListener('targetselection:selected', function (defender) {
                    handleResult(defender)
                    Pubsub.removeEvent('targetselection:selected');
                });
            }

            function handleResult (defender) {
                var result = executeMove(abilityType, abilityName, defender, false);
                Pubsub.removeEvent('battlemenu:action');

                // hero go end point
                var thisInstance = this;
                moveEnd.call(thisInstance, result);
            }
        });
    }

    function indexOfCharacter (characterList, name) {

        for (var index in characterList) {

            if (characterList[index].vitals.name === name) {
                return index;
            }
        }
    }

    function updateLists (result) {

        var charactersKilled = result.dead,
            charactersRevived = result.alive,
            heroTargetIndex,
            enemyTargetIndex;

        for (var character in charactersKilled) {

            Pubsub.emitEvent('controller:character:killed', [charactersKilled[character]]);

            heroTargetIndex = indexOfCharacter(_aliveHeroes, charactersKilled[character]);
            enemyTargetIndex = indexOfCharacter(_aliveEnemies, charactersKilled[character]);

            if (heroTargetIndex > -1) {
                _aliveHeroes.splice(heroTargetIndex, 1);
                _deadHeroes.push(charactersKilled[character]);
            }
            else if (enemyTargetIndex > -1) {
                _aliveEnemies.splice(enemyTargetIndex, 1);
                _deadEnemies.push(charactersKilled[character]);
            }
        }

        for (var character in charactersRevived) {

            heroTargetIndex = _deadHeroes.indexOf(charactersRevived[character]);
            enemyTargetIndex = _deadEnemies.indexOf(charactersRevived[character]);

            if (heroTargetIndex > -1) {
                _deadHeroes.splice(heroTargetIndex, 1);
                _aliveHeroes.push(charactersRevived[character]);
            }
            else if (enemyTargetIndex > -1) {
                _deadEnemies.splice(enemyTargetIndex, 1);
                _aliveEnemies.push(charactersRevived[character]);
            }
        }
    }

    function queueHandler(nextCharacter) {

        nextCharacter = nextCharacter.vitals.name;

        if (heroes[nextCharacter]) {
            active = heroes[nextCharacter];
            heroMove();
        }
        else if (enemies[nextCharacter]) {
            active = enemies[nextCharacter];
            enemyMove.call(this);
        }
    }

    Pubsub.addListener('queue:ready', queueHandler);

    exports.getBattleOptions = function() {
        var options = [];
        
        options.push('easy');
        options.push('yelloweyeddemon');

        if ($.inArray('defeated.yelloweyeddemon', achievements) > -1) {
            options.push('medium');
        }

        return options;
    };

    exports.initialiseHeroes = function(heroesToInitialise) {

        var name,
            typeKey;

        for (var type in heroesToInitialise) {

            name = heroesToInitialise[type];

            typeKey = type.split('.')[1];
            heroes[name] = new model.heroes[typeKey](name);

            if (heroes[name].training.baseExperienceSpendToNextLevel <= 0) {
                throw new Error('Hero\'s baseExperienceSpendToNextLevel must be > 0');
            }

            heroes[name].receive.checkMpLoss();
        }
    };

    function createRandomEnemies(min, max, difficulty) {
        var randomNum = Math.random(),
            numMonsters = Math.floor(randomNum * (max - min) + min),
            monsterTypes = model.getMonsterTypes(difficulty),
            randomType,
            typeSelection,
            monster;

        for (var i = 0; i<numMonsters; i++) {
            randomType = Math.floor(Math.random() * monsterTypes.length);
            typeSelection = monsterTypes[randomType];
            name = Utils.generateName(difficulty);
            monster = difficulty + typeSelection;

            enemies[name] = new model[monster](name);
            enemies[name].createBattleAbilities();

            _aliveEnemies.push(enemies[name]);
            _characters[name] = enemies[name];
        }
    };

    function initialiseEnemies(difficulty) {
        var randomNum = Math.random(),
            minMonsters,
            maxMonsters,
            numMonsters,
            monsterType;

        switch (difficulty) {
            case 'easy':
                minMonsters = 2;
                maxMonsters = 6;
                createRandomEnemies(minMonsters, maxMonsters, difficulty);
                break;
            case 'medium':
                minMonsters = 1;
                maxMonsters = 4;
                createRandomEnemies(minMonsters, maxMonsters, difficulty);
                break;
            case 'yelloweyeddemon':
                enemies['YellowEyedDemon'] = new model['yellowEyedDemon']();
                enemies['YellowEyedDemon'].createBattleAbilities();
                _aliveEnemies.push(enemies['YellowEyedDemon']);
                break;
            default:
                minMonseters = maxMonsters = 1;
                createRandomEnemies(minMonsters, maxMonsters, difficulty);
                break;
        }

    };

    function initialiseHeroes () {
        
        _aliveHeroes = [];

        operateOnAllHeroes.call(
            this,
            function (hero) {

                hero.createBattleAbilities();

                if (hero.vitals.state !== 'dead') {

                    _aliveHeroes.push(heroes[hero.vitals.name]);
                    _characters[hero.vitals.name] = heroes[hero.vitals.name];
                }

                return true;
            }
        );
    }

    exports.startBattle = function(difficulty) {

        _aliveEnemies = [];

        Pubsub.addListener('activitygauge:update', function (gaugeData) {

            activityGaugeHandler(gaugeData);
        });

        initialiseEnemies(difficulty);
        initialiseHeroes();

        view.renderBattleField();
        view.renderEnemies(enemies);
        view.renderHeroes(heroes);

        startActivityGauges.call(this);
    };

    function stopActivityGauges() {
        operateOnAllHeroes.call(
            this,
            function(hero) {
                if (hero.vitals.state === 'alive' && hero.activityGauge.getLastWidth() != 1) {
                    hero.activityGauge.stop();
                }
                return true;
            }
        );

        operateOnAllEnemies.call(
            this,
            function(enemy) {
                if (enemy.vitals.state === 'alive' && enemy.activityGauge.getLastWidth() != 1) {
                    enemy.activityGauge.stop();
                }
                return true;
            }
        );
    }

    function startActivityGauges() {
        operateOnAllHeroes.call(
            this,
            function(hero) {
                if (hero.vitals.state === 'alive' && hero.activityGauge.getLastWidth() != 1) {
                    hero.activityGauge.start();
                }
                return true;
            }
        );

        operateOnAllEnemies.call(
            this,
            function(enemy) {
                if (enemy.vitals.state === 'alive' && enemy.activityGauge.getLastWidth() != 1) {
                    enemy.activityGauge.start();
                }
                return true;
            }
        );
    }

    function activityGaugeHandler(gaugeData) {

        view.renderActivityGauge(gaugeData.character.vitals.name, gaugeData.lastWidth);
    }

    exports.getHeroes = function() {
        var names = operateOnAllHeroes.call(
            this,
            function(hero) {
                this.params.push(hero.vitals.name);
                return true;
            },
            []
        );

        return names;
    };

    exports.getAttributes = function(hero) {
        return heroes[hero].attributes;
    };

    /**
     * TODO: Very similar to Utils.createBattleAbilities.
     */
    function unpack(abilities) {
        var absObj = {};
        
        for (var ability in abilities) {
            if ($.isArray(abilities[ability])) {
                var superAbilities = abilities[ability]
                for (var subAbility in unpack(abilities[ability])) {
                    var name = superAbilities[subAbility].name;
                    absObj[name] = name;
                }
            }
            else {
                absObj[ability] = abilities[ability].name;
            }
        }

        return absObj;
    };

    exports.getAbilities = function(hero) {

        return unpack(heroes[hero].abilities);
    };

    exports.getAllAbilities = function() {

        return Abilities.getAbilities();
    };

    exports.getItems = function () {

        return Items.getItems();
    };

    exports.getAmountOfPartyItem = function (item) {

        return Items.getAmountOfPartyItem(item);
    };

    exports.purchaseItem = function (item) {

        var itemCost = Items.getItemCost(item);

        Money.debitPartyMoney(itemCost);

        Items.addPartyItem(item, 1);
    };

    exports.isItemAffordable = function (item) {

        var partyMoney = Money.getPartyMoney(),
            cost = Items.getItemCost(item),
            affordable = false;

        if (partyMoney >= cost) {
            affordable = true;
        }

        return affordable;
    };

    exports.getPartyMoney = function () {

        return Money.getPartyMoney();
    };

    exports.getExp = function(hero) {

        return heroes[hero].training.experience;
    };

    exports.getExpToLevelUp = function(hero) {
        return heroes[hero].training.experienceSpendToNextLevel;
    };

    exports.getAbilityUpgradeCost = function(ability, hero) {
        return Abilities.getAbilityPurchaseCost(ability, heroes[hero].training.level);
    };

    exports.isAbilityAffordable = function (ability, hero) {
        var heroExperience = exports.getExp(hero),
            abilityUpgradeCost = exports.getAbilityUpgradeCost(ability, hero),
            affordable = false;

        if (heroExperience >= abilityUpgradeCost) {
            affordable = true;
        }

        return affordable;
    };

    exports.purchaseAbility = function(hero, ab) {
        heroes[hero].receive.ability(ab);
    };

    exports.getAttributeUpgradeCost = function(hero) {
        return model.getAttributePurchaseCost(heroes[hero].training.level);
    };

    exports.isAttributeAffordable = function (hero) {
        var heroExperience = exports.getExp(hero),
            attributeUpgradeCost = exports.getAttributeUpgradeCost(hero),
            affordable = false;

        if (heroExperience >= attributeUpgradeCost) {
            affordable = true;
        }

        return affordable;
    };

    // checks against cost??
    exports.upgradeAttribute = function(hero, attr) {

        heroes[hero].receive.attrUpgrade(attr);
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

    exports.getHeroChoices = function () {

        var choices = [];
        for (var type in model.heroes) {
            choices.push(type);
        }
        return choices;
    };

    // it all starts here
    exports.start = function() {

        view.initialise(this);
        view.renderNameHeroes();
    };

    return exports;
});
