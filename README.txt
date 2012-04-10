RealTimeWSProxy is a node.js server that offers to php scripts and for other possible clients and application (mainly because php 
can't keep a long term connection) a way to create a "bidirectional connection" to a long living server/cluster.
The connection is assumed to transport JSON messages.

The communication over HTTP will take place by making:

- PUT requests to http://proxy_adresss/sessionId/secretKey to initiate a new virtual connection(session)
- POST requests on http://proxy_adresss/sessionId/ to send messages from client to proxy
- PUT requests to http://proxy_adresss/sessionId/callback  for a session allready created and the content 
 containing a url that will be called by the proy on new messages (by POST-ing to that URL)
- GET requests on http://proxy_adresss/sessionId/ to request a message 
- GET requests on http://proxy_adresss/sessionId/all to request all available messages


Dependencies: jsonsp
