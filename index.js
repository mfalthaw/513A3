var app = require('express')();
var server = require('http').Server(app);
var socketIo = require('socket.io')(server);

server.listen('8000');

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/index.html');
});

socketIo.on('connection', function(socket) {
  console.log('New user connected...');

  // newMessage event
  socket.on('newMessage', function (data) {
    // Grab message from client
    console.log('New Message: ' + data);
    // Emit message to all users
    socket.emit('clientMessage', data);
  });

  // joinGroup event
  socket.on('joinGroup', function (data) {
    // Grab group name from client
    console.log('User joined new group: ' + data);
    socket.join(data);
  });
})

