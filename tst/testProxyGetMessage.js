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

var credentials = {
    secret:"authentificationKey",
    remoteAdress:"adress",
    remotePort:5555,
    callBackUrl:""
}
var theMessage = 'Some message';

credentials = JSON.stringify(credentials);
// write data to request body
var req = http.request(options, function (res) {
    res.setEncoding('utf8');
    var sessionId = '';
    res.on('data', function (chunk) {
        sessionId += chunk;
    });
    res.on('end', function (chunk) {
        var clientId = proxy.getClientId(sessionId);
        messageQueue.addMessage(clientId, theMessage);
        makeGetRequest(sessionId);
    });
});
req.on('error', function (e) {
    console.log('problem with request: ' + e.message);
});
req.write(credentials);
req.end();

function makeGetRequest(sessionId) {
    options.method = 'GET';
    options.path = '/message/' + sessionId;
    var req = http.get(options, function (res) {
        var message = "";
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            message += chunk;
        });
        res.on('end', function () {
            messageQueue.cleanQueue(proxy.getClientId(sessionId));
            assert.equal(message, JSON.stringify(theMessage),
                "The received messages are different." +
                    "\n\t Received: " + message +
                    "\n\t Expected: " + theMessage + '\n');

            console.log('Test Proxy GetMessage - OK');
            clean();
        });
    });
}

function clean(code) {
    messageQueue.close();
    //required in order to flush all console logs
    setTimeout(function () {
        if (code) {
            process.exit(code);
        }
        process.exit(0);
    }, 100);
}




