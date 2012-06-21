//todo add asserts
var q = require('./../src/MessageQueue.js');

var clientId = 'testClient';
var msg1 = "Some event";
var msg2 = "Some Other event";
var messageReceived = false;
q.cleanQueue(clientId);
q.addMessage(clientId, msg1);
q.addMessage(clientId, msg2);

q.getAllClientMessages(clientId, function (err, messages) {
    if (err) {
        throw "TEST FAILED with error: " + err;
    }

    check(messages);
})

function check(messages) {

    if (messages.length == 2 && contains(messages, msg1) && contains(messages, msg2)) {
        console.log("OK");
    }
    else {
        console.log("TEST FAILED. Received: " + messages);
    }
    clean();
}
;
function clean() {
    q.cleanQueue(clientId);
    q.close();
}

function contains(array, value) {
    return array.indexOf(value) > -1;
}

