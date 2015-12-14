isIOS = ((/iphone|ipad/gi).test(navigator.appVersion));
myDown = isIOS ? "touchstart" : "mousedown";
myUp = isIOS ? "touchend" : "mouseup";

body = document.body;
$submitButton = $("#submit");
$setButton = $('#declare-set');
$board = $("#board");
board = [];

gamePaused = false;
declared = false;
gameover = false;
computerEnabled = false;

$startButton = $('#start-button');

if (isHost) {
  hostName = myName;
}

activePlayer = 'none';
gameStarted = false;

function updateInfo() {
  $('#remaining').text('Cards remaining: '+state.remain);
  $('#sets-on-board').text("Sets on board: "+countSets(board));
  return;
}

function getIndex(needle, haystack) {      
    return haystack.join('-').split('-').indexOf( needle.join() );          
} 

function removeValue(array,value) {
    index = array.indexOf(value);
    if (index != -1) {
      array.splice(index,1);
    }
    return array;
}

function nameThird(cards) {
  var features;
  var missing;
  var result = "";
  for (var i=0;i<4;i++) {
    if (cards[0][i] == cards[1][i]) {
      result = result + cards[0][i]
    } else {
      features = parseInt(cards[0][i])+parseInt(cards[1][i])
      missing = (3 - features).toString();
      result = result + missing;
    }
  }
  return result.trim();
}

function countSets(board) {
  results = [];
  for (var i=0;i<(board.length-2);i++){
    for (var j=i+1;j<(board.length-1);j++) {
      var pair = [board[i],board[j]];
      if (pair.indexOf('aaaa') == -1) {
      third = nameThird([board[i],board[j]]);
      var k = board.indexOf(third)
      if (k != -1) {
        newSet = [i,j,k];
        newSet.sort();
        if (getIndex(newSet,results) == -1) {
          results.push(newSet);
        }
      }
      }
    }
  }
  return results.length;
}

function deckContainsSet(deck) {
  for (var i=0;i<(deck.length-2);i++){
    for (var j=i+1;j<(deck.length-1);j++) {
      var pair = [board[i],board[j]];
      if (pair.indexOf('aaaa') == -1) {
      var third = nameThird([deck[i],deck[j]]);
      var k = deck.indexOf(third)
      if (k != -1) {
        return true;
      }
      }
    }
  }
  return false;
}


function fill_td(td, cardName) {
  var numReference = ["one","two","three"];
  var fillReference = ["empty","striped","solid"]
  var colorReference = ["red", "green", "purple"];
  var $cell = $(td);
  var $box = $('<div class="box"></div>');
  var $a = $('<a class="stretchy no-limit" href="#"></a>');
  var $spacer = $('<img class="spacer" src="/img/spacer.png" alt="spacer">');
  var $cardImg = $('<img class="sprite" id="c'+cardName+'" alt="card">');
  var cardShape = cardName[3];
  var cardColor = cardName[2];
  var cardNumber = numReference[parseInt(cardName[0])];
  var cardFill = fillReference[parseInt(cardName[1])];
  $cardImg.addClass(cardNumber);
  $cardImg.addClass(cardFill);
  $cardImg.attr('src','/img/'+cardColor+cardShape+'.png');
  $a.append($spacer);
  $a.append($cardImg);
  $box.append($a);
  $cell.empty().append($box);
}

function describeState() {
    var state = {};
    state.board = board;
    state.players = players;
    state.scores = scores;
    state.remain = deck.length;
    return state;
}

var $overlay = $('<div id="overlay"></div>');
$("body").append($overlay);
$overlay.hide();

$submitButton.hide();

function createTable() {
  var columns = ['A','B','C','D'];
  var rows = ['1','2','3'];
  var $spacer = $('<img class="spacer" src="/img/spacer.png" alt="spacer">');
  var $table = $('<table>');
  for (var i = 0;i<rows.length;i++) {
    var $newRow = $('<tr>');
    for (var j=0;j<columns.length;j++) {
      var $newCell = $('<td id="'+columns[j]+rows[i]+'"></td>')
      $newRow.append($newCell);
    }
    $table.append($newRow);
  }
  $board.append($table);
}

