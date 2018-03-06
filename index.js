var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen('8000');

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/index.html');
});

var usersList = {};

io.on('connection', function(socket) {
  console.log('New user connected...');

  // loginUser
  socket.on('loginUser', function (username) {
    console.log(username + ' logged in');
    usersList[username] = username;
    io.username = username;
    io.emit('usersList', usersList);
    io.sockets.emit('onlineUsers', socket.conn.server.clientsCount);
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

  // disconnect
  socket.on('disconnect', function () {
    io.sockets.emit('onlineUsers', socket.conn.server.clientsCount)
    delete usersList[io.username];
    io.emit('usersList', usersList);
  });

  // joinGroup
  socket.on('joinGroup', function (groupName, username) {
    // Grab group name from client
    console.log(username + ' joined  group: ' + groupName);
    socket.join(groupName);
  });

  // exitGroup
  socket.on('exitGroup', function (groupName, username) {
    // Grab group name from client
    console.log(username + ' left group: ' + groupName);
    socket.leave(groupName);
  });
})

