/*TODO: 

think about: alert user when there is no set on board before reshuffle
bug: game does not allow player to press set very early (before computer starts guessing)
only ask for Name once, then make it the default for score entry [DONE]
only ask for Name if score will make the "High Scores" page [DONE]

cover case where there is no set on board (i.e. add cards) [DONE, reshuffle instead of add]
end game when no cards are left [DONE]
display message at end of game [DONE]
-highlight computer choice instead of pop-up [DONE]
actually allow player to declare SET! [DONE]

*/

var isIOS = ((/iphone|ipad/gi).test(navigator.appVersion));
var myDown = isIOS ? "touchstart" : "mousedown";
var myUp = isIOS ? "touchend" : "mouseup";

var body = document.body;
var $submitButton = $("#submit");
var $board = $("#board");
var deck;
var cards;
var board = [];
var gamePaused = false;

var declared = false;
var guessTime;

var gameover = false;

var playingTo = 9;
//Pregame screen

var computerEnabled = false;

var $startButton = $('#start-button');

if (isHost) {
  hostName = myName;
}

var activePlayer = 'none'
var running = false;

function fill_td(td, cardName) {
//  console.log(td +" ,"+ cardName);
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

$startButton.on(myDown,function(e) {
  console.log("Game started!");
  makeScoreboard(players);
  guessTime = 36000/parseInt($('#difficulty').val());
  guessTime = 8000;
  longGame = ($('#gametype').val() == "1") ? true : false;
  $('#declaration').hide();
  $('#pregame').hide();
  $('#middle').show();
  updateInfo();
  sendMessage('start');
  gameTime = setInterval(countup,1000);
  setTimeout(startComputer,1500);
});


function resetGame() {
  board = [];
  seconds = 0;
  yourScore = 0;
  opponentScore = 0;
}

// Overlay for pausing game after set is found

var $overlay = $('<div id="overlay"></div>');
$("body").append($overlay);
$overlay.hide();

$submitButton.hide();


// 1. Initializing the game

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


function deckbuilder() {
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
  deck = deckbuilder();
  populateBoard();
  confirmSetPresenceOrEnd();
}

layoutGame();

// 1. (used functions)

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

function dealBoard() {
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
      //$cell = $('#'+columns[j]+rows[i]);
      newCard = deck.pop();
      board.push(newCard);
      fill_td(cellName,newCard);
    }
  }
}

scores = {};
scores[hostName] = 0;

players = [hostName];

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

function makeScoreboard(players) {
  for (var i=0;i<players.length;i++) {
    var $p = $('<span id="player-'+i+'-score">'+players[i]+': 0</span>');
    $('#all-scores').append($p);
  }
}

function updateScores() {
  for (var i=0;i<players.length;i++) {
    $('#player-'+i+'-score').text(players[i]+': '+scores[players[i]]);
  }
}

function sumScores() {
  var total = 0;
  for (var i =0;i<players.length;i++) {
    total += scores[players[i]];
  }
  var sets = (81-state.remain)/3;
  console.log(sets);
  return total;
}

function updateGameStatus() {
  console.log('update activated');
  var state = {};
  state['board'] = board;
  state['scores'] = scores;
  state['remain'] = deck.length;
  return state;
}

state = describeState();

function reshuffleDeck() {
  deck = deck.concat(board);
  deck = shuffle(deck);
  return deck;
}

//User interaction with board

//Allow board touch to declare SET

$("#board").on(myDown, function(event) {
  if (declared == false) {
    event.stopPropagation();
    declarePress();
  }
});


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

function delayedSubmit() {
  if ($('td.on').length == 3 && !gamePaused) {
    $submitButton.trigger(myDown);
  }
}

//What happens upon submission
// submit button -> get boxes with class 'on' -> name cards in those boxes  ->
// testif cards form a SET -> SUCCESS or clear boxes

$submitButton.on(myDown,function (event) {
  console.log("submit button pressed!");
  event.preventDefault();
  $submitButton.removeClass('ready');
  var cells = getSelectedBoxes();
  var cards = getCards(cells);
  if (testSet(cards)) {
      scores[hostName] += 1;
      admireSet(cards,myName+" found a set!");
      sendMessage('admire',myName,cards);
    updateScores(scores);
  } else {
    $("td").removeClass('on');
  }
})

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


// After successful find: change score, highlight set, pause game, wait for click
// After click: remove SET from board, add three cards to board, 

//Admire set function

//this function should take a list of CARDS as input, find those cards' associated cells, and
//highlight those cells; overlay is then displayed and game pauses

function showOverlay() {
  $overlay.show();
}

