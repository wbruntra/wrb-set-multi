function sendMessage(action,actor,cards) {
    if (cards) {
        cards = cards.join();
    }
    var state = JSON.stringify(describeState());
    $.ajax({
        url: '/broadcast',
        type: 'POST',
        data: {
            g:game_key,
            action:action,
            state:state,
            cards:cards,
            actor:actor
        },
        success: function(data){
        },
        complete:function(){
        }
    });
}

onOpened = function() {
  connected = true;
//    sendMessage('/opened');
  };

onMessage = function(m) {
  console.log(m.data);
  var message = JSON.parse(m.data);
  var sender = message.nickname;
  if (message.action == 'joined') {
    sendChat(sender,'','enter');
    if (players.indexOf(sender) == -1) {
      addPlayer(message.nickname);
      pregameShowPlayers(players);
      makeScoreboard(players);
    }
    if (gameStarted) {
      state = describeState();
      sendMessage('start');
    }
  } else if (message.action == 'exit') {
    if (!gameStarted) {
      players = removeValue(players,sender)
    }
    sendChat(sender,'','exit');
    pregameShowPlayers(players);
  } else if (message.action == 'declaring') {
    if (declared== false && gamePaused==false && disabled != sender) {
        console.log('Making active '+sender);
        activePlayer = sender;
        declareSet();
        sendMessage('declared',sender);
        gamePaused = true;
    } else {
      console.log('Declare ignored');
    }
  } else if (message.action == 'found') {
    if (activePlayer == sender) {
        activePlayer = '';
        var cards = message.cards
        scores[sender] += 1;
        sendMessage('admire',sender,cards);
        admireSet(cards,sender);
    }else {
      console.log('Find ignored');}
  } else if (message.action == 'chat') {
    addChatMessage(message);
  }
  updateScores(scores);
  updateBoardHtml(board);
}
