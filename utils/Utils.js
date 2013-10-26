define(function () {

    var exports = {};

    exports.createBattleAbilities = function (abilities) {

        var battleAbilities = [];

        for (var ability in abilities) {

            if ($.isArray(abilities[ability])) {
                var subAbilities = this.createBattleAbilities(abilities[ability]);

                for (var subAbility in subAbilities) {
                    battleAbilities.push(subAbilities[subAbility]);
                }
            }
            else {
                battleAbilities.push(abilities[ability]);
            }
        }

        return battleAbilities;
    };

    exports.generateName = function (type) {
        //these weird character sets are intended to cope with the nature of English (e.g. char 'x' pops up less frequently than char 's')
        //note: 'h' appears as consonants and vocals
        var minlength,
            maxlength,
            vocals = 'aeiouyh' + 'aeiou' + 'aeiou',
            cons = 'bcdfghjklmnpqrstvwxz' + 'bcdfgjklmnprstvw' + 'bcdfgjklmnprst',
            allchars = vocals + cons,
            length,
            consnum = 0,
            name = '',
            charSet,
            nextChar;

        switch (type) {
            case 'easyMonster':
                minlength = 6;
                maxlength = 8;
                break;
            case 'mediumMonster':
                minlength = 4;
                maxlength = 5;
                break;
            default:
                minlength = 6;
                maxlength = 8;
                break;
        }

        length = Math.floor(Math.random()*(maxlength-minlength)) + minlength;
        
        for (var i = 0; i < length; i++) {
            //if we have used 2 consonants, the next char must be vocal.
            if (consnum == 2) {
                charSet = vocals;
                consnum = 0;
            }
            else {
                charSet = allchars;
            }
            //pick a random character from the set we are goin to use.
            nextChar = charSet.charAt(Math.floor(Math.random()*(charSet.length-1)));
            name += nextChar;
            if (cons.indexOf(nextChar) != -1) { 
                consnum++;
            }
        }
        name = name.charAt(0).toUpperCase() + name.substring(1, name.length);
        return name;
    }

    return exports;
});
