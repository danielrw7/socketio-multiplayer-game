function GameController(gameId, playerNum, width, height) {
   this.gameId = gameId;

   this.playerNum = playerNum || 1;
   this.forbidden = (playerNum == 1) ? 'black' : 'white';

   this.width = width || 15;
   this.height = height || 16;

   // Default controls that can be overriden later.
   this.keys = {
      left: 37,
      right: 39,
      up: 38,
      down: 40,
      // pause: 27
   };

   this.keyActions = {
      // pause: function() {
      //    if (Game.isPaused) {
      //       Game.resume();
      //    } else {
      //       Game.pause();
      //    }
      // }
   };

   this.moveKeys = ['left', 'right', 'up', 'down'];
   for(var i in this.moveKeys) {
      this.keyActions[this.moveKeys[i]] = eval('(function() { Game.sendMove("'+this.moveKeys[i]+'"); })');
   }


   this.onKey = function(key) {
      if (this.keys[key]) {
         this.keyActions[key]();
      }
   }

   this.setKey = function(label, keyCode) {
      this.keys[label] = keyCode;
   }

   this.pause = function() {
      this.toggleOverlay();
      this.isPaused = true;
   }

   this.resume = function() {
      this.toggleOverlay();
      this.isPaused = false;
   }

   this.move = function(playerNum, dir) {
      var x, y;
      var player, positionKey;
      if (playerNum == 1) {
         player = this.player;
         positionKey = 'playerPos';
      } else {
         player = this.opponent;
         positionKey = 'opponentPos';
      }
      x = this[positionKey].x;
      y = this[positionKey].y;
      var moves = {
         left: {
            x: -1
         },
         right: {
            x: 1
         },
         up: {
            y: -1,
         },
         down: {
            y: 1
         }
      }
      if (moves[dir]) {
         var newX = x + (moves[dir].x || 0),
             newY = y + (moves[dir].y || 0);
         this.setPlayerPos(playerNum, newX, newY);
      }
   }

   this.sendMove = function(dir) {
      var data = {
         gameId: this.gameId,
         playerNum: this.playerNum,
         dir: dir,
      }
      socket.emit('sendMove', data);
   }

   this.setPlayerPos = function(playerNum, x, y) {
      playerNum = playerNum || 1;
      x = parseInt(x);
      y = parseInt(y);
      var $cell = $('.cell[xpos='+x+'][ypos='+y+']');

      var player, positionKey, forbidden;
      if (playerNum == 1) {
         player = this.player;
         positionKey = 'playerPos';
         forbidden = 'black';
      } else {
         player = this.opponent;
         positionKey = 'opponentPos';
         forbidden = 'white';
      }

      if ($cell.length
         // && !$cell.hasClass(forbidden)
      && 1) {
         player.parent().toggleClass('white').toggleClass('black');
         player.appendTo($cell);
         this[positionKey] = {
            x: x,
            y: y
         }
         return true;
      } else {
         return false;
      }
   }

   $(window).keydown(function(e) {
      var code = e.keyCode || e.which,
          key;
      if (!Game.isPaused || code == Game.keys.pause) {
         for(var k in Game.keys) {
            if (code == Game.keys[k]) {
               key = k;
            }
         }
         Game.onKey(key);
      }
   });

   this.isPaused = false;

   this.board = $('.tiles');
   this.player = $('<div id="player"></div>');
   this.opponent = $('<div id="other-player"></div>');

   for(var h = 0; h < this.height; h++) {
      var $row = $('<div class="row '+h+'" style="height: '+(100/this.height)+'%"></div>'),
          color = (h < this.height/2) ? 'black' : 'white';
      for(var w = 0; w < this.width; w++) {
         $row.append('<div class="cell '+w+' '+color+'" ypos="'+h+'" xpos="'+w+'" style="width: '+(100/this.width)+'%"></div>')
      }
      if (h == this.height - 1) {
         $row.find('.cell.'+(Math.floor(this.width/2))).append(this.player);
      } else if (h == 0) {
         $row.find('.cell.'+(Math.floor(this.width/2))).append(this.opponent);
      }
      this.board.append($row);
   }

   this.playerPos = {
      x: parseInt(this.player.parent().attr('xpos')),
      y: parseInt(this.player.parent().attr('ypos'))
   }
   this.opponentPos = {
      x: parseInt(this.opponent.parent().attr('xpos')),
      y: parseInt(this.opponent.parent().attr('ypos'))
   }

   this.overlay = $('.overlay');

   this.toggleOverlay = function() {
      this.overlay.toggle();
   }

   this.pause();
}
