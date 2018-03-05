$(function() {
  var socket = io();
  new Vue({
    el: $("#app"),
    data:{
      messageText:''
    },
    methods:{
      sendMessage: function () {
        socket.emit('newMessage', this.messageText);
      }
    }
  });
});
