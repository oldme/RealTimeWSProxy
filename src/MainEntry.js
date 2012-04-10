

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
var router = require('choreographer').router();

  
router.get('/message/*', function(req, res, session) {
	  res.writeHead(200, {'Content-Type': 'text/plain'});
	  res.end("message "+session+"\n");
})
.get('/messages/*', function(req, res, session) {
		
})
.post('/message/*', function(req, res, session) {
  
})
.put('/sessions/*', function(req, res, session) {
  
})
.delete('/sessions/*', function(req, res, session) {
  
})
.notFound(function(req, res) {
  res.writeHead(404, {'Content-Type': 'text/plain'});
  res.end('404: This server is a working.\n' +
    'I\'m afraid ' + req.url + ' cannot be found here.\n');
});

http.createServer(function(req, res) {
	  //do middleware stuff before routing
	  router.apply(this, arguments);
	  //do more stuff
	}).listen(80);