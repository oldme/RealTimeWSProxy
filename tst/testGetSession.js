//requires a redis instance running on localhost, and a cluster connection
//todo add asserts
var http = require('http');

var main = require('./../src/MessageProxy');

var PROXY_PORT = 3000;
var numberOfClients = 5;

main.server.listen(PROXY_PORT);

var options = {
    host:'localhost',
    port:PROXY_PORT,
    path:'/sessions/',
    method:'PUT'
};

var deleteOptions = {
    host:'localhost',
    port:PROXY_PORT,
    path:'/sessions/',
    method:'DELETE'
};

var credentials = {
    secret:"authentificationKey",
    remoteAdress:"adress",
    remotePort:5555,
    callBackUrl:"notification_callback_url"
}

credentials = JSON.stringify(credentials);

var receivedSessions = new Array();

// write data to request body
for (var i = 0; i < numberOfClients; i++) {
    var req = http.request(options, function (res) {
        res.setEncoding('utf8');
        var sessionId = '';
        res.on('data', function (chunk) {
            sessionId += chunk;
        });
        res.on('end', function () {
            if (sessionId) {
                receivedSessions.push(sessionId);
            }
            if (receivedSessions.length === numberOfClients) {
                console.log("Received session ids are: " + receivedSessions);
                console.log("OK");
                clean();
            }
        });
    });

    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });
    req.write(credentials);
    req.end();
}

function clean(code) {
    //required in order to flush all console logs
    setTimeout(function () {
        if (code) {
            process.exit(code);
        }
        process.exit(0);
    }, 100);
}



