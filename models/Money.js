define(function () {

    var exports = {},

        partyMoney;

    partyMoney = 100;

    exports.creditPartyMoney = function (amount) {

        partyMoney += amount;
    };

    exports.debitPartyMoney = function (amount) {

        if (partyMoney > 0) {
            partyMoney -= parseInt(amount);

            if (partyMoney < 0) {
                partyMoney = 0;
            }
        }
    };

    exports.getPartyMoney = function () {

        return partyMoney;
    };

    return exports;
});
