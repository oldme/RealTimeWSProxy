/*
 - PUT requests to http://proxy_adress/sessions/sessionId to initiate a new virtual connection(session)
 {
 secret:"authentificationKey";
 remoteAdress:"adress";
 remotePort:"port";
 callBackUrl:"notification_callback_url" //url that will be called by the proxy on new messages (by POST-ing to that URL)
 }
 - POST requests on http://proxy_adress/message/sessionId/ to send messages from client to proxy
 - GET  requests on http://proxy_adress/message/sessionId/ to request a message
 - GET  requests on http://proxy_adress/messages/sessionId to request all available messages
 */


var http = require('http');
var clusterPort = 4545;
var clusterAddr = "192.168.20.60";
var router = require('choreographer').router();
var messageQueue = require('./MessageQueue');
var net = require('net');

var currentSessionId = 0;
var sessions = new Array();
var clients = new Array();
var clusterConnections = new Array();

router.get('/message/*', getMessage)
    .get('/messages/*', getAllMessages)
    .post('/message/*', postMessage)
    //client starting point
    .put('/sessions/*', addClient)
    .delete('/sessions/*', deleteClient)
    .notFound(function (req, res) {
        res.writeHead(404, {'Content-Type':'text/plain'});
        res.end('404: This server is working.\n' +
            'I\'m afraid ' + req.url + ' cannot be found here.\n');
    });

exports.server = http.createServer(function (req, res) {
    console.log("Received request from: " + req.connection.remoteAddress);
    router.apply(this, arguments);
});

function sendClientSession(session, data, res) {
    if (session === '') {
        session = ++currentSessionId;
        console.log("Current session is: " + currentSessionId);
    }
    sessions[session] = data;
    res.write(JSON.stringify(session));
    res.end();
}

function getSessionClientId(session) {
    if (session = '') {
        return '';
    }
    var clientData = sessions[session];
    return getClientId(clientData.secret, clientData.remoteAddr);
}

function getMessage(req, res, session) {
    var clientId = getSessionClientId(session);
    if (!clientId) {
        res.write(JSON.stringify("Invalid session ID"));
        res.end();
        console.log('Invalid client id for session: ' + session);
        return;
    }
    messageQueue.getClientMessage(clientId, function (err, message, confirmMessageReceivedHandler) {
        if (err) {
            console.log("ERROR:GetMessage for client:< " + clientId + "> errMsg:" + err);
            res.writeHead(501, { 'Content-Type':'text/plain' });
            res.end(err);
        }
        else {
            var jsonMessage = JSON.stringify(message);
            res.writeHead(200, { 'Content-Type':'application/json' });
            res.write(jsonMessage);
            res.end();
        }
        confirmMessageReceivedHandler(clientId, err, message);
    })
}

function getAllMessages(req, res, session) {
    var clientId = getSessionClientId(session);
    if (!clientId) {
        res.write(JSON.stringify("Invalid session ID"));
        res.end();
        console.log('Invalid client id for session: ' + session);
        return;
    }
    //TODO remove after get or not ?
    messageQueue.getAllClientMessages(clientId, function handleResponse(responseData, err) {
        if (err !== '') {
            res.writeHead(501, { 'Content-Type':'text/plain' });
            res.end(err);
        }
        else {
            responseData = JSON.stringify(responseData);
            res.writeHead(200, { 'Content-Type':'application/json' });
            res.write(responseData);
            res.end();
        }
    })
}

function postMessage(req, res, session) {
    var clientId = getSessionClientId(session);
    if (!clientId) {
        console.log('Invalid client id for session: ' + session);
        res.write(JSON.stringify("Invalid session ID"));
        res.end();
        return;
    }
    var eventData = '';
    req.addListener('data', function (chunk) {
        eventData += chunk;
    });
    req.addListener('end', function () {
        //write the size of the packet
        writeInt(clusterConnections[clientId], eventData.length);
        clusterConnections[clientId].write(eventData);
        clusterConnections[clientId].end();
    })
}

function addClient(req, res, session) {
    var data = '';
    req.addListener('data', function (chunk) {
        data += chunk;
    });
    req.addListener('end', function () {
        data = JSON.parse(data);
        if (data.remoteAddr === '') {
            data.remoteAddr = req.connection.remoteAddress;
        }
        if (data.secret === '') {
            response.writeHead(400, { 'Content-Type':'text/plain' });
            response.end('400: No secret key provided');
            return;
        }
        var clientId = getClientId(data.secret, data.remoteAddr);
        if (contains(clients, clientId)) {
            response.writeHead(401, { 'Content-Type':'text/plain' });
            response.end('401: Client already connected');
            return;
        }
        //everything is OK create the client
        createClusterClient(clientId);
        clients.push(clientId);
        sendClientSession(session, data, res);
    });
}

function deleteClient(req, res, session) {
    var clientId = getSessionClientId(session);
    if (clientId) {
        //close the connection
        clusterConnections[clientId].destroy();
        delete clusterConnections[clientId];
        deleteFromArray(clients, clientId);
        delete sessions[session];
    }
}


/**
 * removes the first occurrence of value in array.
 * Returns the removed value if it was found, of false otherwise
 * @param array
 * @param value
 */
function deleteFromArray(array, value) {
    if (!array instanceof Array) {
        return false;
    }
    var index = array.indexOf(value);
    if (index > 0) {
        array.splice(index, 1);
    }
    else {
        return false;
    }
}
/**
 *  Utility method
 * @param clients
 * @param clientId
 * @return {Boolean}
 */
function contains(array, clientId) {
    return (array.indexOf(clientId) > 0);
}

/**
 *The value of the client id is the key of all the maps in this class
 */
function getClientId(secret, clientAddr) {
    return secret + "@" + clientAddr;
}

function createClusterClient(clientId) {
    var clientConn = net.connect(clusterPort, clusterAddr);
    clientConn.on('data', function (data) {
        console.log('data:', data.toString());
        messageQueue.addMessage(clientId, data);
    });
    clientConn.on('error', function (err) {
        console.log('error:', err.message);
    });
    clientConn.on('close', function () {
        console.log('Connection closed for client: ' + clientId);
    });
    //In order to signal that we will use a JSON socketCommunication, we must write a singe int value of -1
    writeInt(clientConn, -1);
    clusterConnections[clientId] = clientConn;
}

function writeInt(stream, int) {
    var bytes = new Array(4)
    bytes[0] = int >> 24
    bytes[1] = int >> 16
    bytes[2] = int >> 8
    bytes[3] = int
    stream.write(new Buffer(bytes))
}