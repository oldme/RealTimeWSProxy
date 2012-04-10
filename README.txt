   RealTimeWSProxy is a node.js server that offers to php scripts and for other 
clients and applications (mainly because php can't keep a long term connection) 
a way to create a "bidirectional connection" to a long living server/cluster.
The connection is assumed to transport JSON messages.
This server can be seen as a light message queue (now without message persistence)
Messages persistence in REDIS or jn a standard message queue will be added later.

The communication over HTTP will take place by making:

- PUT requests to http://proxy_adress/sessions/sessionId to initiate a new virtual connection(session)
	{
	secret:"authentificationKey",
	namedConnection:"connectionName",
	callBackUrl:"notification_callback_url" 
	//url that will be called by the proxy on new messages (by POST-ing to that URL)
	//can be null
	}
- POST requests on http://proxy_adress/message/sessionId/ to send messages from client to proxy
- GET  requests on http://proxy_adress/message/sessionId/ to request a message 
- GET  requests on http://proxy_adress/all/sessionId to request all available messages



Dependencies: json-streamer,
restler,... //http requets
https://github.com/DTrejo/json-streamify

