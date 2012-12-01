define(['./Translations'], function (Translations) {

    String.prototype.firstToUpper = function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };

    var exports = {},
        controller,
        battleMenus = [],
        battleMenuCounter = -1,
        menus = [],
        menuCounter = -1,
        superActions = [],
        saCounter = -1,
        _this = this, /* need consistant approach to this */

        renderHeroExperience = function(hero, heroExp) {

            return '<p>' + Translations.translate('heroes_experience', [hero, heroExp]) + '</p>';
        },

        renderHeroExperienceToLevelUp = function(hero) {

            var heroExpToLevelUp = controller.getExpToLevelUp(hero);
            return '<p>' + Translations.translate('heroes_experiencetolevelup', [hero, heroExpToLevelUp]) + '</p>';
        },

        renderBattleOptions = function() {

            var options = controller.getBattleOptions(),
                button,
                funcs = [],
                items = [];

            title = $('<div id="battletitle"><h3>' + Translations.translate('battlemenu_title') + '</h3></div>');

            for (var i = 0; i<options.length; i++) {
                button = $('<button id="' + options[i] + '" type="button">' + options[i] + '</button>');

                items.push(button);
                funcs.push(function (e) {controller.startBattle(e.srcElement.id)});
            }

            logMenu(title, items, funcs);
            renderMenu(title, items, funcs);
        },

        renderMenu = function(title, menu, funcs) {

            if (typeof first === 'undefined') {
                first = false;
            }

            var menuElem = $('<div>');
            menuElem.attr('id', 'menu');

            $('#pf').empty();
            $('#pf').append(title);

            for (item in menu) {
                menu[item].click(funcs[item]);
                menuElem.append(menu[item]);
                menu[item].after('<br/>');
            }

            $('#pf').append(menuElem);

            if (title.attr('id') !== 'mainmenutitle') {
                renderBackButton();
            }
        },

        renderAttributes = function(hero, update) {

            var attributes = controller.getAttributes(hero),
                cost = controller.getAttributeUpgradeCost(hero),
                isAffordable = controller.isAttributeAffordable(hero),
                button,
                heroExp = controller.getExp(hero),
                disabled = null,
                title,
                funcs = [],
                items = [];

            if (typeof update === 'undefined') {
                update = false;
            }

            title = $('<div id="attributestitle"><h3>' + Translations.translate('attributesupgrade_title') + '</h3>'
                  + '<p>' + Translations.translate('attributesupgrade_cost', [cost]) + '</p>'
                  + renderHeroExperience(hero, heroExp)
                  + renderHeroExperienceToLevelUp(hero)
                  + '</div>');

            if (!isAffordable) {
                disabled = 'disabled';
            }

            for (attribute in attributes) {
                button = $('<button id="'
                    + attribute
                    + '" type="button">'
                    + attribute
                    + ' ' + attributes[attribute]
                    + '</button>');

                button.attr('disabled', disabled);

                funcs.push(function(e) {controller.upgradeAttribute(hero, e.srcElement.id); renderAttributes(hero, true);});
                items.push(button);
            }

            if (!update) {
                logMenu(title, items, funcs);
            }
            renderMenu(title, items, funcs);
        },

        renderPurchaseAbilities = function(hero, update) {

            var heroAbs = controller.getAbilities(hero),
                abilities = controller.getAllAbilities(),
                cost,
                isAffordable,
                disabled,
                button,
                heroExperience = controller.getExp(hero),
                title,
                funcs = [],
                items = [];

            if (typeof update === 'undefined') {
                update = false;
            }

            title = $('<div id="abilitiestitle"><h3>' + Translations.translate('abilitiesupgrade_title') + '</h3>'
                + renderHeroExperience(hero, heroExperience)
                + renderHeroExperienceToLevelUp(hero)
                + '</div>');

            for (ability in abilities) {
                button = $('<button id="' + ability + '" type="button">' + ability + '</button>');
                
                if (heroAbs[ability]) {
                    button.css('border-color', 'blue', 'border-width', '5px');
                    funcs.push(null);
                }
                else {
                    cost = controller.getAbilityUpgradeCost(ability, hero);
                    button.append(' ', cost);

                    isAffordable = controller.isAbilityAffordable(ability, hero);

                    if (isAffordable) {
                        disabled = null;
                    }
                    else {
                        disabled = 'disabled';
                    }

                    button.attr('disabled', disabled);

                    funcs.push(function (e) {
                        controller.purchaseAbility(hero, e.srcElement.id);
                        renderPurchaseAbilities(hero, true);
                    });
                }
                items.push(button);
            }

            if (!update) {
                logMenu(title, items, funcs);
            }
            renderMenu(title, items, funcs);
        },

        renderShop = function (update) {
            var items = [],
                funcs = [],
                title,
                itemsForPurchase = controller.getItems(),
                button,
                isAffordable,
                disabled;

            if (typeof update === 'undefined') {
                updte = false;
            }

            title = $('<div id="shoptitle"><h3>' + Translations.translate('shop_title') + '</h3>'
                + '<p>' + Translations.translate('shop_dollars', [controller.getPartyMoney()]) + '</p></div>');

            for (item in itemsForPurchase) {
                button = $('<button id="'
                    + item
                    + '" type="button">'
                    + item
                    + ' ' + itemsForPurchase[item].dollarCost
                    + ' ' + controller.getAmountOfPartyItem(item)
                    + '</button>');

                isAffordable = controller.isItemAffordable(item);

                if (isAffordable) {
                    disabled = null;
                }
                else {
                    disabled = 'disabled';
                }

                button.attr('disabled', disabled);

                items.push(button);
                funcs.push(function (e) {
                    controller.purchaseItem(e.srcElement.id);
                    renderShop(true);
                });
            }

            if (!update) {
                logMenu(title, items, funcs);
            }
            renderMenu(title, items, funcs);
        },

        renderPowerUpOptions = function(hero) {
            var attributes = $('<button id="attributes" type="button">' + Translations.translate('upgrademenu_attributes') + '</button>'),
                abilities = $('<button id="skills" type="button">' + Translations.translate('upgrademenu_skills') + '</button>'),
                items = [],
                funcs = [],
                title;

            title = $('<div id="attributestitle"><h3>' + Translations.translate('upgrademenu_title') + '</h3></div>');

            items.push(attributes);
            funcs.push(function() {renderAttributes(hero)});

            items.push(abilities);
            funcs.push(function() {renderPurchaseAbilities(hero)});
            
            logMenu(title, items, funcs);
            renderMenu(title, items, funcs);
        },

        // Every thing should get heroes like this!!
        renderPowerUpCharacters = function() {
            var heroes = controller.getHeroes(),
                button,
                items = [],
                funcs = [],
                title;

            title = $('<div>');
            title.attr('id', 'attributestitle');
            title.append('<h3>' + Translations.translate('upgrademenu_heroes_title') + '</h3>');

            for (var hero in heroes) {
                button = $('<button>');
                button.attr('type', 'button');
                button.attr('id', heroes[hero]);
                button.html(heroes[hero]);

                funcs.push(function(e) {renderPowerUpOptions(e.srcElement.id)});
                items.push(button);
            }

            logMenu(title, items, funcs);
            renderMenu(title, items, funcs);
        },

        nameHeroesHandler = function() {
            
            var errors = [],
                names = {},
                heroes = {},
                heroTypes = $('#namehero').find('select'),
                heroNames = $('#namehero').find('input[type="text"]'),
                typeKey;

            heroNames.each(function (key, element) {

                if (names[element.value]) {
                    errors.push(Translations.translate('nameheroes_errors_samename', [heroTypes[key].value, element.value]));
                }

                if (element.value.length == 0 || element.value.length > 10) {
                    errors.push(Translations.translate('nameheroes_errors_length', [heroTypes[key].value]));
                }

                names[element.value] = element.value;

                typeKey = key + '.' + heroTypes[key].value;
                heroes[typeKey] = element.value;
            });

            if (errors.length > 0) {
                for (var error in errors) {
                    $('#namehero').after('<p>' + errors[error] + '</p>');
                }
            }
            else {
                controller.initialiseHeroes(heroes);
                exports.renderMainMenu();
            }
        },

        logMenu = function(title, menu, funcs) {
            var next = [title, menu, funcs];
            menus.push(next);
            menuCounter++;
        },

        unlogMenu = function() {
            menus.splice(menuCounter, 1);
            menuCounter--;
        },

        logBattleMenu = function(menu) {
            battleMenus.push(menu);
            battleMenuCounter++;
        },

        logSuperAction = function(topMenu) {
            superActions.push(topMenu);
            saCounter++;
        },

        unlogBattleMenu = function() {
            battleMenus.splice(battleMenuCounter, 1);
            battleMenuCounter--;
        },

        unlogSuperAction = function() {
            superActions.splice(saCounter, 1);
            saCounter--;
        },

        renderBattleBackButton = function() {
            var menuItems = battleMenus[battleMenuCounter-1],
                topMenu = superActions[saCounter-1],
                recallRenderAbilities = exports.renderAbilities,
                _this = this,
                backButton = $('<button>'),
                abilitiesList = $('#abilities');

            backButton.attr('type', 'button');
            backButton.html('back');
            backButton.attr('id', 'backbutton');

            backButton.click(function() {
                unlogBattleMenu.call(_this);
                unlogSuperAction.call(_this);
                recallRenderAbilities.call(_this, menuItems, topMenu, true);
            });

            abilitiesList.append(backButton);
        },

        renderBackButton = function() {
            var menuItems = menus[menuCounter-1],
                _this = this,
                backButton = $('<button>');

            backButton.attr('type', 'button');
            backButton.html('back');
            backButton.attr('id', 'backbutton');

            backButton.click(function() {
                unlogMenu.call(_this);
                renderMenu(menuItems[0], menuItems[1], menuItems[2]);
            });

            $('#pf').append(backButton);
        },

        renderCancelButton = function() {
            var abilitiesList = $('#abilities'),
                cancelButton,
                _this = this,
                menuItems = battleMenus[battleMenuCounter],
                topMenu = superActions[saCounter],
                callRenderAbilities = exports.renderAbilities;

            abilitiesList.empty();
            cancelButton = $('<button>');
            cancelButton.attr('type', 'button');
            cancelButton.html('cancel');
            cancelButton.attr('id', 'cancelbutton');

            cancelButton.click(function() {callRenderAbilities.call(_this, menuItems, topMenu, true)});

            abilitiesList.append(cancelButton);
        };

        // jqueryfy
        exports.renderSelectTarget = function(action, superAction) {
            var enemies = $("#enemies"),
                heroes = $("#heroes"),
                logMess = Translations.translate('battle_selecttarget');

            renderCancelButton.call(this);

            // optional argument
            if (!superAction) {
                var superAction = false;
            }
            
            exports.renderLog(logMess);

            var applyClickHandler = function () {

                var child = $(this);
                child.click(function (e) {
                    controller.heroBattleEvent(action, e.srcElement.id)
                    child.unbind('click');
                });
            }

            enemies.children().each(applyClickHandler);
            heroes.children().each(applyClickHandler);

            controller.pause();
        };

        exports.renderSelectEnemiesOrHeroes = function (action, superAction) {

            var enemies = $('#enemies'),
                heroes = $('#heroes'),
                logMess = Translations.translate('battle_selectenemiesorheroes');

            renderCancelButton.call(this);

            if (!superAction) {
                var superAction = false;
            }

            exports.renderLog(logMess);

            enemies.click(function (e) {
                controller.heroBattleEvent(action, e.currentTarget.id);
                enemies.unbind('click');
                heroes.unbind('click');
            });

            heroes.click(function (e) {
                controller.heroBattleEvent(action, e.currentTarget.id);
                heroes.unbind('click');
                enemies.unbind('click');
            });

            controller.pause();
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

    exports.renderFirstLoss = function() {
        $('#pf-messages').prepend('<p>That was your first loss!</p>');
    };

    exports.renderMainMenu = function(options) {

        var battle = $('<button id="battlebutton" type="button">' + Translations.translate('mainmenu_options_battle') + '</button>'),
            battleFunc,
            powerUp = $('<button id="powerupbutton" type="button">' + Translations.translate('mainmenu_options_upgrade') + '</button>'),
            shop = $('<button id="shopbutton" type="button">' + Translations.translate('mainmenu_options_shop') + '</button>'),
            items = [],
            funcs = [],
            title;

        if (typeof options === 'undefined') {
            options = {};
        }
 
        $('#pf').empty();

        battleFunc = function() {renderBattleOptions()};

        if (typeof options.battle !== 'undefined' && options.battle === false) {
            battle.attr('disabled', 'disabled');
            battleFunc = '';
        }
        items.push(battle);
        funcs.push(battleFunc);

        items.push(powerUp);
        funcs.push(function() {renderPowerUpCharacters()});

        items.push(shop);
        funcs.push(function() {renderShop()});

        title = $('<div>');
        title.attr('id', 'mainmenutitle');
        title.append('<h3>' + Translations.translate('mainmenu_title') + '</h3>');

        logMenu(title, items, funcs);
        renderMenu(title, items, funcs);
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

    // make enemies a controller public var?
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

    exports.renderGoMessage = function(name) {
        exports.renderLog(Translations.translate('battle_go', [name]));
    };

    exports.renderAbilities = function(abilities, superAction, back) {
        // optional arguments
        if (typeof superAction === 'undefined') {
            superAction = false;
        }

        if (typeof back === 'undefined') {
            back = false;
        }

        if (abilities) {
            var menuLevel = abilities;
            var abilitiesList = $('#abilities');
            var _this = this;

            $('#abilities').empty();
            for (var ability in abilities) {
                var item = $('<button>');
                item.attr('type', 'button');

                var itemAttributes = controller.getRenderAbilityAttributes(ability, abilities, superAction);

                item.html(itemAttributes.html);
                item.attr('id', itemAttributes.id);
                if (itemAttributes.isDisabled) {
                    item.attr('disabled', 'disabled');
                }
                item.click(itemAttributes.clickAction);

                abilitiesList.append(item);
                abilitiesList.append($('<br/>'));
            }

            if (!back) {
                logBattleMenu(menuLevel);
                logSuperAction(superAction);
            }

            if (superAction) {
                renderBattleBackButton.call(_this);
            }
        }
        else {
            $('#abilities').empty();
        }
    };

    exports.renderLog = function(message) {
        document.getElementById("log").innerHTML = message;
    };

    exports.renderActivityGauge = function(name, value) {
        $('#' + name + '-activityGauge').width(value*100 + '%');
    };

    exports.initialise = function (controllerInstance) {
        controller = controllerInstance;
    };

    exports.renderNameHeroes = function() {

        var heroChoices = controller.getHeroChoices(),
            form = $('<form id="namehero"><h3>' + Translations.translate('nameheroes_title') + '</h3></form>'),
            selectionSet = '',
            nameOne = $('<input type="text" value="Bod"></input>'),
            nameTwo = $('<input type="text" value="KristIan"></input>'),
            nameThree = $('<input type="text" value="BabuNu"></input>'),
            choiceOne = $('<select>'),
            choiceTwo = $('<select>'),
            choiceThree = $('<select>'),
            submitButton = $('<input type="button" value="' + Translations.translate('nameheroes_submitbutton') + '"></input>');

        for (var choice in heroChoices) {
            var value = heroChoices[choice];
            selectionSet += '<option value="' + value + '">' + value.firstToUpper() + '</option>';
        }

        choiceOne.append(selectionSet);
        choiceTwo.append(selectionSet);
        choiceThree.append(selectionSet);

        submitButton.click(function() {nameHeroesHandler();});
        
        form.append(choiceOne, nameOne, '<br/>', choiceTwo, nameTwo, '<br/>', choiceThree, nameThree, '<br/>', submitButton);
        $('#pf').append(form);
    };

    return exports;
});
