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
// write data to request body
var i = 0;
for (var i = 0; i < numberOfClients; i++) {
    var req = http.request(options, function (res) {
        console.log('STATUS: ' + res.statusCode);
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
            http.request(deleteOptions).end();
        });
    });

    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });
    req.write(credentials);
    req.end();
}



