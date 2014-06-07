define(['./helpers/Menu', '../utils/Translations'], function (Menu, Translations) {
	var exports = {};

    exports.renderMainMenu = function(battleAction, powerUpAction, shopAction) {

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

        items.push(battle);
        funcs.push(battleAction);

        items.push(powerUp);
        funcs.push(powerUpAction);

        items.push(shop);
        funcs.push(shopAction);

        title = $('<div>');
        title.attr('id', 'mainmenutitle');
        title.append('<h3>' + Translations.translate('mainmenu_title') + '</h3>');

        Menu.logMenu(title, items, funcs);
        Menu.renderMenu(title, items, funcs);
    };

    return exports;
});