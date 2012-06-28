//TODO maybe add a cleanup method for message queues.
// It will take the list of currently active clients
// and delete all the backup queues that are not attached to any of the clients.

var redis = require("redis"),
    redis_client = redis.createClient();
BACKUP_QUEUE_SUFIX = 'backup';

var queue = new Array();

var clients = new Array();

function ProxyMessageQueue(useRedis) {
    this.useRedis = useRedis;
}

ProxyMessageQueue.prototype.addMessage = addMessage;
ProxyMessageQueue.prototype.getClientMessage = getClientMessage;
ProxyMessageQueue.prototype.getAllClientMessages = getAllClientMessages;
ProxyMessageQueue.prototype.cleanQueue = cleanQueue;
ProxyMessageQueue.prototype.close = close;


function addMessage(clientId, event) {
    if (this.useRedis) {
        redis_client.lpush(clientId, event);
    }
    else {
        if (!clients[clientId]) {
            clients[clientId] = new Array();
        }
        clients[clientId].push(event);
    }
}

function getClientMessage(clientId, handler) {
    if (this.useRedis) {
        //Remove and get the first element in a list, or block until one is available
        var backupQueue = getBackupQueue(clientId);
        redis_client.RPOPLPUSH(clientId, backupQueue, function (err, result) {
            if (err) {
                console.log("Message POP Error: " + err);
            }
            handler(err, result, messageReceivedHandler);
        });
    }
    else {
        var result;
        if (clients[clientId]) {
            result = clients[clientId].pop();
        }
        handler(null, result, null);
    }
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
    if (this.useRedis) {
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
    else {
        console.error("REDIS IS NOT USED, this method should not have benn called");
    }
}

function deleteMessageFromQueue(backupQueue, message) {
    if (this.useRedis) {
        //delete all occurrences of the message in the queue
        redis_client.lrem(backupQueue, 0, message);
    }
}

function getBackupQueue(clientId) {
    return clientId + BACKUP_QUEUE_SUFIX;
}

function getAllClientMessages(clientId, handler, remove) {
    if (this.useRedis) {
        //Remove and get the first element in a list, or block until one is available
        redis_client.lrange(clientId, 0, -1, function (err, result) {
            if (err) {
                console.error("Message POP Error: " + err);
            }
            handler(err, result);
        });
        if (remove) {
            redis_client.del(clientId);
        }
    }
    else {
        handler(null, clients[clientId]);
        if (remove) {
            delete clients[clientId];
        }
    }
}

function cleanQueue(clientId) {
    if (this.useRedis) {
        redis_client.del(clientId);
    }
    else {
        delete clients[clientId];
    }
}

function close() {
    if (this.useRedis) {
        redis_client.end();
    }
    else {
        clients = null;
    }

}

module.exports = ProxyMessageQueue;


