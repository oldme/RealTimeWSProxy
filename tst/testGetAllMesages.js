var http = require('http');

var proxy = require('./../src/MessageProxy');
var queue = require('./../src/MessageQueue');
var messageQueue = new queue(false);

var assert = require('assert');

var PROXY_PORT = 3000;

proxy.server.listen(PROXY_PORT);

var options = {
    host:'localhost',
    port:PROXY_PORT,
    path:'/sessions/',
    method:'PUT'
};

var theMessages = new Array();
for (var i = 0; i < 10; i++) {
    theMessages.push('Message ' + i);
}

startTest();

function startTest() {
    getSession();
}

function getSession() {
    var credentials = {
        secret:"authentificationKey",
        remoteAdress:"adress",
        remotePort:5555,
        callBackUrl:""
    }
    var sessionId = '';
    credentials = JSON.stringify(credentials);
// write data to request body
    var getSessionRequest = http.request(options, function (res) {
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            sessionId += chunk;
        });
        res.on('end', function () {
            var clientId = proxy.getClientId(sessionId);
            for (var i in theMessages) {
                messageQueue.addMessage(clientId, theMessages[i]);
            }
            makeGetRequest(sessionId);
        });
    });
    getSessionRequest.on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });
    getSessionRequest.write(credentials);
    getSessionRequest.end();
}

function makeGetRequest(sessionId) {
    options.method = 'GET';
    options.path = '/messages/' + sessionId;
    var req = http.get(options, function (res) {
        var receivedMessages = "";
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            receivedMessages += chunk;
        });
        res.on('end', function () {
            console.log("receivedMessages:" + receivedMessages);
            receivedMessages = JSON.parse(receivedMessages);
            assert.equal(receivedMessages.length, theMessages.length, "The array received is not equal in length to the one send" +
                "\n \t Received: " + receivedMessages.length +
                "\n \t Send: " + theMessages.length)
            for (var i in receivedMessages) {
                assert.ok(theMessages.indexOf(receivedMessages[i]) >= 0, "The message " + receivedMessages[i] + " is not found in the send messages: " + theMessages);
            }
            console.log('Test Proxy GetALLMessages - OK');
            clean();
        });
    });
}

function clean(code) {
    //messageQueue.cleanQueue(proxy.getClientId(sessionId));
    messageQueue.close();
    //required in order to flush all console logs
    setTimeout(function () {
        if (code) {
            process.exit(code);
        }
        process.exit(0);
    }, 100);
}


