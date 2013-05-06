define(['./EventEmitter'], function (Pubsub) {

    var queue = [],
        processing = false;

    function processNextItem () {

        processing = true;

        var nextCharacter = queue.splice(0, 1);

        Pubsub.emitEvent('queue:ready', nextCharacter);

    }

    function handleGaugeUpdate (gaugeData) {

        if (gaugeData.readyState) {

            queue.push(gaugeData.character);

            if (!processing) {
                processNextItem();
            }
        }
    }

    function handleMoveEnd () {

        if (queue.length > 0) {

            processNextItem();
        }
        else {
            processing = false;
        }
    }

    function indexOfCharacter (characterList, name) {

        for (var index in characterList) {

            if (characterList[index].vitals.name === name) {
                return index;
            }
        }
    }

    function removeKilledCharacter (character) {

        console.log('QUEUE', queue);
        console.log('REMOVEKILLEDCHARACTER', character);
        var queueTargetIndex = indexOfCharacter(queue, character);

        if (queueTargetIndex >= 0) {

            queue.splice(queueTargetIndex, 1);
        }

        console.log('QUEUE', queue);
    }

    function resetQueue () {

        queue = [];
        processing = false;
    }

    Pubsub.addListener('activitygauge:update', handleGaugeUpdate);
    Pubsub.addListener('controller:move:end', handleMoveEnd);
    Pubsub.addListener('controller:character:killed', removeKilledCharacter);
    Pubsub.addListener('controller:battle:end', resetQueue);
    Pubsub.addListener('abilities:skip', function () {console.log('skipping!');});
});
