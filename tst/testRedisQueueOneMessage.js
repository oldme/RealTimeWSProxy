//todo add asserts

var q = require('./../src/MessageQueue.js');

var clientId = 'testClient';
var msg = "Some event";
var messageReceived = false;
q.addMessage(clientId, msg);

q.getClientMessage(clientId, function (err, message) {
    if (err) {
        throw "TEST FAILED with error: " + err;
    }
    if (msg === message) {
        messageReceived = true;
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

