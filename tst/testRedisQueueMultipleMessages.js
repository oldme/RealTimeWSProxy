//todo add asserts
var q = require('./../src/MessageQueue.js');

var clientId = 'testClient';
var msg1 = "Some event";
var msg2 = "Some Other event";
var messageReceived = false;
q.addMessage(clientId, msg1);
setTimeout(q.addMessage(clientId, msg2), 100); //timeout not really requires but just to be sure

q.getClientMessage(clientId, function (err, message) {
    if (err) {
        throw "TEST FAILED with error: " + err;
    }
    if (msg1 === message) {
        messageReceived = true;
    }
})
q.getClientMessage(clientId, function (err, message) {
    if (err) {
        throw "TEST FAILED with error: " + err;
    }
    if (msg2 === message) {
        messageReceived = true;
    }
    else {
        messageReceived = false;
    }
    check();
})

function check() {
    if (messageReceived) {
        console.log("OK");
    }
    else {
        console.log("TEST FAILED. Message was not received");
    }
    clean();
}
;

function clean() {
    q.cleanQueue(clientId);
    q.close();
}


