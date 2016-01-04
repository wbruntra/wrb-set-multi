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

$startButton.on(myDown,function(e) {
  console.log("Game started!");
  guessTime = 36000/parseInt($('#difficulty').val());
  longGame = ($('#gametype').val() == "1") ? true : false;
  $('#declaration').hide();
  $('#pregame').hide();
  $('#middle').show();
  updateInfo();
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

$('#middle').hide();
createDivTable();

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

function layoutGame() {
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
  if (declared == true) {
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
      window.yourScore += 1;
      admireSet(cards,"CONGRATS!");
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
  for (var i=0;i<4;i++) {
    var to_test = parseInt(cards[0][i])+parseInt(cards[1][i])+parseInt(cards[2][i]);
    if (to_test % 3 != 0) {
    return false;
    }
  }
  return true;
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

$overlay.click( function(e) {
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
  } else {
    var finalScore = calculateScore();
    console.log('Ending the game!');
    $overlay.hide();
    if (calculateScore() > lowScore) {
      promptName();
    } else {
      location.reload();
    }
  }
});

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
    clearInterval(guesser);
    setTimeout(startComputer,500);
  }
}

function gameOver () {
  $overlay.show()
  var $h1 = $('<h1>');
  if (yourScore > opponentScore) {
    $h1.text('YOU WIN!');
  } else {
    $h1.text('YOU LOSE!');
  }
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
  return results.length;
}

function deckContainsSet(deck) {
  for (var i=0;i<(deck.length-2);i++){
    for (var j=i+1;j<(deck.length-1);j++) {
      var third = nameThird([deck[i],deck[j]]);
      var k = deck.indexOf(third)
      if (k != -1) {
        return true;
      }
    }
  }
  return false;
}

function updateInfo() {
  $remain.text('Cards remaining: '+deck.concat(board).length);
  $yourScore.text("Your Points: "+yourScore);
  $opponentScore.text("Opponent Points: "+opponentScore);
  $onboard.text("Sets on board: "+countSets(board));
  $('#score-info').text("Score: "+calculateScore());
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

function pairs(n) {
  result = [];
  for (i = 0;i<n-2;i++) {
    for (j=i+1;j<n-1;j++) {
      result.push([i,j]);
    }
  }
  return result;
}

function computerSearchInit() {
  choices = shuffle(pairs(board.length));
  choiceIndex = 0;
}

function computerSearch(board) {
  choice = choices[choiceIndex];
  var a = board[choice[0]]
  var b = board[choice[1]]
  var c = nameThird([a,b]);
  if (board.indexOf(c) != -1) {
    return [a,b,c];
  }
  return false;
}

function computerTurn() {
  if (!declared && !gamePaused) {
    console.log("Guess at "+seconds);
    var cards = computerSearch(board);
    console.log("Tried "+choice);
    if (cards != false) {
      console.log('Computer finds set');
      opponentScore += 1;
      admireSet(cards, "OH NO!");
    } else {
      if (guessTimeMultiplier > 1) {
        guessTimeMultiplier += -.25
      }
      choiceIndex += 1;
      setTimeout(computerTurn,guessTime*guessTimeMultiplier);
    }
  }
}

function startComputer() {
  console.log("Activating computer at "+seconds);
  guessTimeMultiplier = 2;
  computerSearchInit();
  gamePaused= false;
  guesser = setTimeout(computerTurn,guessTime*guessTimeMultiplier);
}



//END computer player features



//Add way to declare SET

function declareSet() {
  console.log('set declared');
  $('#board').addClass('active');
  declared = true;
  $submitButton.show();
  $setButton.hide();
  window.secondsLeft = 6;
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
    yourScore = yourScore - .5;
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
  $setButton.show();
  $submitButton.hide();
  $('#countdown').removeClass('running');
  clearInterval(window.timerId);
  $('td.on').removeClass('on');
}

var $setButton = $('#declare-set');
$setButton.on(myDown,function (e) {
  e.stopPropagation();
  e.preventDefault();
  declareSet();
});

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
    updateInfo();
    computerSearchInit();
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
