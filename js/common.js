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

activePlayer = 'none'
running = false;

function updateInfo() {
  $('#remaining').text('Cards remaining: '+state.remain);
  $('#sets-on-board').text("Sets on board: "+countSets(board));
  return;
}

function getIndex(needle, haystack) {      
    return haystack.join('-').split('-').indexOf( needle.join() );          
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
function sendChat(chatter,chat) {
  $.ajax({
    url: '/chat',
    type: 'POST',
    data: {
      g:game_key,
      chatter:chatter,
      chat:chat
    }
  });
}

$('#colTwo').hide();
$setButton.hide();

function createRecord(finder) {
  var $div = $('<div>');
  var $p = $('<p>');
  $p.text(finder);
  var s = '';
  $('.on').each(function() {
    s += $(this).html();
  });
  $div.html($p.html()+s);
  $('#colTwo').append($div);
}

function clearKeys() {
  $('body').unbind("keydown");
}

$('#my-msg').focus(function() {
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
  $("#my-msg").blur();
});