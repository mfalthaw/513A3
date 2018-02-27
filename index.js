var app = require('express')();
var server = require('http').Server(app);
var socketIo = require('socket.io')(server);

server.listen('8000');

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/index.html');
});


socketIo.on('connection', function(socket) {
  console.log('New user connected...');
})