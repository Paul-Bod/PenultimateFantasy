define(['../lib/EventEmitter'], function (Pubsub) {

    function ActivityGauge(character) {
        var activityConstant = 20,
            animSpeed = 50,
            activityTimeout = '',
            currVal = 0,
            lastWidth = 0,
            intervals = 0;

        function readyCheck() {
            var ready = false;
            if (lastWidth == 1.0) {
                ready = true;
                this.stop();
            }

            Pubsub.emitEvent('activitygauge:update', [{
                readyState : ready,
                character  : character,
                lastWidth  : lastWidth
            }]);
        }

        function updateOnInterval() {
            currVal++;
            lastWidth = currVal/intervals;
            if (lastWidth > 1.0) {
                lastWidth = 1.0;
            }
            readyCheck.call(this);
        }

        function calculateTimeUntilGo() {
            var timeUntilGo = (activityConstant / character.attributes.speed) * 1000;
            if (timeUntilGo < 1000) {
                timeUntilGo = 1000;
            }

            return timeUntilGo;
        }

        this.start = function() {
            var _this = this;
            intervals = calculateTimeUntilGo() / animSpeed;
            activityTimeout = setInterval(function() {updateOnInterval.call(_this)}, animSpeed);
        };

        this.stop = function() {
            clearInterval(activityTimeout);
        };

        this.clear = function() {
            currVal = 0;
            lastWidth = 0;
            intervals = 0;
        };

        this.restart = function() {
            this.clear();
            this.start();
        };

        this.getLastWidth = function() {
            return lastWidth;
        };
    }

    return ActivityGauge;
});
