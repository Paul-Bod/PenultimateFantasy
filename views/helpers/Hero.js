define(['../../utils/Translations'], function (Translations) {
	var exports = {};

    exports.renderExperienceToLevelUp = function(hero, heroExpToLevelUp) {
        return '<p>' + Translations.translate('heroes_experiencetolevelup', [hero, heroExpToLevelUp]) + '</p>';
    }

    exports.renderExperience = function(hero, heroExp) {
        return '<p>' + Translations.translate('heroes_experience', [hero, heroExp]) + '</p>';
    }

    return exports;
});