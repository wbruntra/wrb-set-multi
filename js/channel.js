openChannel = function() {
  var channel = new goog.appengine.Channel(token);
  var handler = {
    'onopen': onOpened,
    'onmessage': onMessage,
    'onerror': function() {},
    'onclose': function() {}
  };
  var socket = channel.open(handler);
  socket.onopen = onOpened;
  socket.onmessage = onMessage;
}

initialize = function() {
  openChannel();
}      

setTimeout(initialize, 100);

$(window).unload(function() {
/*  if (isHost) {
    sendMessage('hostleft');
  } else {
    sendMessage('exit');
  }*/
});