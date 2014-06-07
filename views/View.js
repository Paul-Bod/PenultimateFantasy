define(['../utils/Translations'], function (Translations) {
    var exports = {},
        controller,
        battleMenus = [],
        battleMenuCounter = -1,
        superActions = [],
        saCounter = -1,
        _this = this, /* need consistant approach to this */

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

    return exports;
});
