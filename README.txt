  RealTimeWSProxy is a node.js server that offers to php scripts and for other clients and 
application (mainly because php can't keep a long term connection) a way to create a 
"bidirectional connection" to a long living server/cluster.
The connection is assumed to transport JSON messages.

The communication over HTTP will take place by making:

- PUT requests to http://proxy_adress/message/sessionId/secretKey to initiate a new virtual connection(session)
- POST requests on http://proxy_adress/message/sessionId/ to send messages from client to proxy
- PUT requests to http://proxy_adress/configure/sessionId/callback  for a session allready created and the content 
 containing a url that will be called by the proxy on new messages (by POST-ing to that URL)
- GET requests on http://proxy_adress/message/sessionId/ to request a message 
- GET requests on http://proxy_adress/all/sessionId to request all available messages


Dependencies: router,...
