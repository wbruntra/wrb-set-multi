$startButton = $('#start-button');
players = [myName];

function describeState() {
    var state = {};
    state.board = board;
    state.players = players;
    state.scores = scores;
    state.remain = deck.length;
    return state;
}

function updateInfo() {
  $('#remaining').text('Cards remaining: '+state.remain);
  $('#sets-on-board').text("Sets on board: "+countSets(board));
  return;
}

$startButton.on(myDown,function(e) {
  console.log("Game started!");
  makeScoreboard(players);
  $('#declaration').hide();
  $('#pregame').hide();
  $('#middle').show();
  $('#colTwo').show();
  updateInfo();
  sendMessage('start');
  gameTime = setInterval(countUp,1000);
  state = describeState();
});

//generic and useful functions

function getIndex(needle, haystack) {      
    return haystack.join('-').split('-').indexOf( needle.join() );          
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


//host-specific functions

function deckBuilder() {
  opts = ['0','1','2'];
  deck = [];
  for (var a=0;a<3;a++) {
    for (var b=0;b<3;b++) {
      for (var c=0;c<3;c++) {
        for (var d=0;d<3;d++) {
          deck.push(opts[a]+opts[b]+opts[c]+opts[d]);
        }
      }
    }
  }
  return deck;
}

function layoutGame () {
  deck = deckBuilder();
  populateBoard();
  confirmSetPresenceOrEnd();
}

function populateBoard() {
  var columns = ['A','B','C','D'];
  var rows = ['1','2','3'];
  deck = deck.concat(board);
  deck = shuffle(deck);
  board = [];
  var newCard;
  for (var i = 0;i<rows.length;i++) {
    for (var j=0;j<columns.length;j++) {
      var cellName = '#'+columns[j]+rows[i];
      newCard = deck.pop();
      board.push(newCard);
      fill_td(cellName,newCard);
    }
  }
}

function updateBoard(cards) {
  if (deck.length >= 3) {
    newCards = []
    for (var i=0;i<3;i++) {
      newCards.push(deck.pop());
    }
  } else {
    newCards = ['aaaa','aaaa','aaaa']
  }
  var cells = [];
  for (var i=0;i < 3;i++) {
    var oldCard = cards[i];
    var index = board.indexOf(oldCard);
    board[index] = newCards[i];
    var $cell = $('#c'+oldCard).parents('td');
    cells.push($cell.attr('id'));
    $('#c'+oldCard).remove();
  }
  updateBoardHtml(board);
}


$setButton.on(myDown,function (e) {
  e.stopPropagation();
  e.preventDefault();
  if (declared== false && gamePaused==false  && disabled != hostName) {
    console.log('Making active '+hostName);
    activePlayer = hostName;
    declareSet();
    sendMessage('declared',hostName);
  }
});

function addPlayer(nickname) {
  if (players.indexOf(nickname) == -1) {
    players.push(nickname);
    scores[nickname] = 0;
  }
}

$submitButton.on(myDown,function (event) {
  console.log("submit button pressed!");
  event.preventDefault();
  $submitButton.removeClass('ready');
  var cells = getSelectedBoxes();
  var cards = getCards(cells);
  if (testSet(cards)) {
      scores[hostName] += 1;
      admireSet(cards,myName);
      sendMessage('admire',myName,cards);
    updateScores(scores);
  } else {
    $("td").removeClass('on');
  }
})

function admireSet(cards,sender) {
  console.log(cards);
  gamePaused = true;
  failedFind();
  $('td').removeClass('on');
  for (var i=0;i<cards.length;i++) {
    var $cell = $('#c'+cards[i]).parents('td');
    $cell.addClass('on');
  }
  createRecord(sender);
  $board.addClass('highlighted');
  $overlay.append($('<h1>'+sender+' found a SET!</h1>'));
  $overlay.show();
  setTimeout(function() {$overlay.hide();},1500)
  state = describeState();
  setTimeout(moveOn,4000);
  disabled = "";
}

function moveOn() {
  if (gameover == false) {
    var cells = getSelectedBoxes();
    var cards = getCards(cells);
    updateBoard(cards);
    $board.removeClass('highlighted');
    $("td").removeClass('on');
    $overlay.html('');
    $overlay.hide();
    confirmSetPresenceOrEnd();
    updateInfo();
    gamePaused = false;
    declared = false;
    state = describeState();
    sendMessage('update');
  } 
}

function confirmSetPresenceOrEnd() {
  while (countSets(board) == 0) {
    if (board.concat(deck).length >= 21 || deckContainsSet(board.concat(deck))) {
      console.log('There is still a set! Retrying...');
      populateBoard();
    } else {
        gameOver();
        return 0;
    } 
  }
}

function gameOver () {
  $overlay.show()
  var $h1 = $('<h1>');
  winner = maxScore(scores);
  winText = !tieScore(scores) ? winner[0]+' wins!': 'Tie game!';
  $h1.text(winner[0]+' wins!');
  $overlay.append($h1);
  clearInterval(gameTime);
  gameover = true;
  gamePaused = true;
  sendMessage('end',winner[0]);
  $('#replay').show();
}

$('#replay').hide();
$('#replay').click(function (e) {
  sendMessage('restart');
  location.reload();
});

function disablePlayer(player) {
  disabled = player;
  disableCounter = 10;
}

function disableTimer() {
  disableCounter += -1;
  if (disableCounter == 0) {
    disabled = "";
  }
}

function enableKeys() {
  $("body").keyup(function(e) {
    if (e.which == 83) {
      declarePress();
    }
    else if (e.which == 13 && declared) {
      $submitButton.trigger(myDown);
    }
    else if (e.which == 71 && declared) {
      $submitButton.trigger(myDown);
    }
    else if (e.which == 82 && declared == false && gamePaused == false) {
      populateBoard();
      updateInfo();
      sendMessage('update');
    }
  });
}

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
            actor:actor,
            running:running
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
    addPlayer(message.nickname);
    $("#pregame-players").append('<li>'+message.nickname+'</li>');
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
      $p = $('<p>');
      $p.html('<span class="chatter-name">'+message.sender+'</span>: '+message.chat);
      $('#colTwo').append($p);
  }
  updateScores(scores);
  updateBoardHtml(board);
}

//what happens

scores = {};
scores[hostName] = 0;
layoutGame();
state = describeState();
disabled = "";
disableCounter = 0;
setInterval(disableTimer,1000);
enableKeys();