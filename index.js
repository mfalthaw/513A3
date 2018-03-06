var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var PORT = '8000';
server.listen(PORT, function() {
  console.log('Listening on ' + PORT + '...');
});

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/index.html');
});

var usersList = {};

io.on('connection', function(socket) {
  console.log('New user connected');

  // initUser
  socket.on('initUser', function () {
    var username = getUsername();
    usersList[username] = username;
    socket.username = username;
    io.emit('usersList', usersList);
    io.emit('onlineUsers', socket.conn.server.clientsCount);
    console.log(username);
  });

  // newMessage
  socket.on('newMessage', function (msg) {
    // Grab message from client
    console.log(msg.username + ' sent: ' + msg.message);
    var msgObj =  {
      time: getTime(),
      username: msg.username, 
      message: msg.message,
    };
    // Emit message to all users
    io.emit('clientMessage', msgObj);
  });

  // disconnect
  socket.on('disconnect', function () {
    console.log(socket.username + ' disconnected');
    delete usersList[socket.username];
    io.emit('onlineUsers', socket.conn.server.clientsCount)
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

// return current time
function getTime() {
  return new Date().toLocaleTimeString();
}

// return random username
function getUsername() {
  return 'user' + Math.floor((Math.random() * 1000) + 1);
}