/**
 * Created by: Narcis ARMASU <narcis.armasu@trp.ro>
 * Date: 6/21/12
 */

var q = require('./../src/MessageQueue.js');
var clientId = 'testClient';
var noMessageReceived = true;


q.getClientMessage(clientId, function (err, message) {
    if (err) {
        throw "TEST FAILED with error: " + err;
    }
    if (!message) {
        noMessageReceived = true;
    }
    //check();
    clean();
})

exports.test1 = function (test) {
    test.ok(!noMessageReceived, "TEST FAILED. Some Message was received");
    test.done();
}

function clean() {
    q.cleanQueue(clientId);
    q.close();
}

