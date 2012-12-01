define(['./View', './Model', './Abilities', './Items', './Money'], function (view, model, Abilities, Items, Money) {

    var exports = {},

        moves = {},

        active,
        nextMove,

        enemies = {},
        _aliveEnemies = {},
        heroes = {},
        _aliveHeroes = {},

        queue = [],
        queueTimer,
        queueHandleFunc = queueHandler,
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

        updateQueue();

        view.renderLog(result);
    };

    moves.magic = function(actionId, defender, freebie) {
        var spell = actionId[2],
            result = Abilities.executeAbility(active, defender, spell, freebie);

        updateQueue();

        view.renderLog(result);
    };

    moves.items = function(actionId, defender, freebie) {
        var itemIndex = actionId[1],
            item = actionId[2],
            result = Items.useItem(item, itemIndex, active, defender, freebie);

        updateQueue();
        view.renderLog(result);
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
            startQueueHandler.call(this);
        }
        else {
            endBattle();
        }
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

        queue = [];
        stopQueueHandler();
        
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

        if (!_aliveEnemies) {
            return _battleWon;
        }
        else if (!_aliveHeroes) {

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

    function updateQueue() {

        var deadHeroes = operateOnAllAliveHeroes.call(
            this,
            function (hero) {

                var targetIndex = queue.indexOf(hero.vitals.name);
                if (hero.vitals.state === "dead") {
                    queue.splice(targetIndex, 1);

                    this.params.push(hero.vitals.name);
                }
                return true;
            },
            []
        );

        if (deadHeroes.length > 0) {
            var newAliveHeroes = operateOnAllAliveHeroes.call(
                this,
                function (hero) {

                    var targetIndex = deadHeroes.indexOf(hero.vitals.name);

                    var aliveHeroesCount = 0;

                    if (targetIndex > -1) {
                        return true;
                    }

                    this.params.aliveHeroes[hero.vitals.name] = _aliveHeroes[hero.vitals.name];
                    this.params.count++;

                    return true;
                },
                {count : 0, aliveHeroes : {}}
            );

            if (newAliveHeroes.count == 0) {
                newAliveHeroes = false;
            }
            else {
                newAliveHeroes = newAliveHeroes.aliveHeroes;
            }

            _aliveHeroes = newAliveHeroes;
        }

        var deadEnemies = operateOnAllAliveEnemies.call(
            this,
            function (enemy) {

                var targetIndex = queue.indexOf(enemy.vitals.name);
                if (enemy.vitals.state === "dead") {
                    queue.splice(targetIndex, 1);

                    this.params.push(enemy.vitals.name);
                }
                return true;
            },
            []
        );

        if (deadEnemies.length > 0) {
            var newAliveEnemies = operateOnAllAliveEnemies.call(
                this,
                function (enemy) {

                    var targetIndex = deadEnemies.indexOf(enemy.vitals.name);

                    var aliveEnemiesCount = 0;

                    if (targetIndex > -1) {
                        return true;
                    }

                    this.params.aliveEnemies[enemy.vitals.name] = _aliveEnemies[enemy.vitals.name];
                    this.params.count++;

                    return true;
                },
                {count : 0, aliveEnemies : {}}
            );

            if (newAliveEnemies.count == 0) {
                newAliveEnemies = false;
            }
            else {
                newAliveEnemies = newAliveEnemies.aliveEnemies;
            }

            _aliveEnemies = newAliveEnemies;
        }
    }

    function queueHandler() {
        var nextCharacter = queue.splice(0, 1);

        if (heroes[nextCharacter]) {
            stopQueueHandler();
            active = heroes[nextCharacter];
            heroMove();
        }
        else if (enemies[nextCharacter]) {
            stopQueueHandler();
            active = enemies[nextCharacter];
            enemyMove.call(this);
        }
    }

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

        switch (target) {

            case 'enemies':
                defender = _aliveEnemies;
                break;
            case 'heroes':
                defender = _aliveHeroes;
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

            _aliveEnemies[name] = enemies[name];
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
                break;
            default:
                minMonseters = maxMonsters = 1;
                createRandomEnemies(minMonsters, maxMonsters, difficulty);
                break;
        }

    };

    function createHeroBattleAbilities () {
        
        _aliveHeroes = {};

        operateOnAllHeroes.call(
            this,
            function (hero) {

                hero.createBattleAbilities();

                if (hero.vitals.state !== 'dead') {

                    _aliveHeroes[hero.vitals.name] = heroes[hero.vitals.name];
                }

                return true;
            }
        );
    }

    exports.startBattle = function(difficulty) {

        _aliveEnemies = {};

        model.setActivityGaugeReadyHandler(activityGaugeUpdator);

        initialiseEnemies(difficulty);

        createHeroBattleAbilities();

        view.renderBattleField();
        view.renderEnemies(enemies);
        view.renderHeroes(heroes);

        startActivityGauges.call(this);

        startQueueHandler.call(this);
    };

    function startQueueHandler() {
        thisInstance = this;
        queueTimer = setInterval(function(){queueHandleFunc.call(thisInstance)}, 250);
    }

    function stopQueueHandler() {
        clearInterval(queueTimer);
    }

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
        stopQueueHandler();
    };

    function play() {
        startQueueHandler.call(this);
        startActivityGauges.call(this);
    }

    function activityGaugeUpdator(ready, name, value) {
        if (ready) {
            queue.push(name);
        }
        else {
            view.renderActivityGauge(name, value);
        }
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

                case Abilities.selectionTypes.all:
                    itemAttributes.clickAction = function(e){view.renderSelectEnemiesOrHeroes(e.srcElement.id, superAction)};
                    break;
                case Abilities.selectionTypes.one:
                default:
                    itemAttributes.clickAction = function(e){view.renderSelectTarget(e.srcElement.id, superAction)};
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
