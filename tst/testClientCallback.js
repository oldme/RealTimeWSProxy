/**
 * Created with IntelliJ IDEA.
 * User: narcis
 * Date: 6/26/12
 * Time: 3:34 PM
 * To change this template use File | Settings | File Templates.
 */
var net = require('net');
var proxy = require('./../src/MessageProxy');
var http = require('http');
var util = require('swarmutil');
var assert = require('assert');

var PROXY_PORT = 3000;
var CALLBACK_PORT = 4000;
var CLUSTER_PORT = 4545;

//mock cluster server

var echoServer = net.createServer(function (socket) { //'connection' listener

    var first = true;
    socket.on('end', function () {
        console.log('PROXY server disconnected');
    });
    socket.on('data', function (data) {
        if (!first) {
            parser.parseNewData(data.toString('utf8'));
            console.log("PROXY server received: " + data);
        }
        first = false;
    });
    var parser = util.createFastParser(function (data) {
        util.writeObject(socket, data);
        //socket.write(data);
        // socket.pipe(socket);

        //clean();
    });
});

//client http server
var router = require('choreographer').router();
router.post('/message/*', function (req, res, session) {
    var message = '';
    req.addListener('data', function (chunk) {
        message += chunk;

    });
    req.addListener('end', function () {
        assert.equal(sendMessage, message, "The received chunk is not equal to the send message" +
            "\n\t Received: " + message +
            "\n\t Expected: " + sendMessage);
        console.log('CALLBACK Test OK');
        clean();
    })
});
callbackServer = http.createServer(function (req, res) {
    console.log("Received request from: " + req.connection.remoteAddress);
    router.apply(this, arguments);
});
//end client http server

var sendMessage = 'Some test message';
sendMessage = JSON.stringify(sendMessage);
//http message post
startTest();

function startTest() {
    proxy.server.listen(PROXY_PORT);
    callbackServer.listen(CALLBACK_PORT);
    echoServer.listen(CLUSTER_PORT);
    getSession();
}

function getSession() {

    var getSessionOptions = {
        host:'localhost',
        port:PROXY_PORT,
        path:'/sessions/',
        method:'PUT'
    }
    var credentials = {
        secret:"authentificationKey",
        remoteAdress:"localhost",
        port:CALLBACK_PORT,
        callBackUrl:"/message/x"
    }
    credentials = JSON.stringify(credentials);
// write data to request body
    var getSessionRequest = http.request(getSessionOptions, function (res) {
        res.setEncoding('utf8');
        var sessionId = '';
        res.on('data', function (chunk) {
            sessionId += chunk;
        });
        res.on('end', function () {
            var clientId = proxy.getClientId(sessionId);
            makePostRequest(sessionId);
        });
    });
    getSessionRequest.on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });
    getSessionRequest.write(credentials);
    getSessionRequest.end();
}

function makePostRequest(clientSession) {
    var postOptions = {
        host:'localhost',
        port:PROXY_PORT,
        path:'/message/' + clientSession,
        method:'POST'
    };
    var req = http.request(postOptions);
    //write some message
    req.end(sendMessage);
}

function clean(code) {
    setTimeout(function () {
        if (code) {
            process.exit(code);
        }
        process.exit(0);
    }, 500);
}