$('#middle').hide();
createTable();

function declareSet() {
  console.log('set declared');
  $('#reminder').hide();
  $('#board').addClass('active');
  $('#declaration').text(activePlayer +' called SET!');
  declared = true;
  $setButton.hide();
  window.secondsLeft = 5;
  setCountdown();
  window.timerId = setInterval(countTimer,1000);
}

function setCountdown() {
  secondsLeft = window.secondsLeft;
  var $counter =  $('#countdown');
  var $counter = $('#countdown');
  var $declaration = $('#declaration');
  $('#declaration').show();
  $declaration.addClass('running');
  $counter.text(secondsLeft);
  $counter.addClass('running');
}

function countTimer() {
  secondsLeft = window.secondsLeft;
  secondsLeft = secondsLeft - 1;
  var $counter = $('#countdown');
  $counter.text(secondsLeft);
  if (secondsLeft == 0) {
    if (isHost) {
      disablePlayer(activePlayer);
    }
    gamePaused = false;
    updateInfo();
    failedFind();
  }
}

function failedFind() {
  console.log("Declaration over!");
  $('#board').removeClass('active');
  $('#reminder').show();
  $('#declaration').hide();
  declared= false;
//  $setButton.show();
  $submitButton.hide();
  $('#countdown').removeClass('running');
  clearInterval(window.timerId);
  $('td.on').removeClass('on');
  $setButton.hide();
  $submitButton.hide();
}

function makeScoreboard(players) {
  $('#all-scores').html('');
  for (var i=0;i<players.length;i++) {
    var $p = $('<p id="player-'+i+'-score">'+players[i]+': 0</p>');
    $('#all-scores').append($p);
  }
}

function updateScores() {
  for (var i=0;i<players.length;i++) {
    $('#player-'+i+'-score').text(players[i]+': '+scores[players[i]]);
  }
}

function updateBoardHtml(board) {
  var columns = ['A','B','C','D'];
  var rows = ['1','2','3'];
  var cellNum = 0;
  for (var i = 0;i<rows.length;i++) {
    for (var j=0;j<columns.length;j++) {
      cellNum += 1;
      var cellName = '#'+columns[j]+rows[i];
      if (cellNum <= board.length) {
        fill_td(cellName,board[cellNum-1]);
      }
    }
  }
}

//Allow user to click box for selection

$("td").on(myDown,function(event) {
  if (declared == true && activePlayer == myName) {
    if ($(this).hasClass('on')) {
      $(this).removeClass('on');
    } else {
      if ($('td.on').length <3) {
        $(this).addClass('on');
      }
    }
    if ($('td.on').length == 3) {
      $submitButton.addClass('ready');
      setTimeout(delayedSubmit,400);
    }
  }
});

//Allow board touch to declare SET

$("#board").on(myDown, function(event) {
  if (declared == false) {
    event.stopPropagation();
    declarePress();
  }
});

function declarePress() {
  if (declared== false && gamePaused==false) {
    $('#reminder').hide();
    $setButton.trigger(myDown);
  }
}

function delayedSubmit() {
  if ($('td.on').length == 3 && !gamePaused) {
    $submitButton.trigger(myDown);
  }
}

function getSelectedBoxes() {
  var boxes = $('td.on');
  var cells = [];
  boxes.each(function(index) {
    cells.push($(this).attr('id'));
  })
  return cells;
}

function getCards(cells) {
  results = []
  for (var i=0;i<cells.length;i++) {
    var $cell = $('#'+cells[i]);
    var id = $cell.find('img.sprite').attr('id').slice(1,5);
    results.push(id);
  }
  return results;
}

function testSet(cards) {
  if (cards.indexOf('aaaa') != -1) {
    return false;
  } else {
  for (var i=0;i<4;i++) {
    var to_test = parseInt(cards[0][i])+parseInt(cards[1][i])+parseInt(cards[2][i]);
    if (to_test % 3 != 0) {
    return false;
    }
  }
  return true;
}
}

