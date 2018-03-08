const express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var PORT = '8000';
server.listen(PORT, function() {
  console.log('Listening on ' + PORT + '...');
});

app.use('/static', express.static('public'));

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/index.html');
});


const chatHistorySize = 250;
const usersList = {};
const chatHistory = [];
const systemName = 'Console';

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
        color = getColor();
        var msgToSend = usernameCookie + "'s name was taken.\nNew name is: " + username;
        sendSysMsg(msgToSend, socket);
        console.log(msgToSend);
      } else {
        username = usernameCookie;
        color = colorCookie;
      }
    } else {
      // new user
      username = getUsername();
      color = getColor();
      var msgToSend = 'New user created: ' + username;
      sendSysMsg(msgToSend, socket);
      console.log(msgToSend);
    }

    // inform client
    var user = {
      username: username,
      color: color,
    };
    socket.emit('initUser', user);
    showHistory(socket);
    var msgToSend = username + ' connected';
    // sendSysMsg(msgToSend, io);
    console.log(msgToSend);
    
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
      color: msg.color,
      message: msg.message,
    };
    // Emit message to all users
    io.emit('clientMessage', msgObj);
    logMessage(msgObj);
  });

  // change username
  socket.on('changeNick', function (msg) {
    var newName = msg.message.slice(6).trim();
    console.log(msg.username + ' asked to rename to: ' + newName);
    if(newName == '') {
      var msgToSend = 'Error: username can\'t be empty.';
      sendSysMsg(msgToSend, socket);
      console.log(msgToSend);
    } else if(usersList[newName]) {
      var msgToSend = 'Error: username taken.';
      sendSysMsg(msgToSend, socket);
      console.log(msgToSend);
    } else if(newName.length > 16) {
      var msgToSend = 'Error: username can\'t exceed 16 chars.';
      sendSysMsg(msgToSend, socket);
      console.log(msgToSend);
    } else {
      // update user list
      delete usersList[socket.username];
      socket.username = newName;
      usersList[newName] = newName;
      io.emit('usersList', usersList);
      io.emit('onlineUsers', socket.conn.server.clientsCount);

      // inform client
      var user = {
        username: socket.username,
        color: socket.color,
      };
      socket.emit('initUser', user);
      var msgToSend = 'Username changed to: ' + socket.username;
      sendSysMsg(msgToSend, socket);
      sendSysMsg(msg.username + ' renamed to ' + socket.username, io);
      console.log(msgToSend);
    }
  });

  // change color
  socket.on('changeColor', function (msg) {
    var newColor = msg.message.slice(10).trim();
    console.log(msg.username + ' asked to recolor to: ' + newColor);
    // Source: https://goo.gl/9LSj5K
    var validColor  = /([0-9A-F]{6}$)|([0-9A-F]{3}$)/i.test(newColor);
    if(newColor == '') {
      console.log('Error: color can\'t be empty.');
    } else if(!validColor) {
      console.log('Error: invalid color.');
    } else {
      socket.color = '#' + newColor;
      // inform client
      var user = {
        username: socket.username,
        color: socket.color,
      };
      socket.emit('initUser', user);
      var msgToSend = 'Color successfully changed to: ' + socket.color;
      sendSysMsg(msgToSend, socket);
      sendSysMsg(msg.username + ' changed their color to: ' + socket.color, io);
      console.log(msgToSend);
    }
  });

  // disconnect
  socket.on('disconnect', function () {
    var msgToSend = socket.username + ' disconnected';
    sendSysMsg(msgToSend, io);
    console.log(msgToSend);
    delete usersList[socket.username];
    io.emit('onlineUsers', socket.conn.server.clientsCount)
    io.emit('usersList', usersList);
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

// send system message
// use socket to send to caller only
// use io to send to all users
function sendSysMsg(msg, sock) {
  var msgObj =  {
    time: getTime(),
    username: systemName, 
    message: msg,
  };
  sock.emit('sysMessage', msgObj);
  console.log('sysMsg: ' + msg);
}