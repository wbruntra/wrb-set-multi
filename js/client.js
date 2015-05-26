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
var gamePaused = true;

var declared = false;
var guessTime;

var gameover = false;

var playingTo = 9;
//Pregame screen

var $startButton = $('#start-button');

//Multiplayer changes

var computerEnabled = false;

//Client info

var clientName = $('#player-name').val();
var gameKey = $('#game-key').val()

var testMsg = {};
testMsg.data = '{"board":["2002","1221","2211","0210","0200","2011","2200","0011","1201","1110","2010","0110"],"scores":{"p1":5,"p2":16,"p3":2,"p4":0},"remain":69}';

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

function processInitial(msg) {
  console.log(msg);
  var state = msg.state;
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
  var state = msg.state;
  board = state['board'];
  scores = state['scores'];
  remain = state['remain'];
  updateScores(scores);
  updateBoardHtml(board);
  updateInfo();
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

$startButton.on(myDown,function(e) {
  console.log("Game started!");
  guessTime = 36000/parseInt($('#difficulty').val());
  longGame = ($('#gametype').val() == "1") ? true : false;
  $('#declaration').hide();
  $('#pregame').hide();
  $('#middle').show();
  gamePaused = false;
  displayInfo();
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

function populateBoard() {};

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
  if (declared == true && activePlayer == clientName) {
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
  if (testSet(cards) && activePlayer == clientName) {
      console.log(cards);
      sendMessage('found',cards);
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

function admireSet(cards,message) {
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
  setTimeout(function() {$overlay.hide()},2000);
  setTimeout(moveOn,4500);
}

//then click overlay to turn it off

//when user clicks off overlay, cards are replaced and game resumes

//Remove selected cards from board
//If deck has at least 3 cards left, replace removed cards

function updateBoard (cards) {
  var cells = [];
  for (var i=0;i < 3;i++) {
    var oldCard = cards[i];
    var index = board.indexOf(oldCard);
    board.splice(index,1);
    var $cell = $('#c'+oldCard).parents('td');
    cells.push($cell.attr('id'));
    $('#c'+oldCard).remove();
  }
  if (deck.length >= 3) {
    for (var i=0;i<3;i++) {
      var newCard = deck.pop();
      board.push(newCard);
      console.log(newCard);
      cellName = "#"+cells[i];
      fill_td(cellName,newCard);
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
    $('#reminder').show();
    $board.removeClass('highlighted');
    $("td").removeClass('on');
    $('#overlay').html('');
    $overlay.hide();
    activePlayer = '';
    gamePaused = false;
  }
}

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
//    displayInfo();
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

function gameOver () {
  $overlay.show()
  var $h1 = $('<h1>');
  $h1.text(winner+' wins!');
  $overlay.append($h1);
  clearInterval(gameTime);
  gameover = true;
  gamePaused = true;
}

$('#replay').click(function (e) {
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

function displayInfo(remoteInfo) {
}

function updateInfo() {
  $remain.text('Cards remaining: '+remain);
  updateScores();
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

function computerReports() {
    sendMessage('found',cards);
}

function computerTurn() {
  if (!declared && !gamePaused) {
//    console.log("Guess at "+seconds);
    var cards = computerGuess(board);
    if (cards != false) {
      console.log('Computer finds set');
      sendMessage('declaring');
      setTimeout(sendMessage,2000,'found',cards);
    }
  }
}

function startComputer() {
  if (computerEnabled) {
    var guessTime = 300;
    console.log("Activating computer at "+seconds);
    gamePaused= false;
    guesser = setInterval(computerTurn,guessTime);
  }
}


//END computer player features



//Add way to declare SET

function attemptDeclare() {
  console.log('Declaring!');
  sendMessage('declaring');
}

function declareSet() {
  console.log('set declared');
  $('#reminder').hide();
  $('#board').addClass('active');
  declared = true;
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

var $setButton = $('#declare-set');
$setButton.hide();

$setButton.on(myDown,function (e) {
  e.stopPropagation();
  e.preventDefault();
  attemptDeclare();
});

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

function sendMessage(action,cards) {
    console.log(cards);
    var actor = clientName;
    if (cards) {
        cards = cards.join();
    }
    console.log(action + actor);
    $.ajax({
        url: '/move',
        type: 'POST',
        data: {
            g:gameKey,
            actor:clientName,
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
      admireSet(cards,actor+' found a SET!');
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
}
openChannel = function() {
  var token = $('#my-token').val();
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

enableKeys();
