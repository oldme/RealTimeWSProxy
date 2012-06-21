//TODO maybe add a cleanup method for message queues.
// It will take the list of currently active clients
// and delete all the backup queues that are not attached to any of the clients.

var redis = require("redis"),
    redis_client = redis.createClient();
BACKUP_QUEUE_SUFIX = 'backup';

exports.addMessage = function addMessage(clientId, event) {
    redis_client.lpush(clientId, event);
}

exports.getClientMessage = function getClientMessage(clientId, handler) {
    //Remove and get the first element in a list, or block until one is available
    var backupQueue = getBackupQueue(clientId);
    redis_client.RPOPLPUSH(clientId, backupQueue, function (err, result) {
        if (err) {
            console.log("Message POP Error: " + err);
        }
        handler(err, result, messageReceivedHandler);
    });
}

function messageReceivedHandler(clientId, err, message) {
    var backupQueue = getBackupQueue(clientId);
    if (err) {
        putAllMessagesBackIntoTheMainQueue(backupQueue, clientId);
    }
    else {
        deleteMessageFromQueue(backupQueue, message);
    }
}

function putAllMessagesBackIntoTheMainQueue(backupQueue, clientId) {
    redis_client.lrange(clientId, 0, -1, function (err, results) {
        if (err) {
            console.log("Message POP Error: " + err);
        }
        for (var res in results) {
            addMessage(clientId, res);
        }
        //remove all messages from the queue;
        redis_client.del(backupQueue);
    });
}

function deleteMessageFromQueue(backupQueue, message) {
    //delete all occurrences of the message in the queue
    redis_client.lrem(backupQueue, 0, message);
}


function getBackupQueue(clientId) {
    return clientId + BACKUP_QUEUE_SUFIX;
}

exports.getAllClientMessages = function getAllClientMessages(clientId, handler, remove) {
    //Remove and get the first element in a list, or block until one is available
    redis_client.lrange(clientId, 0, -1, function (err, result) {
        if (err) {
            console.log("Message POP Error: " + err);
        }
        handler(err, result);
    });
    if (remove) {
        redis_client.del(clientId);
    }
}

exports.cleanQueue = function (clientId) {
    redis_client.del(clientId);
}

exports.close = function () {
    redis_client.end();
}



