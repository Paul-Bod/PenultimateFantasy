define(function () {
	var exports = {},
		menus = [],
		menuCounter = -1;

    function renderBackButton() {
        var menuItems = menus[menuCounter-1],
            _this = this,
            backButton = $('<button>');

        backButton.attr('type', 'button');
        backButton.html('back');
        backButton.attr('id', 'backbutton');

        backButton.click(function() {
            exports.unlogMenu.call(_this);
            exports.renderMenu(menuItems[0], menuItems[1], menuItems[2]);
        });

        $('#pf').append(backButton);
    };

	exports.logMenu = function(title, menu, funcs) {
        var next = [title, menu, funcs];
        menus.push(next);
        menuCounter++;
    };

    exports.unlogMenu = function() {
        menus.splice(menuCounter, 1);
        menuCounter--;
    };

    exports.renderMenu = function(title, menu, funcs) {

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
    };

    return exports;
});