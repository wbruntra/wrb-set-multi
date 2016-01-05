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
/*    reporter = setInterval(function() {
      sendMessage('joined');
    },10000);*/
  };

onMessage = function(m) {
  console.log(m.data);
  message = JSON.parse(m.data);
  var action = message.action;
  var state = message.state;
  var actor = message.actor;
  var scores = message.scores;
  if (action == 'start') {
      processInitial(message);
/*      clearInterval(reporter);*/
  }
  if (action == 'update') {
/*      $('#declaration').hide();
      $('#pregame').hide();
      $('#middle').show();*/
      moveOn();
      processUpdate(message);
      if (!gameStarted) {
        pregameShowPlayers(players);
      }
  }
  else if (message.action == 'declared') {
      declareSet();
      $('#declaration').text(actor+' called SET!');
      activePlayer = actor;
  }
  else if (message.action == 'updateSelection') {
      var actor = message.actor;
      if (actor != myName && activePlayer == actor) {
        cards = message.cards;
        highlightCells(cards);
      }
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
      addChatMessage(message);
  }
  else if (message.action == 'hostleft') {
      $overlay.text('Host has left!');
      $overlay.show();
  }
}