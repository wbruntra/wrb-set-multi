//client-specific functions

function processInitial(msg) {
  console.log(msg);
  state = msg.state;
  players = state['players'];
  board = state['board'];
  remain = state['remain'];
  scores = state['scores'];
  makeScoreboard(players);
  updateBoardHtml(board);
  updateInfo();
  $startButton.trigger(myDown);    
}

function processUpdate(msg) {
  state = msg.state;
  board = state['board'];
  scores = state['scores'];
  remain = state['remain'];
  updateScores(scores);
  updateBoardHtml(board);
  updateInfo();
}

$startButton.on(myDown,function(e) {
  console.log("Game started!");
  $('#declaration').hide();
  $('#pregame').hide();
  $('#middle').show();
  $('#colTwo').show();
  gamePaused = false;
  updateInfo();
  gameTime = setInterval(countUp,1000);
});

$submitButton.on(myDown,function (event) {
  console.log("submit button pressed!");
  event.preventDefault();
  $submitButton.removeClass('ready');
  var cells = getSelectedBoxes();
  var cards = getCards(cells);
  if (testSet(cards) && activePlayer == myName) {
      console.log(cards);
      sendMessage('found',cards);
  } else {
    $("td").removeClass('on');
  }
})

$setButton.on(myDown,function (e) {
  e.stopPropagation();
  e.preventDefault();
  attemptDeclare();
});

function attemptDeclare() {
  console.log('Declaring!');
  sendMessage('declaring');
}

function admireSet(cards,sender) {
  gamePaused = true;
  failedFind();
  $('td').removeClass('on');
  for (var i=0;i<cards.length;i++) {
    var $cell = $('#c'+cards[i]).parents('td');
    $cell.addClass('on');
  }
  $board.addClass('highlighted');
  createRecord(sender);
  $overlay.append($('<h1>'+sender+' found a SET!</h1>'));
  $overlay.show();
  setTimeout(function() {$overlay.hide()},2000);
  setTimeout(moveOn,4500);
}

function moveOn() {
  if (gameover == false) {
    $('#reminder').show();
    $board.removeClass('highlighted');
    $("td").removeClass('on');
    $('#overlay').html('');
    $overlay.hide();
    activePlayer = '';
    gamePaused = false;
  }
}

function gameOver () {
  $overlay.show()
  var $h1 = $('<h1>');
  $h1.text(winner+' wins!');
  $overlay.append($h1);
  clearInterval(gameTime);
  gameover = true;
  gamePaused = true;
}

function enableKeys() {
  $("body").keydown(function(e) {
    if (e.which == 83) {
      declarePress();
    }
    if (e.which == 13 && declared) {
      $submitButton.trigger(myDown);
    }
    if (e.which == 71 && declared) {
      $submitButton.trigger(myDown);
    }
    if (e.which == 82 && declared == false && gamePaused == false) {
      populateBoard();
      displayInfo();
    }
  });
}

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
      $('#colTwo').append($p);
  }
}