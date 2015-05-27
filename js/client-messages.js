function sendMessage(action,cards) {
    console.log(cards);
    var actor = myName;
    if (cards) {
        cards = cards.join();
    }
    console.log(action + actor);
    $.ajax({
        url: '/move',
        type: 'POST',
        data: {
            g:game_key,
            actor:myName,
            action:action,
            cards:cards,
        },
        success: function(data){
        },
        complete:function(){
        }
    });
}

onOpened = function() {
    sendMessage('joined');
  };

onMessage = function(m) {
  console.log(m.data);
  message = JSON.parse(m.data);
  var action = message.action;
  var state = message.state;
  var actor = message.actor;
  var scores = message.scores;
  if (action == 'start') {
      processInitial(message)
  }
  if (action == 'update') {
      $('#declaration').hide();
      $('#pregame').hide();
      $('#middle').show();
      processUpdate(message);
  }
  else if (message.action == 'declared') {
      declareSet();
      $('#declaration').text(actor+' called SET!');
      activePlayer = actor;
  }
  else if (action == 'admire') {
      cards = message.cards;
      admireSet(cards,actor);
  }
  else if (action == 'end') {
      winner = message.actor;
      moveOn();
      gameOver();
  }
  else if (action == 'restart') {
      admireSet([],"Restarting Game!");
      setTimeout(function() {
          location.reload();
      },3500);
  }
  else if (message.action == 'chat') {
      $p = $('<p>');
      $p.html('<span class="chatter-name">'+message.sender+'</span>: '+message.chat);
      $('#chat-box').append($p);
      $('#chat-box').animate({scrollTop:$('#chat-box').prop("scrollHeight")},400);
  }
}