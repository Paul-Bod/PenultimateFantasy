define(['./EventEmitter'], function (Pubsub) {

    var queue = [],
        processing = false;

    function processQueue () {

        processing = true;

        var nextCharacter = queue.splice(0, 1);

        console.log('handling: ', nextCharacter);
    }

    function handleGaugeUpdate (gaugeData) {

        if (gaugeData.readyState) {

            console.log('activitygauge:update ', gaugeData.character);
            queue.push(gaugeData.character);

            console.log('queue: ', queue);

            if (!processing) {
                console.log('starting process!');
                processQueue();
            }
        }
    }

    function handleMoveEnd () {

        console.log('finished handling ^^');

        if (queue.length > 0) {

            processQueue();
        }
        else {
            processing = false;
            console.log('queue empty, ending process');
        }
    }

    function removeKilledCharacter (character) {

        console.log('removing killed character: ', character);
        var queueTargetIndex = queue.indexOf(character);

        if (queueTargetIndex >= 0) {

            queue.splice(queueTargetIndex, 1);
        }
    }

    function resetQueue () {

        console.log('battle over, resetting queue, ending process');
        queue = [];
        processing = false;
    }

    Pubsub.addListener('activitygauge:update', handleGaugeUpdate);
    Pubsub.addListener('controller:move:end', handleMoveEnd);
    Pubsub.addListener('controller:character:killed', removeKilledCharacter);
    Pubsub.addListener('controller:battle:end', resetQueue);
});
