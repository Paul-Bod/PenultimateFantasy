define(['../utils/Translations', './helpers/Menu'], function (Translations, Menu) {
	var exports = {},
		controller;

	exports.initialise = function (controllerInstance) {
        controller = controllerInstance;
    };

	exports.renderBattleOptions = function(options) {
        var button,
            funcs = [],
            items = [];

        title = $('<div id="battletitle"><h3>' + Translations.translate('battlemenu_title') + '</h3></div>');

        for (var i = 0; i<options.length; i++) {
            button = $('<button id="' + options[i] + '" type="button">' + options[i] + '</button>');

            items.push(button);
            funcs.push(function (e) {controller.startBattle(e.srcElement.id)});
        }

        Menu.logMenu(title, items, funcs);
        Menu.renderMenu(title, items, funcs);
    };

    exports.renderActivityGauge = function(name, value) {
        $('#' + name + '-activityGauge').width(value*100 + '%');
    };

    exports.renderBattleField = function() {
        var mainTable = $('<table>'),
            enemyRow = $('<tr>'),
            heroRow = $('<tr>'),
            log = $('<div>'),
            abilityMenu = $('<div>');
            itemMenu = $('<div>');

            $('#pf').empty();
            mainTable.attr('id', 'battleField');
            enemyRow.attr('id', 'enemies');
            heroRow.attr('id', 'heroes');
            log.attr('id', 'log');
            abilityMenu.attr('id', 'abilities');
            itemMenu.attr('id', 'items');

            mainTable.append(enemyRow, heroRow);
            $('#pf').append(mainTable);
            mainTable.after('<br/>', log, abilityMenu, itemMenu);
    };

    exports.renderEnemies = function(enemies) {
        var enemyDetails = '',
            activityGauge;

        for (var enemy in enemies) {
            if (enemies[enemy].vitals.state === 'alive') {
                activityGauge = "<div id='" + enemies[enemy].vitals.name + "-activityGauge' class='enemy-activityGauge' style='width:" + enemies[enemy].activityGauge.getLastWidth()*100 + "%'></div>";
                enemyDetails += "<td id ='" + enemy + "'>" + Translations.translate("enemies_type_" + enemies[enemy].vitals.type) + "<br/>" + enemies[enemy].vitals.name + " " + enemies[enemy].vitals.hp + activityGauge + "</td>";
            }
        }

        document.getElementById("enemies").innerHTML = enemyDetails;
    };

    exports.renderHeroes = function(heroes) {
        var heroDetails = '',
            activityGauge;

        for (var hero in heroes) {
            activityGauge = "<div id='" + heroes[hero].vitals.name + "-activityGauge' class='hero-activityGauge' style='width:" + heroes[hero].activityGauge.getLastWidth()*100 + "%'></div>";
            heroDetails += "<td id='" + hero + "' class='" + heroes[hero].vitals.state + "'>" + Translations.translate("heroes_type_" + heroes[hero].vitals.type) + "<br/>" + heroes[hero].vitals.name + "<br/>" + heroes[hero].vitals.hp + "/" + heroes[hero].vitals.maxHp + "<br/>" + heroes[hero].vitals.mp + "/" + heroes[hero].vitals.maxMp + activityGauge + "</td>";
        }

        document.getElementById("heroes").innerHTML = heroDetails;
    };

    exports.renderBattleMenu = function (menu) {

        var abilitiesList = $('#abilities');

        $('#abilities').empty();

        for (var ability in menu) {

            var item = $('<button>');
            item.attr('type', 'button');

            var itemAttributes = menu[ability];

            item.html(itemAttributes.html);
            item.attr('id', itemAttributes.id);
            if (itemAttributes.isDisabled) {
                item.attr('disabled', 'disabled');
            }
            item.click(itemAttributes.clickAction);

            abilitiesList.append(item);
            abilitiesList.append($('<br/>'));
        }
    };

    exports.clearBattleMenu = function () {
        $('#abilities').empty();
    };

    exports.renderSelectTarget = function(onTargetClick) {

        var enemies = $("#enemies"),
            heroes = $("#heroes"),
            logMess = Translations.translate('battle_selecttarget');

        exports.renderLog(logMess);

        var applyClickHandler = function () {

            var child = $(this);

            child.click(function (e) {
                e.preventDefault();
                onTargetClick(e.srcElement.id, e.srcElement.parentElement.id)
                enemies.children().each(function () {$(this).unbind('click')});
                heroes.children().each(function () {$(this).unbind('click')});
            });
        }

        enemies.children().each(applyClickHandler);
        heroes.children().each(applyClickHandler);
    };

    exports.removeSelectTarget = function() {
        $("#enemies").children().each(function () {$(this).unbind('click')});
        $("#heroes").children().each(function () {$(this).unbind('click')});
    };

    exports.renderBattleSummary = function(rewards, heroes, resultMessage) {

        var heroSummary,
            heroMess,
            resultSummary,
            continueButton;

        $('#pf').empty();
        resultSummary = $('<h3>');

        resultSummary.html(resultMessage);
        $('#pf').append(resultSummary);

        moneyMessage = Translations.translate('battlesummary_money', [rewards.money]);
        $('#pf').append(moneyMessage);

        for (var hero in heroes) {
            var totalExp = heroes[hero].training.collectedExp + heroes[hero].training.experience;
            heroSummary = $('<p>');

            heroMess =
                Translations.translate('battlesummary_experiencegained', [heroes[hero].vitals.name, heroes[hero].training.collectedExp])
                + '<br/>'
                + Translations.translate('battlesummary_experiencetotal', [heroes[hero].vitals.name, totalExp]);

            heroSummary.html(heroMess);
            $('#pf').append(heroSummary);
        }

        continueButton = $('<button id="continuebutton" type="button">' + Translations.translate('battlesummary_continue') + '</button>');
        continueButton.click(function() {controller.finishEndBattle()});

        $('#pf').append(continueButton);
    };

    exports.renderGoMessage = function(name) {
        exports.renderLog(Translations.translate('battle_go', [name]));
    };

    exports.renderLog = function(message) {
        document.getElementById("log").innerHTML = message;
    };

    exports.renderFirstLoss = function() {
        $('#pf-messages').prepend('<p>That was your first loss!</p>');
    };

    return exports;
});