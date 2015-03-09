// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 80;

server.listen(port, function () {
   console.log('Server listening at port %d', port);
});

// Routing

app.use('/flipper', express.static(__dirname + '/public'));


var usernames = {};
var games = {};

function addGame(player, socketId) {
   var game = {
      socket1: socketId,
      player1: player,
      socket2: '',
      player2: '',
      started: false,
      id: Math.random().toString().slice(2,11)
   }
   games[game.id] = game;
   console.log('Added a game:', game.id)
   return game.id;
}

function joinGame(player, socketId) {
   for(var i in games) {
      var game = games[i];
      if (!game.started) {
         game.socket2 = socketId;
         game.player2 = player;
         game.started = true;
         return game.id;
         break;
      }
   }
   return addGame(player, socketId);
}

function startGame(gameId) {
   var seconds = 4;
   var countdownFun = function() {
      seconds--;

      var data = {
         gameId: gameId,
         seconds: seconds,
      };

      sendGameMessage(gameId, 'start-countdown', data);

      if (!seconds) {
         clearInterval(countdownInterval);
      }
   }
   var countdownInterval = setInterval(countdownFun, 1000);
   countdownFun();

   console.log('Starting game', gameId);
}

function sendGameMessage(gameId, message, data) {
   io.to(games[gameId].socket1).emit(message, data);
   io.to(games[gameId].socket2).emit(message, data);
}

io.on('connection', function(socket) {
   var addedUser = false;

   socket.on('sendMove', function (data) {
      var gameId = socket.gameId;
      sendGameMessage(gameId, 'move', data);
   });

   socket.on('user-join', function (username) {
      // we store the username in the socket session for this client
      socket.username = Math.random().toString().slice(2,11);
      // add the client's username to the global list
      usernames[socket.username] = false;
      addedUser = true;

      socket.gameId = joinGame(socket.username, socket.id);
      socket.playerNum = (games[socket.gameId].player1 == socket.username) ? 1 : 2;

      if (games[socket.gameId].started) {
         socket.emit('joined-game', {
            username: socket.username,
            gameId: socket.gameId,
            playerNum: socket.playerNum
         });
      } else {
         var checkGameInterval = setInterval(function() {
            if (games[socket.gameId].started) {
               socket.emit('joined-game', {
                  username: socket.username,
                  gameId: socket.gameId,
                  playerNum: socket.playerNum
               });
               clearInterval(checkGameInterval);
               startGame(socket.gameId);
            }
         }, 1000);
      }
   });

   // when the user disconnects.. perform this
   socket.on('disconnect', function () {
      // remove any games the user was in
      if (socket.gameId && games[socket.gameId]) {
         if (games[socket.gameId].started) {
            sendGameMessage(socket.gameId, 'game-end', {
               gameId: socket.gameId
            })
         }
         delete games[socket.gameId];
      }

      // remove the username from global usernames list
      if (addedUser) {
         delete usernames[socket.username];
      }
   });

});
