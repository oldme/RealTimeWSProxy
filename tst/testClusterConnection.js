//sends a login message to the cluster. Requires a running cluster instance. An a portal that will authenticate the user.

var net = require('net');
var messageSender = require('../node_modules/swarmutil/lib/SwarmUtils');
//
//clientConn.on('data', function (data) {
//    console.log('data:', data.toString());
//});
//clientConn.on('error', function (err) {
//    console.log('error:', err.message);
//});
//clientConn.on('close', function () {
//    console.log('Connection closed');
//});

//clientConn.end(message.length.toString()+message);


var Login = '{"authenticationToken":"authenticationToken",' +
    '"class":"ro.trp.greencluster.event.login.LoginEvent",' +
    '"clientIpAddress":"clientIpAddress",' +
    '"roomId":"roomId",' +
    '"sourceActor":{"actor":"SourceActorName","class":"ro.trp.util.ActorAdress","room":"sourceActorRoom"},' +
    '"targetActor":{"actor":"TargetActorName","class":"ro.trp.util.ActorAdress","room":"targetActorRoom"},' +
    '"type":"LOGIN_EVENT",' +
    '"userId":"1"}}';
var clientConn = net.connect(4545, '192.168.20.60');
writeInt(clientConn, -1);
messageSender.writeObject(clientConn, '{"Some message"}');
clientConn.end();
clientConn = net.connect(4545, '192.168.20.60');
writeInt(clientConn, -1);

messageSender.writeObject(clientConn, Login);
clientConn.end();

function writeInt(stream, int) {
    var bytes = new Array(4)
    bytes[0] = int >> 24
    bytes[1] = int >> 16
    bytes[2] = int >> 8
    bytes[3] = int

    stream.write(new Buffer(bytes));
}