function admireSet(cards,message) {
  console.log(cards);
  gamePaused = true;
  failedFind();
  $('td').removeClass('on');
  for (var i=0;i<cards.length;i++) {
    var $cell = $('#c'+cards[i]).parents('td');
    $cell.addClass('on');
  }
  $board.addClass('highlighted');
  $overlay.append($('<h1>'+message+'</h1>'));
  $overlay.show();
  setTimeout(function() {$overlay.hide();},1500)
  state = describeState();
  setTimeout(moveOn,4000);
  disabled = "";
}

function allowDeclare(actor) {
    sendMessage('declared',actor);
}

//then click overlay to turn it off

//when user clicks off overlay, cards are replaced and game resumes

//Remove selected cards from board
//If deck has at least 3 cards left, replace removed cards

function updateBoard(cards) {
  if (deck.length >= 3) {
    newCards = []
    for (var i=0;i<3;i++) {
      newCards.push(deck.pop());
    }
  } else {
    newCards = ['aaaa','aaaa','aaaa']
  }
//  console.log("Adding "+newCards);
//  console.log("Removing "+cards);
  var cells = [];
  for (var i=0;i < 3;i++) {
    var oldCard = cards[i];
    var index = board.indexOf(oldCard);
    board[index] = newCards[i];
    var $cell = $('#c'+oldCard).parents('td');
    cells.push($cell.attr('id'));
    $('#c'+oldCard).remove();
  }
//      console.log(newCard);
  updateBoardHtml(board);
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


//find out who is playing

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) != -1) return c.substring(name.length,c.length);
    }
    return "";
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
    prematureEnd();
    confirmSetPresenceOrEnd();
    updateInfo();
    gamePaused = false;
    declared = false;
    state = describeState();
    sendMessage('update');
    console.log(sumScores());
  } 
}

$overlay.click(function (e) {
  if (gameover == true) {
    $overlay.hide();
  }
})

//$overlay.click( function(e) {
//  if (gameover == false) {
//    var cells = getSelectedBoxes();
//    var cards = getCards(cells);
//    updateBoard(cards);
//    $board.removeClass('highlighted');
//    $("td").removeClass('on');
//    $overlay.html('');
//    $overlay.hide();
//    prematureEnd();
//    confirmSetPresenceOrEnd();
//    updateInfo();
//    sendMessage('update');
//  } else {
//    var finalScore = calculateScore();
//    console.log('Ending the game!');
//    $overlay.hide();
//    if (calculateScore() > lowScore) {
//      promptName();
//    } else {
//      location.reload();
//    }
//  }
//});

function promptName () {
  var name;
  var $nameDiv = $('<div id="name-prompt"></div>');
  var $nameForm = $('<div>');
  $nameForm.append($('<p>Congratulations! You got a high score!</p>'));
  $nameForm.append($('<p>Enter your name</p>'));
  $nameForm.append($('<input id="player-name" value="'+getCookie('player')+'">'));
  $nameForm.append($('<button id="submit-name">Go!</button>'));
  $nameForm.append($('<button id="no-submit">Cancel</button>'));
  $nameDiv.append($nameForm);
  $("body").append($nameDiv);
  $('#submit-name').click(function(e) {
    var finalScore = calculateScore();
    playerName = $('#player-name').val();
    var $form = $('<form action="/scores" method="post">');
    var $user = $('<input type="text" name="user" value="'+playerName+'">');
    var $score = $('<input type="text" name="score" value="'+finalScore+'">');
    var $scoreSubmit = $('<input id="submit-score" type="submit">');
    $form.append($user);
    $form.append($score);
    $form.append($scoreSubmit);
    $("body").append($form);
    $('form').hide();
    $('#name-prompt').hide();
    console.log('about to click submit button');
    $('#submit-score').click();
  });
  $('#no-submit').click(function(e) {
    location.reload();
  });
}

