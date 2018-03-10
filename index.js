const express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
const uuid = require('uuid/v4');

var PORT = '8000';
server.listen(PORT, function() {
  log('Listening on ' + PORT + '...');
});

app.use('/static', express.static('public'));
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/index.html');
});


const chatHistorySize = 250;
const usersList = {};
const chatHistory = [];
const systemName = 'Console';
const colors = ['black', 'silver', 'gray', 'white', 'maroon', 'red', 'purple', 'fuchsia', 'green', 
'lime', 'olive', 'yellow', 'navy', 'blue', 'teal', 'aqua', 'orange', 'aliceblue', 'antiquewhite', 
'aquamarine', 'azure', 'beige', 'bisque', 'blanchedalmond', 'blueviolet', 'brown', 'burlywood', 
'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 
'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki', 
'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon', 
'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise', 
'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue', 'firebrick', 
'floralwhite', 'forestgreen', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod', 'greenyellow', 
'grey', 'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender', 'lavenderblush', 
'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 
'lightgray', 'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue', 
'lightslategray', 'lightslategrey', 'lightsteelblue', 'lightyellow', 'limegreen', 'linen', 'magenta', 
'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue', 
'mediumspringgreen', 'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose', 
'moccasin', 'navajowhite', 'oldlace', 'olivedrab', 'orangered', 'orchid', 'palegoldenrod', 'palegreen', 
'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 
'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna', 
'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen', 'steelblue', 'tan', 'thistle', 
'tomato', 'turquoise', 'violet', 'wheat', 'whitesmoke', 'yellowgreen'];

io.on('connection', function(socket) {
  log('New user connected');

  // initUser
  socket.on('initUser', function (usernameCookie, colorCookie) {
    var id = '';
    var username = '';
    var color = '';
    if (usernameCookie && colorCookie) {
      // returning user
      if(usersList[usernameCookie]) {
        // if name was taken
        username = getUsername();
        color = getColor();
        logAndNotify(usernameCookie + "'s name was taken.\nNew name is: " + username,
        socket);
      } else {
        username = usernameCookie;
        color = colorCookie;
      }
    } else {
      // new user
      username = getUsername();
      color = getColor();
      logAndNotify('New user created: ' + username, socket);
    }

    // inform client
    var user = {
      username: username,
      color: color,
    };
    socket.emit('initUser', user);
    showHistory(socket);
    log(username + ' connected');
    
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
    log(msg.username + ' sent: ' + msg.message);
    var msgObj =  {
      time: getTime(),
      username: msg.username,
      color: msg.color,
      message: msg.message,
    };
    // Emit message to all users
    io.emit('clientMessage', msgObj);
    saveMessage(msgObj);
  });

  // help request
  socket.on('help', function() {
    log(socket.username + ' asked for help');
    var helpMsg = {
      time: getTime(),
      username: 'Helper!', 
      color: 'Indigo',
      message: 'Type /nick newName to change your username. \
      Type /nickcolor #hexcode or /nickcolor colorName to change your color.',
    };
    // Emit help to requesting user only
    socket.emit('clientMessage', helpMsg);
  });

  // change username
  socket.on('changeNick', function (msg) {
    var newName = msg.message.slice(6).trim();
    log(msg.username + ' asked to rename to: ' + newName);
    if(newName == '') {
      logAndNotify('Error: username can\'t be empty.', socket);
    } else if(usersList[newName]) {
      logAndNotify('Error: username taken.', socket);
    } else if(newName.length > 16) {
      logAndNotify('Error: username can\'t exceed 16 chars.', socket);
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
      logAndNotify(msg.username + ' renamed to ' + socket.username, io);
    }
  });

  // change color
  socket.on('changeColor', function (msg) {
    var newColor = msg.message.slice(10).trim();
    log(msg.username + ' asked to recolor to: ' + newColor);
    var validColor  = isValidColor(newColor);
    if(newColor == '') {
      logAndNotify('Error: color can\'t be empty.', socket);
    } else if(!validColor) {
      logAndNotify('Error: invalid color.', socket);
    } else if (validColor) {
      if (!newColor.startsWith('#') && !colors.includes(newColor)) {
        newColor = '#' + newColor;
      }
      socket.color = newColor;
      // inform client
      var user = {
        username: socket.username,
        color: socket.color,
      };
      socket.emit('initUser', user);
      logAndNotify(msg.username + ' changed their color to: ' + socket.color, io);
    }
  });

  // disconnect
  socket.on('disconnect', function () {
    logAndNotify(socket.username + ' disconnected', io);
    delete usersList[socket.username];
    io.emit('onlineUsers', socket.conn.server.clientsCount)
    io.emit('usersList', usersList);
  });
})

// return current time
function getTime() {
  return new Date().toLocaleTimeString();
}

// return random id
function getUuid() {
  var temp = uuid();
  while (usersList[temp]) {
    temp = uuid();
  }
  return temp;
}

// return random username
function getUsername() {
  var temp = 'user' + Math.floor((Math.random() * 1000) + 1);
  while (usersList[temp]) {
    temp = 'user' + Math.floor((Math.random() * 1000) + 1);
  }
  return temp;
}

// return true if color is valid
function isValidColor(newColor) {
  var valid = false;
  if (newColor.startsWith('#')) {
    valid = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(newColor);
  } else {
    valid = colors.includes(newColor) || /([0-9A-F]{6}$)|([0-9A-F]{3}$)/i.test(newColor);
  }
  return valid;
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
function saveMessage(msg) {
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

// Log msg and notify user with msg
function logAndNotify(msg, sock) {
  sendSysMsg(msg, sock);
  console.log(msg);
}

// Log msg
function log(msg) {
  console.log(msg);
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
  log('sysMsg: ' + msg);
}