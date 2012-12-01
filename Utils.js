define(function () {

    var exports = {};

    exports.createBattleAbilities = function (abilities, superAbility) {

        if (typeof superAbility === 'undefined') {
            superAbility = false;
        }

        var battleAbilities = [],
            memberCount = 0,
            idSuper,
            idNumber,
            idName;

        for (var ability in abilities) {

            if ($.isArray(abilities[ability])) {
                var subAbilities = this.createBattleAbilities(abilities[ability], ability);

                for (var subAbility in subAbilities) {
                    battleAbilities.push(subAbilities[subAbility]);
                }
            }
            else {
                if (superAbility) {
                    idSuper = superAbility;
                }
                else {
                    idSuper = abilities[ability].name;
                }

                idNumber = memberCount;
                idName = abilities[ability].name;

                battleAbility = idSuper + '.' + idNumber + '.' + idName;
                battleAbilities.push(battleAbility);

                memberCount++;
            }
        }

        return battleAbilities;
    };

    return exports;
});
