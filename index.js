var app = require('express')();
var server = require('http').Server(app);
var socketIo = require('socket.io')(server);

server.listen('8000');

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/index.html');
});

var usersList = [];

socketIo.on('connection', function(socket) {
  console.log('New user connected...');

  // loginUser
  socket.on('loginUser', function (username) {
    console.log('New user logged in: ' + username);
    usersList.push(username);
    socket.emit('usersList', usersList);
  });

  // newMessage
  socket.on('newMessage', function (msg, group, username) {
    // Grab message from client
    console.log('New Message: ' + msg);
    // Emit message to all users
    socket.to(group).emit('clientMessage', {
      type: "text",
      username: username, 
      message: msg,
    });
  });

  // joinGroup
  socket.on('joinGroup', function (groupName) {
    // Grab group name from client
    console.log('User joined new group: ' + groupName);
    socket.join(groupName);
  });

  // exitGroup
  socket.on('exitGroup', function (groupName) {
    // Grab group name from client
    console.log('User left group: ' + groupName);
    socket.leave(groupName);
  });
})

