var app = require('express')();
var server = require('http').Server(app);

server.listen('8000');

app.get('/', function(request, response) {
  response.send('Hello World!');
});
