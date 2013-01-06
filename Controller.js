define([
    './View',
    './Model',
    './Abilities',
    './Items',
    './Money',
    './EventEmitter',
    './Queue'
], function (view, model, Abilities, Items, Money, Pubsub, Queue) {

    var exports = {},

        moves = {},

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

    // define move types
    moves.attack = function(actionId, defender, freebie) {
        var result = Abilities.executeAbility(active, defender, 'attack', freebie);

        updateLists(result);

        view.renderLog(result.message);
    };

    moves.magic = function(actionId, defender, freebie) {
        var spell = actionId[2],
            result = Abilities.executeAbility(active, defender, spell, freebie);

        updateLists(result);

        view.renderLog(result.message);
    };

    moves.skills = function(actionId, defender, freebie) {
        var skill = actionId[2],
            result = Abilities.executeAbility(active, defender, skill, freebie);

        updateLists(result);

        view.renderLog(result.message);
    };

    moves.items = function(actionId, defender, freebie) {
        var itemIndex = actionId[1],
            item = actionId[2],
            result = Items.useItem(item, itemIndex, active, defender, freebie);

        updateLists(result);
        view.renderLog(result.message);
    };

    moves.skip = function (actionId, defender, freebie) {

        var ability = actionId[2]
        Abilities.executeNeutralAbility(ability);
    };

    function getName(type) {
        //these weird character sets are intended to cope with the nature of English (e.g. char 'x' pops up less frequently than char 's')
        //note: 'h' appears as consonants and vocals
        var minlength,
            maxlength,
            vocals = 'aeiouyh' + 'aeiou' + 'aeiou',
            cons = 'bcdfghjklmnpqrstvwxz' + 'bcdfgjklmnprstvw' + 'bcdfgjklmnprst',
            allchars = vocals + cons,
            length,
            consnum = 0,
            name = '',
            charSet,
            nextChar;

        switch (type) {
            case 'easyMonster':
                minlength = 6;
                maxlength = 8;
                break;
            case 'mediumMonster':
                minlength = 4;
                maxlength = 5;
                break;
            default:
                minlength = 6;
                maxlength = 8;
                break;
        }

        length = Math.floor(Math.random()*(maxlength-minlength)) + minlength;
        
        for (var i = 0; i < length; i++) {
            //if we have used 2 consonants, the next char must be vocal.
            if (consnum == 2) {
                charSet = vocals;
                consnum = 0;
            }
            else {
                charSet = allchars;
            }
            //pick a random character from the set we are goin to use.
            nextChar = charSet.charAt(Math.floor(Math.random()*(charSet.length-1)));
            name += nextChar;
            if (cons.indexOf(nextChar) != -1) { 
                consnum++;
            }
        }
        name = name.charAt(0).toUpperCase() + name.substring(1, name.length);
        return name;
    }

    function moveEnd() {

        _endBattleState = checkEndBattle();

        if (_endBattleState === _battleContinue) {

            if (active.vitals.state !== 'dead') {
                active.activityGauge.restart(this);
            }
        }
        else {
            endBattle();
        }

        Pubsub.emitEvent('controller:move:end');
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

    function enemySelectAbility() {
        var enemyAbilities = new Array,
            randomNum = Math.random(),
            randomAbility;

        for (ability in active.abilities) {
            enemyAbilities.push(ability);
        }

        randomAbility = Math.floor(randomNum * (enemyAbilities.length));
        return enemyAbilities[randomAbility];
    }

    function enemySelectTarget() {
        var heroTargets,
            randomNum = Math.random(),
            randomHero;

        heroTargets = operateOnAllHeroes.call(
            this,
            function(hero) {
                if (hero.vitals.state === 'alive') {
                    this.params.push(hero.vitals.name);
                }
                return true;
            },
            []
        );

        randomHero = Math.floor(randomNum * (heroTargets.length));
        return heroTargets[randomHero];
    }

    function enemyMove() {
        var target,
            nextMove,
            nextMoveId = active.selectAbility();

        nextMoveId = nextMoveId.split('.');

        target = enemySelectTarget();

        moves[nextMoveId[0]](nextMoveId, heroes[target], true);

        view.renderHeroes(heroes);

        // enemy go end point
        var thisInstance = this;
        setTimeout(function() {moveEnd.call(thisInstance)}, battleDelay);
    }

    function heroMove() {
        view.renderGoMessage(active.vitals.name);
        view.renderAbilities(active.abilities);
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

    exports.heroBattleEvent = function(actionId, target) {
        var defender;

        startActivityGauges.call(this);

        var focusPos = target.indexOf('-');

        if (focusPos > -1) {
            console.log(focusPos);
            console.log(target.length);
            console.log(target);
            var focusTarget = target.substr(focusPos+1, target.length);
            target = target.substr(0, focusPos+1);
        }

        switch (target) {

            case targetTypes.none:
                defender = null;
                break;

            case targetTypes.enemies:
                defender = _aliveEnemies;
                break;

            case targetTypes.enemiesWithFocus:
                defender = {
                    'focus' : focusTarget,
                    'target' : _aliveEnemies
                };
                break;

            case targetTypes.heroes:
                defender = _aliveHeroes;
                break;

            case targetTypes.heroesWithFocus:
                defender = {
                    'focus' : focusTarget,
                    'target' : _aliveHeroes
                };
                break;

            default:
                if (enemies[target]) {
                    defender = enemies[target];
                }
                else {
                    defender = heroes[target];
                }
        }

        actionId = actionId.split('.');
        var action = actionId[0];
        moves[action](actionId, defender, false);

        // update all characters as hero may have used mp
        view.renderEnemies(enemies);
        view.renderHeroes(heroes);

        view.renderAbilities(null);

        // hero go end point
        var thisInstance = this;
        setTimeout(function() {moveEnd.call(thisInstance)}, battleDelay);
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
            name = getName(difficulty);
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
                maxMonsters = 2;
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

    function createHeroBattleAbilities () {
        
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

        createHeroBattleAbilities();

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

    exports.pause = function() {
        stopActivityGauges();
    };

    function activityGaugeHandler(gaugeData) {

        view.renderActivityGauge(gaugeData.character, gaugeData.lastWidth);
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

    exports.getRenderAbilityAttributes = function(ability, abilities, superAction) {
        var itemAttributes = {};

        console.log('ability attributes vv');
        console.log(ability);

        if ($.isArray(abilities[ability])) {
            var idNumber = 'single';
            var idName = ability;
            var idSuper = superAction ? superAction : ability;
            itemAttributes.html = ability;
            itemAttributes.isDisabled = false;
            var recallAbilities = abilities[ability];
            var recallAbility = ability;
            itemAttributes.clickAction = function() {view.renderAbilities(recallAbilities, recallAbility)};
        }
        else {
            var idNumber = (ability == abilities[ability].name) ? 'single' : ability;
            var idName = abilities[ability].name;
            var idSuper = superAction ? superAction : abilities[ability].name;
            itemAttributes.html = abilities[ability].name;
            if (typeof abilities[ability].available !== 'undefined' && abilities[ability].available === false) {
                itemAttributes.isDisabled = true;
            }

            var cost = getBattleCost(idNumber, idName, superAction);
            if (cost !== '') {
                itemAttributes.html += ' ' + cost;
            }

            switch (abilities[ability].selectionType) {

                case Abilities.selectionTypes.none:
                    itemAttributes.clickAction = function (e) {exports.heroBattleEvent(e.srcElement.id, targetTypes.none)};
                    break;

                case Abilities.selectionTypes.all:
                    itemAttributes.clickAction = function (e) {view.renderSelectEnemiesOrHeroes(e.srcElement.id, superAction)};
                    break;

                case Abilities.selectionTypes.splash:
                    itemAttributes.clickAction = function (e) {view.renderSelectTargetWithSplash(e.srcElement.id, superAction)};
                    break;

                case Abilities.selectionTypes.one:
                default:
                    itemAttributes.clickAction = function (e) {view.renderSelectTarget(e.srcElement.id, superAction)};
                    break;
            }
        }

        itemAttributes.id = idSuper + '.' + idNumber + '.' + idName;

        return itemAttributes;
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
