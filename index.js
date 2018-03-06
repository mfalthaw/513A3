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

var chatHistorySize = 250;

var usersList = {};
var chatHistory = [];

io.on('connection', function(socket) {
  console.log('New user connected');

  // initUser
  socket.on('initUser', function (usernameCookie, colorCookie) {
    var username = '';
    var color = '';
    if (usernameCookie && colorCookie) {
      // returning user
      if(usersList[usernameCookie]) {
        // if name was taken
        username = getUsername();
        var msg = usernameCookie + "'s name was taken.\nNew name is: " + username;
        console.log(msg);
      } else {
        username = usernameCookie;
      }
      color = colorCookie;
    } else {
      // new user
      username = getUsername();
      color = getColor();
      console.log('New user created: ' + username);
    }

    // inform client
    var user = {
      username: username,
      color: color,
    };
    socket.emit('initUser', user);
    showHistory(socket);
    
    // update user list
    socket.username = username;
    socket.color = color;
    usersList[username] = username;
    io.emit('usersList', usersList);
    io.emit('onlineUsers', socket.conn.server.clientsCount);
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
    logMessage(msgObj);
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
  var temp = 'user' + Math.floor((Math.random() * 1000) + 1);
  while (usersList[temp]) {
    temp = 'user' + Math.floor((Math.random() * 1000) + 1);
  }
  return temp;
}

// return random color
// Source: https://stackoverflow.com/questions/1484506/random-color-generator
function getColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// log message
function logMessage(msg) {
  if(chatHistory.length >= chatHistorySize) {
    chatHistory.shift();
  }
  chatHistory.push(msg);
}

// show chat history
function showHistory(socket) {
  for(i in chatHistory) {
    socket.emit('clientMessage', chatHistory[i]);
  }
}