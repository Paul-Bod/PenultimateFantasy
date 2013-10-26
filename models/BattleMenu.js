define(['../lib/EventEmitter'], function (Pubsub) {

    var exports = {};

    function createChildMenu (name, abilities, parentMenu) {

        var menu = createMenuFromAbilities(name, abilities);

        menu.back = {};
        menu.back.html = 'back';
        menu.back.id = 'back';
        menu.back.isDisabled = false;
        menu.back.children = false;
        menu.back.clickAction = function() {

            Pubsub.emitEvent('battlemenu:backward', [parentMenu]);
        };

        return menu;
    }

    function createCancelMenu (parentMenu) {

        var menu = {};
        menu.cancel = {};
        menu.cancel.html = 'cancel';
        menu.cancel.id = 'cancel';
        menu.cancel.isDisabled = false;
        menu.cancel.children = false;
        menu.cancel.clickAction = function() {

            Pubsub.emitEvent('battlemenu:cancel', [parentMenu]);
        };

        return menu;
    }

    function getSubMenuCallback (ability, children) {

        var subMenuCallback = function () {

            Pubsub.emitEvent('battlemenu:forward', [children]);
        };
        return subMenuCallback;
    }

    function getMenuItemCallback (name, ability, children) {

        var menuItemCallback = function () {

            Pubsub.emitEvent('battlemenu:forward', [children]);
            Pubsub.emitEvent('battlemenu:action', [name, ability.type, ability.name, ability.selectionType]);
        };

        return menuItemCallback;
    }

    function createMenuFromAbilities (name, abilities) {

        var menu = {};

        for (ability in abilities) {

            var isDisabled = false,
                children = false,
                abilityName = '',
                clickAction = function() {};

            if ($.isArray(abilities[ability])) {

                abilityName = ability;
                children = createChildMenu(name, abilities[ability], menu);
                clickAction = getSubMenuCallback(abilityName, children);
            }
            else {

                abilityName = abilities[ability].name;
                children = createCancelMenu(menu);
                if (typeof abilities[ability].available !== 'undefined' && abilities[ability].available === false) {
                    isDisabled = true;
                }
                clickAction = getMenuItemCallback(name, abilities[ability], children);
            }

            menu[abilityName] = {};
            menu[abilityName].html = abilityName;
            menu[abilityName].id = abilityName;
            menu[abilityName].isDisabled = isDisabled;
            menu[abilityName].children = children;
            menu[abilityName].clickAction = clickAction;
        }

        return menu;
    }

    exports.getBattleMenu = function (character) {

        return createMenuFromAbilities(character.vitals.name, character.abilities);
    };

    return exports;
});