function calculateScore () {
  var longMultiplier = longGame ? 1 : 2.5;
  var difference = yourScore-opponentScore
  var difficulty = parseInt($('#difficulty').val())
  var finalScore = Math.floor(7*difference*Math.pow(difficulty,2)*longMultiplier);
  finalScore = finalScore < 0 ? 0: finalScore;
  return finalScore;
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

function timetoEnd() {
  if (remain <= 12) {
    gameOver();
  }
}

function prematureEnd() {
  if (longGame == false && (yourScore >=playingTo || opponentScore >=playingTo)) {
    gameOver();
  } else {
    if (computerEnabled) {
        clearInterval(guesser);
        setTimeout(startComputer,500);
    }
  }
}


function tieScore(scores) {
  var result = []
  for (var player in scores) {
    result.push(scores[player]);
  }
  result = result.sort(function(a, b){return b-a});
  return (result[0] == result[1]);
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


//** 
//General game information
//** These functions help display relevant information about the game


var $remain = $('#remaining');
var $yourScore = $('#your-score');
var $opponentScore = $('#opponent-score');
var $onboard = $('#sets-on-board');

var yourScore = 0;
var opponentScore = 0;

function getIndex(needle, haystack) {      
    return haystack.join('-').split('-').indexOf( needle.join() );          
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

function updateInfo() {
  $remain.text('Cards remaining: '+deck.length);
  $yourScore.text("Your Points: "+yourScore);
  $opponentScore.text("Opponent Points: "+opponentScore);
  $onboard.text("Sets on board: "+countSets(board));
  return;
}


// How computer thinks and interacts with board

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

//Computer guess method: choose two cards at random from board
// if third card to make a SET with these two is on board, computer declares SET
// function returns false if no set found, list of cards if set is found

function jrange(board) {
  var a = [];
  for (var i=0;i<12;i++) {
    a.push(i);
  }
  return a;
}

function computerGuess(board) {
  var chosen = shuffle(jrange(board));
  var a = board[chosen[0]]
  var b = board[chosen[1]]
  var c = nameThird([a,b]);
  if (board.indexOf(c) != -1) {
    return [a,b,c];
  }
  return false;
}

$('#add-computer').click(function(e){
   addPlayer('Computer');
   computerEnabled = true;
});

function computerTurn() {
  if (!declared && !gamePaused) {
    console.log("Guess at "+seconds);
    var cards = computerGuess(board);
    if (cards != false) {
      console.log('Computer finds set');
      scores['Computer'] += 1;
      sendMessage('declared','Computer');
      setTimeout(function(){
        sendMessage('admire','computer',cards);
      },1500)
      admireSet(cards, 'Computer finds SET!'); 
    }
  }
}

function startComputer() {
  if (computerEnabled) {
      console.log("Activating computer at "+seconds);
      gamePaused= false;
      guesser = setInterval(computerTurn,4000);
  }
}

$('#reshuffle').on(myDown,function(e){
  if (declared == false && gamePaused == false) {
    populateBoard();
    updateInfo();
    sendMessage('update');
  }
});

//END computer player features



//Add way to declare SET

function declareSet() {
  console.log('set declared');
  $('#board').addClass('active');
  declared = true;
  $('#reminder').hide();
  $('#declaration').text(activePlayer+' called SET!');
  $('#declaration').show();
//  $submitButton.show();
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
  $('#declaration').text(activePlayer+' called SET!');
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
    disablePlayer(activePlayer);
    gamePaused = false;
    updateInfo();
    failedFind();
  }
}

disabled = "";
disableCounter = 0;
setInterval(disableTimer,1000);

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
}

var $setButton = $('#declare-set');
$setButton.hide();

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

$('body').keydown(function(e) {
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
    $('#reshuffle').trigger(myDown);
/*    populateBoard();
    updateInfo();
    sendMessage('update');*/
  }
});

function declarePress() {
  if (declared== false && gamePaused==false) {
    $('#reminder').hide();
    $setButton.trigger(myDown);
  }
}

//Timer and such

var $timer = $('#timer');
var seconds = 0;
$timer.text('Time: 0:00');


function countup() {
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

//channel stuff

function addPlayer(nickname) {
  if (players.indexOf(nickname) == -1) {
    players.push(nickname);
    scores[nickname] = 0;
//    var $p = $('<span id="'+nickname+'-score"></span>');
//    $p.text(nickname+': '+scores[nickname]);
//    $('#all-scores').append($p);
  }
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

//sendMessage = function(path, opt_param) {
//  path += '?g=' + $('#game-key').val();
//  if (opt_param) {
//    path += '&' + opt_param;
//  }
//  var xhr = new XMLHttpRequest();
//  xhr.open('POST', path, true);
//  xhr.send();
//};

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
        admireSet(cards,sender+' found a SET!');
    }else {
      console.log('Find ignored');}
  }
  updateScores(scores);
  updateBoardHtml(board);
}

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

$('#chat-msg').submit(function(){
  var message = $('#my-msg').val();
  
});

function addChat(chatter,message) {
  $newChat = $('p');
  $newChat.html('<span class="chatter-name">'+chatter+'</span>: '+message);
}

board = ["1002", "1001", "1102", "1221", "2100", "0101", "1100", "1212", "0202", "0121", "2221", "2022"];
deck = ["2011", "2200", "0011"];