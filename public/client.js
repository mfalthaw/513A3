var socket = io();
  socket.emit('initUser', getCookie('username'), getCookie('color'));

  new Vue({
    el: "#app",
    data: {
      username: '',
      color: '',
      messageText: '',
      messages: [],
      users: {},
      onlineUserCount: '',
    },
    mounted: function () {
      socket.on('initUser', function(data) {
        this.username = data.username;
        this.color = data.color;
        setCookie('username', data.username, 1);
        setCookie('color', data.color, 1);
      }.bind(this));

      socket.on('clientMessage', function(data) {
        this.messages.push(data);
      }.bind(this));
      
      socket.on('sysMessage', function(data) {
        this.messages.push(data);
      }.bind(this));

      socket.on('usersList', function(usersList) {
        this.users = usersList;
      }.bind(this));

      socket.on('onlineUsers', function(onlineUserCount) {
        this.onlineUserCount = onlineUserCount;
      }.bind(this));
    },
    methods: {
      sendMessage: function () {
        var msg = {
          username: this.username, 
          color: this.color,
          message: this.messageText,
        };
        parseMessage(msg, socket);
        this.messageText = "";
      },
    }
  });
  Vue.config.devtools = true;

  // set cookie
  // Source: https://www.w3schools.com/js/js_cookies.asp
  function setCookie(param, value, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = param + "=" + value + ";" + expires + ";path=/";
  }

  // get cookie
  // Source: https://www.w3schools.com/js/js_cookies.asp
  function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
  }

  // parse message
  function parseMessage(msg, socket) {
    cmd = msg.message.toLowerCase();
    if(cmd.startsWith('/nick ')) {
      socket.emit('changeNick', msg);
    } else if(cmd.startsWith('/nickcolor ')) {
      socket.emit('changeColor', msg);
    } else {
      socket.emit('newMessage', msg);
    }
  }