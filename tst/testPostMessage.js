var http = require('http');
var net = require('net');
var proxy = require('./../src/MessageProxy');
var queue = require('./../src/MessageQueue');
var util = require('swarmutil');
var messageQueue = new queue(false);

var assert = require('assert');

var PROXY_PORT = 3000;

proxy.server.listen(PROXY_PORT);

var sessionId = '';

var parser = util.createFastParser(function (data) {
    console.log(data);
    assert.equal(data, theMessage, "Messages received by the cluster server are different." +
        "\n\t Received: " + data +
        "\n\t Expected: " + theMessage + '\n');

    makeGetRequest();
    console.log("POST TEST - OK");
});

var echoTCPServer = net.createServer(function (socket) {
    var first = true;
    socket.on('data', function (data) {
        if (!first) { //the -1 value send to designate a JSON socket
            parser.parseNewData(data.toString('utf8'));
        }
        first = false;
        //console.log(data);
    });
});
echoTCPServer.listen(4545);

var options = {
    host:'localhost',
    port:PROXY_PORT,
    path:'/sessions/',
    method:'PUT'
};
var theMessage = 'Some message';
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
    credentials = JSON.stringify(credentials);
// write data to request body
    var getSessionRequest = http.request(options, function (res) {
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            sessionId += chunk;
        });
        res.on('end', function () {
            var clientId = proxy.getClientId(sessionId);
            messageQueue.addMessage(clientId, theMessage);
            postMessage(sessionId);
        });
    });
    getSessionRequest.on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });
    getSessionRequest.write(credentials);
    getSessionRequest.end();
}

function postMessage(sessionId) {
    options.method = 'POST';
    options.path = '/message/' + sessionId;
    var req = http.request(options);
    req.write(theMessage);
    req.end();
}

function makeGetRequest() {
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
            console.log('Get POSTED Message - OK');
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






