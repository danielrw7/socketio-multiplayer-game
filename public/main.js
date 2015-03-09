// $(function() {
$(document).ready(function() {

   $window = $(window);

   $joinPage = $('.join.page');
   $searchingPage = $('.searching.page');
   $flipPage = $('.flip.page');
   $gameEnd = $('.end.page')

   connected = false;
   $username = "";

   $joinPage.show();

   $('.join-button').click(function() {
      $joinPage.fadeOut();
      $searchingPage.fadeIn();

      socket = io();

      socket.on('joined-game', function(data) {
         $username = data.username;
         $gameId = data.gameId;
         console.log('joined game', $gameId, data.playerNum);

         $searchingPage.fadeOut();
         $flipPage.fadeIn();

         var p = data.playerNum, c, c2;
         if (p == 1) {
            c = 'white';
            c2 = 'black';
         } else {
            c = 'black';
            c2 = 'white';
         }

         $help = $('.help');

         $help.text($help.text().replace(/%p/g, p).replace(/%c2/g, c2).replace(/%c/g, c));

         Game = new GameController($gameId, data.playerNum);

         socket.on('start-countdown', function(data) {
            if (data.gameId == $gameId) {
               if (data.seconds == 0) {
                  $('.countdown').hide();
                  Game.resume();
               } else {
                  $('.countdown').text('Starts in '+data.seconds+'...');
               }
            }
         });
         socket.on('move', function(data) {
            Game.move(data.playerNum, data.dir);
         })
         socket.on('game-end', function(data) {
            $flipPage.fadeOut();
            $gameEnd.fadeIn();

         })
      });

      socket.emit('user-join');
   })
})
// });
