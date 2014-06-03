define(['../utils/Translations', '../models/Heroes'], function (Translations, Heroes) {
	String.prototype.firstToUpper = function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };

	var exports = {},
	    controller;

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

        submitButton.click(function() {controller.nameHeroesHandler(
        	$('#namehero').find('select'),
        	$('#namehero').find('input[type="text"]')
        )});
        
        form.append(choiceOne, nameOne, '<br/>', choiceTwo, nameTwo, '<br/>', choiceThree, nameThree, '<br/>', submitButton);
        $('#pf').append(form);
    };

    exports.renderErrors = function(errors) {
    	for (var error in errors) {
            $('#namehero').after('<p>' + errors[error] + '</p>');
        }
    };

    return exports;
});