//Timer and such

var $timer = $('#timer');
var seconds = 0;
$timer.text('Time: 0:00');


function countUp() {
  if (gamePaused == false) {
    seconds = seconds+1;
    var mins = Math.floor(seconds/60);
    if (seconds % 60 < 10) {
      var rest = '0'+seconds % 60;
    } else {
      rest = seconds % 60;
    };
    $timer.text('Time: '+mins+":"+rest);
  }
}

function sendChat(chatter,chat,event) {
  $.ajax({
    url: '/chat',
    type: 'POST',
    data: {
      g:game_key,
      chatter:chatter,
      chat:chat,
      event:event
    }
  });
}

/*$('#colTwo').hide();*/
$setButton.hide();

function createRecord(finder) {
  var $div = $('<div>');
  var $p = $('<p>');
  var $span = $('<span>');
  $span.addClass('finder-name');
  $span.text(finder);
  $p.append($span);
  var s = '';
  $('.on').each(function() {
    s += $(this).html();
  });
  $div.html($p.html()+s);
  $('#chat-box').append($div);
  $('#chat-box').animate({scrollTop:$('#chat-box').prop("scrollHeight")},400);
}

function clearKeys() {
  $('body').unbind("keyup");
}

$('#my-msg').focusin(function() {
  console.log("keys cleared");
  clearKeys();
});

$('#my-msg').blur(function() {
  enableKeys();
});

$('#chat-msg').on("submit",function (e) {
  var chatter = myName;
  var chat = $('#my-msg').val();
  sendChat(chatter,chat);
  $('#my-msg').val('');
});

//called only by client

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
  if (!gameStarted) {
    $startButton.trigger(myDown);    
  }
}

function processUpdate(msg) {
  state = msg.state;
  board = state.board;
  scores = state.scores;
  remain = state.remain;
  players = state.players;
  updateScores(scores);
  updateBoardHtml(board);
  updateInfo();
}

function attemptDeclare() {
  console.log('Declaring!');
  sendMessage('declaring');
}

//common functions



//probably only for host

function saveState() {
    var state = {};
    state.board = board;
    state.deck = deck;
    state.players = players;
    state.scores = scores;
    return state;
}

function loadState(savedState) {
  board = savedState.board;
  deck = savedState.deck;
  players = savedState.players;
  scores = savedState.scores;
}

function describeState() {
    var state = {};
    state.board = board;
    state.players = players;
    state.scores = scores;
    state.remain = board.length+deck.length;
    return state;
}

$startButton.on(myDown,function(e) {
  console.log("Game started!");
  makeScoreboard(players);
  $('#declaration').hide();
  $('#pregame').hide();
  $('#middle').show();
  gameStarted = true;
  if (isHost) {
    state = describeState();
    sendMessage('start');
  }
  updateInfo();
  gameTime = setInterval(countUp,1000);
});

//generic and useful functions

function tieScore(scores) {
  var result = []
  for (var player in scores) {
    result.push(scores[player]);
  }
  result = result.sort(function(a, b){return b-a});
  return (result[0] == result[1]);
}

