define(['../lib/EventEmitter'], function (Pubsub) {

    var exports = {},
        selectionTypes = null,
        targets = null,

        targetTypes = {
            enemies          : 'enemies',
            heroes           : 'heroes'
        };

    var singleTargetSelector = function (target) {

        var defender = targets.characters[target];
        Pubsub.emitEvent('targetselection:selected', [defender]);
    };

    var allTargetSelector = function (target) {
        var defender = null;

        switch (target) {
            case targetTypes.enemies:
                defender = targets.aliveEnemies;
                break;

            case targetTypes.heroes:
                defender = targets.aliveHeroes;
                break;
        }
        Pubsub.emitEvent('targetselection:selected', [defender]);
    };

    var splashTargetSelector = function (focusTarget, splashTarget) {
        var defender = {
            'focus'  : focusTarget,
            'target' : null
        };

        switch (splashTarget) {
            case targetTypes.enemies:
                defender.target = targets.aliveEnemies;
                break;

            case targetTypes.heroes:
                defender.target = targets.aliveHeroes;
                break;
        }

        Pubsub.emitEvent('targetselection:selected', [defender]);
    };

    function getTargetSelector (selectionType) {
        var targetSelector = function (target, targetGroup) {

            switch (selectionType) {

                case selectionTypes.all:
                    allTargetSelector(targetGroup);
                    break;

                case selectionTypes.splash:
                    splashTargetSelector(target, targetGroup);
                    break;

                case selectionTypes.one:
                default:
                    singleTargetSelector(target);
                    break;
            }
        };

        return targetSelector;
    }

    function selectRandomTarget (targets) {

        var randomNum = Math.random(),
            randomTarget = Math.floor(randomNum * (targets.length));
        return targets[randomTarget];
    }

    exports.getTargetSelector = function (selectionType, gameTargets) {

        var targetSelector = null;

        targets = gameTargets;

        return getTargetSelector(selectionType);
    };

    exports.selectRandomTarget = function (selectionType, targets) {

        var selection = null;

        switch (selectionType) {

            case selectionTypes.all:
                selection = targets;
                break;

            case selectionTypes.splash:
            case selectionTypes.one:
            default:
                selection = selectRandomTarget(targets);
                break;
        }

        return selection;
    };

    exports.init = function (gameSelectionTypes) {
        selectionTypes = gameSelectionTypes;
    };

    return exports;
});
