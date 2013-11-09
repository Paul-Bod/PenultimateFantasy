define(['../lib/EventEmitter'], function (Pubsub) {

    var queue = [],
        activePos,
        processing = false;

    function processNextItem () {
        processing = true;
        var nextCharacter = queue[0];
        activePos = 0;
        Pubsub.emitEvent('queue:ready', [nextCharacter]);

    }

    function handleGaugeUpdate (gaugeData) {

        if (gaugeData.readyState) {
            queue.push(gaugeData.character);

            if (!processing) {
                processNextItem();
            }
        }
    }

    function handleMoveSkip() {
        var nextCharacter = queue[activePos],
            queueLength = queue.length;

        for (index in queue) {
            if (queue[index].vitals.baseType === 'hero' && index > activePos) {
                nextCharacter = queue[index];
                activePos = index;
                break;
            }

            if (index == queueLength-1) {
                nextCharacter = queue[0];
                activePos = 0;
            }
        }

        Pubsub.emitEvent('queue:ready', [nextCharacter]);
    }

    function handleMoveEnd () {
        if (activePos > 0) {
            var startedFrom = queue.splice(0, 1)[0];
            queue.splice(activePos, 0, startedFrom);
            if (activePos > 1) {
                var skippedTo = queue.splice(activePos-1, 1)[0];
                queue.unshift(skippedTo);
            }
        }

        queue.splice(0, 1);
        if (queue.length > 0 && processing === true) {
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
        var queueTargetIndex = indexOfCharacter(queue, character);
        if (queueTargetIndex >= 0) {
            queue.splice(queueTargetIndex, 1);
        }
    }

    function resetQueue () {
        console.log("RESETTING QUEUE");
        queue = [];
        activePos = 0;
        processing = false;
    }

    Pubsub.addListener('activitygauge:update', handleGaugeUpdate);
    Pubsub.addListener('controller:move:end', handleMoveEnd);
    Pubsub.addListener('controller:character:killed', removeKilledCharacter);
    Pubsub.addListener('controller:battle:end', resetQueue);
    Pubsub.addListener('abilities:skip', handleMoveSkip);
});