function maxScore(scores) {
  var winner = ['',0];
  var players = Object.keys(scores);
  for (var i =0;i<players.length;i++) {
    if (scores[players[i]] > winner[1]) {
      winner = [players[i],scores[players[i]]];
    }
  }
  return winner;
}

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
  if (!isHost) {
    attemptDeclare();
  } else {
    if (declared== false && gamePaused==false  && disabled != hostName) {
      console.log('Making active '+hostName);
      activePlayer = hostName;
      declareSet();
      sendMessage('declared',hostName);
    }
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
  if (isHost) {
    if (testSet(cards)) {
        scores[hostName] += 1;
        admireSet(cards,myName);
        sendMessage('admire',myName,cards);
      updateScores(scores);
    } else {
      $("td").removeClass('on');
    }
  } 
  else {
    if (testSet(cards) && activePlayer == myName) {
    console.log(cards);
    sendMessage('found',cards);
    } else {
      $("td").removeClass('on');
  }  
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
  $board.addClass('highlighted');
  createRecord(sender);
  if (sender == "Restarting Game!") {
    $overlay.append($('<h1>'+sender+'</h1>'));
  } else {
    $overlay.append($('<h1>'+sender+' found a SET!</h1>'));
  }
  $overlay.show();
  if (isHost) {
    setTimeout(function() {$overlay.hide();},1500)
    state = describeState();
    setTimeout(moveOn,3000);
    disabled = "";
  } 
  else {
    setTimeout(function() {$overlay.hide()},2000);
    /*setTimeout(moveOn,3500);*/
  }
}

function moveOn() {
  if (gameover == false) {
    if (isHost) {
      var cells = getSelectedBoxes();
      var cards = getCards(cells);
      updateBoard(cards);
      $board.removeClass('highlighted');
      $("td").removeClass('on');
      $overlay.html('');
      $overlay.hide();
      confirmSetPresenceOrEnd();
      gamePaused = false;
      declared = false;
      state = describeState();
      updateInfo();
      sendMessage('update');
    } else {
      $('#reminder').show();
      $board.removeClass('highlighted');
      $("td").removeClass('on');
      $('#overlay').html('');
      $overlay.hide();
      activePlayer = '';
      gamePaused = false;
    }
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

function deckContainsSet(deck) {
  for (var i=0;i<(deck.length-2);i++){
    for (var j=i+1;j<(deck.length-1);j++) {
      var pair = [board[i],board[j]];
      if (pair.indexOf('aaaa') == -1) {
      var third = nameThird([deck[i],deck[j]]);
      var k = deck.indexOf(third)
      if (k != -1) {
        return true;
      }
      }
    }
  }
  return false;
}

function gameOver () {
  if (isHost) {
    winner = maxScore(scores)[0];
    winText = !tieScore(scores) ? winner+' wins!': 'Tie game!';
    sendMessage('end',winner);
    $('#reshuffle').hide();
    $('#replay').show();
  }
  $overlay.show()
  var $h1 = $('<h1>');
  $h1.text(winner+' wins!');
  $overlay.append($h1);
  clearInterval(gameTime);
  gameover = true;
  gamePaused = true;
}

$('#replay').show();
$('#replay').click(function (e) {
  if (gameover || confirm('Are you sure you want to restart?')) {
      sendMessage('restart');
      location.reload();
    }
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

$('#reshuffle').on(myDown,function(e){
  if (declared == false && gamePaused == false) {
    populateBoard();
    updateInfo();
    sendMessage('update');
  }
});

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
    else if (e.which == 82 && !declared && !gamePaused && isHost) {
      $('#reshuffle').trigger(myDown);
    }
  });
}

function addChatMessage(message) {
  $p = $('<p>');
  if (message.event == "enter") {
    $p.addClass('room-event');
    $p.text(message.sender+' has joined.');
  } else if (message.event == "exit") {
    if (players.indexOf(message.sender) != -1) {
      $p.addClass('room-event');
      $p.text(message.sender+' has left.');
    } 
  } else {
    $p.html('<span class="chatter-name">'+message.sender+'</span>: '+message.chat);
  }
  if ($p.text()) {
    $('#chat-box').append($p);
    $('#chat-box').animate({scrollTop:$('#chat-box').prop("scrollHeight")},400);
  }
}

function pregameShowPlayers(players) {
  $('#pregame-players').html('');
  for (var i=0;i<players.length;i++) {
    var $li = $('<li>');
    $li.text(players[i]);
    $('#pregame-players').append($li);
  }
}

//what happens

$overlay.click(function (e) {
  if (gameover == true) {
    $overlay.hide();
  }
})

if (isHost) {
  $startButton = $('#start-button');
  disabled = "";
  players = [myName];
  scores = {};
  scores[hostName] = 0;
  layoutGame();
  state = describeState();
  disableCounter = 0;
  setInterval(disableTimer,1000);
  pregameShowPlayers(players);
}
enableKeys();