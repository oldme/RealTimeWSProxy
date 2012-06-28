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
//require("long-stack-traces")
var net = require('net');
var util = require('swarmutil');

var clusterPort = 4545;
var clusterAddr = "192.168.20.60";
var router = require('choreographer').router();
var ProxyMessageQueue = require('./MessageQueue');
var messageQueue = new ProxyMessageQueue(false);

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
    router.apply(this, arguments);
});

function sendClientSession(session, data, res) {
    if (session === '') {
        session = ++currentSessionId;
    }
    sessions[session] = data;
    res.write(JSON.stringify(session));
    res.end();
}

//used for testing
exports.getClientId = function (session) {
    if (session === '') {
        return '';
    }
    var clientData = sessions[session];
    if (clientData) {
        return getClientId(clientData.secret, clientData.remoteAdress);
    }
    return null;
}

function getMessage(req, res, session) {
    var clientId = exports.getClientId(session);
    if (!clientId) {
        res.write(JSON.stringify("Invalid session ID"));
        res.end();
        console.error('Invalid client id for session: ' + session);
        return;
    }
    messageQueue.getClientMessage(clientId, function (err, message, confirmMessageReceivedHandler) {
        if (err) {
            console.error("ERROR:GetMessage for client:< " + clientId + "> errMsg:" + err);
            res.writeHead(501, { 'Content-Type':'text/plain' });
            res.end(err);
        }
        else {
            var jsonMessage = JSON.stringify(message);
            res.writeHead(200, { 'Content-Type':'application/json' });
            res.write(jsonMessage);
            res.end();
        }
        if (confirmMessageReceivedHandler) {
            confirmMessageReceivedHandler(clientId, err, message);
        }
    })
}

function getAllMessages(req, res, session) {
    var clientId = exports.getClientId(session);
    if (!clientId) {
        res.write(JSON.stringify("Invalid session ID"));
        res.end();
        console.error('Invalid client id for session: ' + session);
        return;
    }
    //TODO remove after get or not ?
    messageQueue.getAllClientMessages(clientId, function handleResponse(err, responseData) {
        if (err) {
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
    var clientId = exports.getClientId(session);
    if (!clientId) {
        console.error('Invalid client id for session: ' + session);
        res.write(JSON.stringify("Invalid session ID"));
        res.end();
        return;
    }
    var message = '';
    req.addListener('data', function (chunk) {
        message += chunk;
    });
    req.addListener('end', function () {
        util.writeObject(clusterConnections[clientId], message);
    })
}

function addClient(req, res, session) {
    function ClientData(data) {
        this.secret = data.secret;
        this.remoteAdress = data.remoteAdress;
        this.callback = data.callBackUrl;
        this.port = data.port;
    }

    var data = '';
    req.addListener('data', function (chunk) {
        data += chunk;
    });
    req.addListener('end', function () {
        data = JSON.parse(data);
        if (data.remoteAdress === '') {
            data.remoteAdress = req.connection.remoteAddress;
        }
        if (data.secret === '') {
            response.writeHead(400, { 'Content-Type':'text/plain' });
            response.end('400: No secret key provided');
            return;
        }
        var clientId = getClientId(data.secret, data.remoteAdress);
        if (contains(clients, clientId)) {
            response.writeHead(401, { 'Content-Type':'text/plain' });
            response.end('401: Client already connected');
            return;
        }
        var clientData = new ClientData(data);
        //everything is OK create the client
        createClusterClient(clientId, clientData);
        clients.push(clientId);
        sendClientSession(session, data, res);
    });
}

function deleteClient(req, res, session) {
    var clientId = getClientId(session);
    if (clientId) {
        //close the connection
        if (clusterConnections[clientId]) {
            clusterConnections[clientId].destroy();
            delete clusterConnections[clientId];
            deleteFromArray(clients, clientId);
            delete sessions[session];
        }
        else {
            console.error("No connection for client: " + clientId);
        }
    }
}


/**
 * removes the first occurrence of a value in the array.
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


function createClusterClient(clientId, clientData) {
    var clientConn = net.connect(clusterPort, clusterAddr);
    var jsonMessageParser = util.createFastParser(messageReadCallback);
    clientConn.on('data', function (data) {
        console.log('Client received from server: ' + data);
        jsonMessageParser.parseNewData(data);
    });

    function messageReadCallback(data) {
        if (clientData.callback) {
            postToClient(data, clientData.remoteAdress, clientData.port, clientData.callback);
            function postToClient(data, remoteAdress, port, callback) {
                var options = {
                    host:remoteAdress,
                    port:port,
                    path:callback,
                    method:'POST'
                };
                var req = http.request(options);
                //in case of error, the message will be queued
                req.on('error', function (e) {
                    console.error('problem with request: ' + e.message);
                    messageQueue.addMessage(clientId, data);
                });
                req.end(data);
            }
        }
        else { //queue the message
            messageQueue.addMessage(clientId, data);
        }
    }

    clientConn.on('error', function (err) {
        console.error('error:', err.message);
    });
    clientConn.on('close', function () {
        console.error('Connection closed for client: ' + clientId);
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