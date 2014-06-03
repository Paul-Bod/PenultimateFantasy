define([
	'../views/BattleView',
	'../models/Model',
    '../models/Heroes',
	'../models/Queue',
	'../models/Abilities',
	'../models/Items',
	'../models/BattleMenu',
	'../models/Achievements',
	'../models/Money',
	'../lib/EventEmitter',
	'../models/TargetSelection',
	'../utils/Utils',
	'../models/Routes'
], function (view, model, Heroes, Queue, Abilities, Items, BattleMenu, Achievements, Money, Pubsub, TargetSelection, Utils, Routes) {
	var exports = {},
		active,
		enemies = {},
		_aliveEnemies = [],
		_aliveHeroes = [],
		_deadEnemies = [],
		_deadHeroes = [],
		_characters = {},
		_battleContinue = 'continue',
        _battleWon = 'win',
        _battleLost = 'lose',
        _endBattleState = _battleContinue,
        thisInstance,
        battleDelay = 2000,
        firstLoss = false;
		

    function battleOptions() {
        var options = [];
        
        options.push('easy');
        options.push('yelloweyeddemon');

        if ($.inArray('defeated.yelloweyeddemon', Achievements.achieved()) > -1) {
            options.push('medium');
        }

        return options;
    }

    function activityGaugeHandler(gaugeData) {
        view.renderActivityGauge(gaugeData.character.vitals.name, gaugeData.lastWidth);
    }

    function initialiseHeroes () {
        
        _aliveHeroes = [];

        Utils.operateOnAll.call(
            this,
            Heroes.get(),
            function (hero) {

                hero.createBattleAbilities();

                if (hero.vitals.state !== 'dead') {

                    _aliveHeroes.push(Heroes.get()[hero.vitals.name]);
                    _characters[hero.vitals.name] = Heroes.get()[hero.vitals.name];
                }

                return true;
            }
        );
    }

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

    }

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
    }

    function startActivityGauges() {
        Utils.operateOnAll.call(
            this,
            Heroes.get(),
            function(hero) {
                if (hero.vitals.state === 'alive' && hero.activityGauge.getLastWidth() != 1) {
                    hero.activityGauge.start();
                }
                return true;
            }
        );

        Utils.operateOnAll.call(
            this,
            enemies,
            function(enemy) {
                if (enemy.vitals.state === 'alive' && enemy.activityGauge.getLastWidth() != 1) {
                    enemy.activityGauge.start();
                }
                return true;
            }
        );
    }

    function stopActivityGauges() {
        Utils.operateOnAll.call(
            this,
            Heroes.get(),
            function(hero) {
                if (hero.vitals.state === 'alive' && hero.activityGauge.getLastWidth() != 1) {
                    hero.activityGauge.stop();
                }
                return true;
            }
        );

        Utils.operateOnAll.call(
            this,
            enemies,
            function(enemy) {
                if (enemy.vitals.state === 'alive' && enemy.activityGauge.getLastWidth() != 1) {
                    enemy.activityGauge.stop();
                }
                return true;
            }
        );
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
        Pubsub.addListener('battlemenu:cancel', function (menu) {
            view.removeSelectTarget();
            Pubsub.removeEvent('targetselection:selected');
            renderBattleMenu(menu);
        });
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
                Pubsub.removeEvent('battlemenu:forward');
                Pubsub.removeEvent('battlemenu:backward');
                Pubsub.removeEvent('battlemenu:cancel');

                // hero go end point
                var thisInstance = this;
                moveEnd.call(thisInstance, result);
            }
        });
    }

    function executeMove (type, name, defender, freebie) {

        var result = {};

        if (type === 'neutral') {
            result = Abilities.executeNeutralAbility(name, active);
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

    function moveEnd(result) {
        view.renderLog(result.message);

        // update all characters as hero may have used mp
        view.renderEnemies(enemies);
        view.renderHeroes(Heroes.get());
        view.clearBattleMenu();

        result.postMove.forEach(function (element, index, array) {
            element();
        });

        if (result.endMove === false) {
            return true;
        }

        updateLists(result);

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

    function updateLists (result) {
        var charactersKilled = result.dead,
            charactersRevived = result.alive,
            heroTargetIndex,
            enemyTargetIndex;

        for (var character in charactersKilled) {

            Pubsub.emitEvent('controller:character:killed', [charactersKilled[character]]);

            heroTargetIndex = Utils.indexOfCharacter(_aliveHeroes, charactersKilled[character]);
            enemyTargetIndex = Utils.indexOfCharacter(_aliveEnemies, charactersKilled[character]);

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

    // Translate resultMessage!
    function endBattle() {

        var rewards = {},
            resultMessage = 'You Have Died!';

        Pubsub.emitEvent('controller:battle:end');

        Utils.operateOnAll.call(
            this,
            Heroes.get(),
            function (hero) {
                hero.activityGauge.stop();
                hero.activityGauge.clear();
                return true;
            }
        );

        Utils.operateOnAll.call(
            this,
            enemies,
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
        
        setTimeout(function(){view.renderBattleSummary(rewards, Heroes.get(), resultMessage)}, battleDelay);
    }

    function endBattleRewards() {
        var rewards = {
            'money'             : 0,
            'achievements'      : [],
            'experiencePerHero' : 0
        };

        rewards = Utils.operateOnAll.call(
            this,
            enemies,
            function (enemy) {
                if (typeof enemy.rewards.money !== 'undefined') {
                    Money.creditPartyMoney(enemy.rewards.money);
                    this.params.money += enemy.rewards.money
                }

                if (typeof enemy.rewards.achievements !== 'undefined') {
                    for (var achievement in enemy.rewards.achievements) {
                        Achievements.achieve(enemy.rewards.achievements[achievement]);
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

        Utils.operateOnAll.call(
            this,
            Heroes.get(),
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

    function queueHandler(nextCharacter) {
        var nextCharacter = nextCharacter.vitals.name;

        if (Heroes.get()[nextCharacter]) {
            active = Heroes.get()[nextCharacter];
            heroMove();
        }
        else if (enemies[nextCharacter]) {
            active = enemies[nextCharacter];
            enemyMove.call(this);
        }
    }

    function finaliseExp() {
        Utils.operateOnAll.call(
            this,
            Heroes.get(),
            function (hero) {
                hero.receive.experience();
                return true;
            }
        );
    }

    function manageFirstLoss() {
        Utils.operateOnAll.call(
            this,
            Heroes.get(),
            function (hero) {
                hero.receive.reviveWithPercentageOfHp(100);
                return true;
            }
        );
    }

    Pubsub.addListener('queue:ready', queueHandler);

    TargetSelection.init(Abilities.selectionTypes);

	exports.action = function () {
		view.initialise(this);
		view.renderBattleOptions(battleOptions());
	};

	exports.startBattle = function(difficulty) {

        _aliveEnemies = [];

        Pubsub.addListener('activitygauge:update', function (gaugeData) {
            activityGaugeHandler(gaugeData);
        });

        initialiseEnemies(difficulty);
        initialiseHeroes();

        view.renderBattleField();
        view.renderEnemies(enemies);
        view.renderHeroes(Heroes.get());

        startActivityGauges.call(this);
    };

    exports.finishEndBattle = function() {
        finaliseExp();
        enemies = [];

        if (_endBattleState === _battleLost) {
            if (firstLoss === 'yes') {
                firstLoss = 'no';
                manageFirstLoss();
                view.renderFirstLoss();
            }
        }

        Routes.route('main');
    };

	return exports;
});