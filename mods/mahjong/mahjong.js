var saito = require('../../lib/saito/saito');
var GameTemplate = require('../../lib/templates/gametemplate');


//////////////////
// CONSTRUCTOR  //
//////////////////
class Mahjong extends GameTemplate {

  constructor(app) {
    super(app);

    this.name            = "Mahjong";

    this.description     = '144 tiles are randomly folded into a multi-layered shape.' +
                           'The goal of this game is to remove all tiles of the same pair by matching the pairs and clicking at them in sequence' +
                           'There are layers of tiles and tiles stacked on top of other tiles make these tiles underneath invisible.' +
                           'The game is finished when all pairs of tiles have been removed from the board.';
    this.categories      = "Games Cardgame one-player";

    this.maxPlayers      = 1;
    this.minPlayers      = 1;
    this.status          = "Beta";

  }

  returnGameRulesHTML(){
    return `<div class="rules-overlay">
            <h1>Mahjong</h1>
            <ul>
            <li>144 tiles are randomly folded into a multi-layered shape.</li>
            <li>The goal of this game is to remove all tiles of the same pair by matching the pairs and clicking at them in sequence</li>
            <li>There are layers of tiles and tiles stacked on top of other tiles make these tiles underneath invisible.</li>
            <li>The game is finished when all pairs of tiles have been removed from the board.</li>
            </ul>
            </div>
            `;

  }

  //
  // runs the first time the game is created / initialized
  //
  initializeGame(game_id) {

    console.log("GAMEID: " + game_id);

    //
    // to persist data between games, such as board state, write it to 
    // the game.state object. if this object does not exist, that tells
    // us this is the first time we have initialized this game.
    //
    if (!this.game.state) {

      this.game.state = this.returnState();

      this.game.queue = [];
      this.game.queue.push("play");
      this.game.queue.push("READY");

    }
    
    this.saveGame(this.game.id);

    if (this.browser_active){
      $('.slot').css('min-height', $('.card').css('min-height'));  
    }

  }

  newRound(){
    //Set up queue
    this.game.queue = [];
    this.game.queue.push("play");

    //Clear board
    this.game.board = {};

    //Reset/Increment State
    this.game.state.round++;
    this.game.state.recycles_remaining = 2;
    this.displayBoard();
    this.displayUserInterface();
  }

  isArrayInArray(arr, item){
    var item_as_string = JSON.stringify(item);
  
    var contains = arr.some(function(ele){
      return JSON.stringify(ele) === item_as_string;
    });
    return contains;
  }

  firstColumn = 1;
  lastColumn = 14;

  emptyCells = [
    [1,1], [1,14],
    [2,1], [2,2], [2,3], [2,12], [2,13], [2,14],
    [3,1], [3,2], [3,13], [3,14],
    [5,1], [5,14],
    [6,1], [6,2], [6,13], [6,14],
    [7,1], [7,2], [7,3], [7,12], [7,13], [7,14],
    [8,1], [8,14],
    // 2nd layer
    [9,1], [9,2], [9,3], [9,4], [9,11], [9,12], [9,13], [9,14],
    [10,1], [10,2], [10,3], [10,4], [10,11], [10,12], [10,13], [10,14],
    [11,1], [11,2], [11,3], [11,4], [11,11], [11,12], [11,13], [11,14],
    [12,1], [12,2], [12,3], [12,4], [12,11], [12,12], [12,13], [12,14],
    [13,1], [13,2], [13,3], [13,4], [13,11], [13,12], [13,13], [13,14],
    [14,1], [14,2], [14,3], [14,4], [14,11], [14,12], [14,13], [14,14],
    // 3rd layer
    [15,1], [15,2], [15,3], [15,4], [15,5], [15,10], [15,11], [15,12], [15,13], [15,14],
    [16,1], [16,2], [16,3], [16,4], [16,5], [16,10], [16,11], [16,12], [16,13], [16,14],
    [17,1], [17,2], [17,3], [17,4], [17,5], [17,10], [17,11], [17,12], [17,13], [17,14],
    [18,1], [18,2], [18,3], [18,4], [18,5], [18,10], [18,11], [18,12], [18,13], [18,14],
    // 4th layer
    [19,1], [19,2], [19,3], [19,4], [19,5], [19,6], [19,9], [19,10], [19,11], [19,12], [19,13], [19,14],
    [20,1], [20,2], [20,3], [20,4], [20,5], [20,6], [20,9], [20,10], [20,11], [20,12], [20,13], [20,14],
    //5th layer (top)
    [21,1], [21,2], [21,3], [21,4], [21,5], [21,6], [21,9], [21,10], [21,11], [21,12], [21,13], [21,14],
  ];

  // displayBoard
  async displayBoard(timeInterval = 1) {

    console.log('this.game');
    console.log(this.game);

    this.game.deck.cards = this.returnDeck();

    let index = 0;
    this.game.board = {}
    let deckSize = Object.values(this.game.deck.cards).length
    for (let i = 1; i <= 21; i++){
      for (let j = 1; j <= 14; j++){
        let position = `row${i}_slot${j}`;
          if (!this.isArrayInArray(this.emptyCells, [i,j]) && deckSize > index) {
            this.game.board[position] = Object.values(this.game.deck.cards)[index];
            index++;
          } else {
            this.game.board[position] = "E";
          }
      }
    }
    this.game.cardsLeft = index;
    this.game.selected = "";
    this.game.hidden=[];
    if (this.browser_active == 0) { return; }
    $(".slot").removeClass("empty");
    index = 0;
    try {
      //Want to add a timed delay for animated effect
      const timeout = ms => new Promise(res => setTimeout(res, ms));
      for (let i = 1; i <= 21; i++){
        for (let j = 1; j <= 14; j++){
          var divname = `row${i}_slot${j}`;
          if (!this.isArrayInArray(this.emptyCells, [i,j]) && deckSize > index) {
            await timeout(timeInterval);
            $('#' + divname).html(this.returnCardImageHTML(Object.values(this.game.deck.cards)[index++]));
            this.untoggleCard(divname);
          } else {
            this.makeInvisible(divname);
          }
        }
      }
      this.attachEventsToBoard();
    } catch (err) {
      console.log(err);
      console.log(this.game);
    }
  }

  makeInvisible(divname) {
    $('#' + divname).css('box-shadow','none');
    $('#' + divname).css('-moz-box-shadow','none');
    $('#' + divname).css('-webkit-box-shadow','none');
    $('#' + divname).css('-o-box-shadow','none');
    $('#' + divname).css('opacity','0.0');
    $('#' + divname).css('pointer-events','none');
  }

  returnCardImageHTML(name) {
    if (name[0] == 'E') { return ""; }
    else { return '<img src="/mahjong/img/tiles/white/'+name+'.png" />'; }
  }

  returnBackgroundImageHtml() {
    return '<img src="/mahjong/img/tiles/Export/Regular/Front.png" />';
  }

  //
  // runs whenever we load the game into the browser. render()
  //
  initializeHTML(app) {

    if (!this.browser_active) { return; }
    
    super.initializeHTML(app);

    //
    // Want Menus ?
    //
    this.menu.addMenuOption({
      text : "Game",
      id : "game-game",
      class : "game-game",
      callback : function(app, game_mod) {
        game_mod.menu.showSubMenu("game-game");
      }
    });
    this.menu.addSubMenuOption("game-game",{
      text : "Start New Game",
      id : "game-new",
      class : "game-new",
      callback : function(app, game_mod) {
        game_mod.newRound();
      }
    });
    this.menu.addSubMenuOption("game-game", {
      text : "How to Play",
      id : "game-intro",
      class : "game-intro",
      callback : function(app, game_mod) {
        game_mod.menu.hideSubMenus();
        game_mod.overlay.show(app, game_mod, game_mod.returnGameRulesHTML());
      }
    });
    this.menu.addSubMenuOption("game-game", {
      text : "Exit",
      id : "game-exit",
      class : "game-exit",
      callback : function(app, game_mod) {
        game_mod.updateStatusWithOptions("Saving game to the blockchain...");
        game_mod.prependMove("exit_game\t"+game_mod.game.player);
        game_mod.endTurn();
      }
    });

    //
    // fullscren toggle?
    //
    this.menu.addMenuIcon({
      text : '<i class="fa fa-window-maximize" aria-hidden="true"></i>',
      id : "game-menu-fullscreen",
      callback : function(app, game_mod) {
        game_mod.menu.hideSubMenus();
        app.browser.requestFullscreen();
      }
    });

    //
    // chat menu?
    //
    this.menu.addChatMenu(app, this);

    //
    // render menu
    //
    this.menu.render(app, this);
    this.menu.attachEvents(app, this);

    //
    // sidebar log
    //
    this.log.render(this.app, this);
    this.log.attachEvents(this.app, this);

    //
    // display the board?
    //
    this.displayBoard();

  }

  returnState() {

    let state = {};

    state.round = 0;
    state.wins = 0;
    state.recycles_remaining = 2; // to be used for shuffle later

    return state;

  }

  attachEventsToBoard() {

    let mahjong_self = this;

    $('.slot').off();
    $('.slot').on('click', function() {

      let card = $(this).attr("id");
      let tileTokens = card.split('slot');
      let tileColumn = parseInt(tileTokens[1]);
      if (mahjong_self.game.board[card] !== "E") {
        switch (card) {
          case 'row19_slot7':
          case 'row20_slot7':
            if (!mahjong_self.game.hidden.includes('row21_slot7')) {
              return;
            } else {
              break;
            }
          case 'row19_slot8':
          case 'row20_slot8':
            if (!mahjong_self.game.hidden.includes('row21_slot8')) {
              return;
            } else {
              break;
            }
          // two edge cases for the tiles being on the left/ right of two rows
          case 'row5_slot2':
            if (!mahjong_self.game.hidden.includes('row4_slot1')) {
              return;
            }
          case 'row5_slot13':
            if (!mahjong_self.game.hidden.includes('row4_slot14')) {
              return;
            }
          default: // there must be no tile on the left or on the right for a given tile to be a valid selection
            let leftTile = `${tileTokens[0]}slot${tileColumn - 1}`;
            let rightTile = `${tileTokens[0]}slot${tileColumn + 1}`;
            // if left tile is not unlocked nor empty
            if (!((mahjong_self.game.hidden.includes(leftTile)) || mahjong_self.game.board[leftTile] === "E") &&
              // if right tile is not unlocked nor empty
               !((mahjong_self.game.hidden.includes(rightTile)) || mahjong_self.game.board[rightTile] === "E") &&
               !(tileColumn === mahjong_self.firstColumn || tileColumn === mahjong_self.lastColumn)) {
              return;
            }
        }
      } else {
        return;
      }

      if (mahjong_self.game.selected === card) { //Selecting same card again
        mahjong_self.untoggleCard(card);
        mahjong_self.game.selected = "";
        return;
      } else {
        if (mahjong_self.game.selected === "") { // New Card
          mahjong_self.game.selected = card;
          mahjong_self.toggleCard(card);
          return;
        } else {
          if (mahjong_self.game.board[card] === mahjong_self.game.board[mahjong_self.game.selected]) {
            mahjong_self.makeInvisible(card);
            mahjong_self.makeInvisible(mahjong_self.game.selected);
            mahjong_self.game.hidden.push(card);
            mahjong_self.game.hidden.push(mahjong_self.game.selected);
            mahjong_self.game.cardsLeft = mahjong_self.game.cardsLeft - 2;
            if (mahjong_self.game.cardsLeft === 0) {
              mahjong_self.game.state.wins++;
              mahjong_self.displayModal("Congratulations!", "You won ser!");
              mahjong_self.newRound();
            }
            mahjong_self.displayUserInterface();
            mahjong_self.game.selected = "";
            return;
          } else { // no match
            mahjong_self.toggleInvalidCard(card);
            return;
          }
        }
      }
    });
  }

  toggleCard(divname) {
    divname = '#' + divname;
    $(divname).css('box-shadow', '0px 0px 0px 3px #00ff00');
    $(divname).css('-moz-box-shadow', '0px 0px 0px 3px #00ff00');
    $(divname).css('-webkit-box-shadow', '0px 0px 0px 3px #00ff00');
    $(divname).css('-o-box-shadow', '0px 0px 0px 3px #00ff00');
  }

  toggleInvalidCard(divname) {
    let mahjong_self = this;
    $('#' + divname).css('box-shadow', '0px 0px 0px 3px #ff0000');
    $('#' + divname).css('-moz-box-shadow', '0px 0px 0px 3px #ff0000');
    $('#' + divname).css('-webkit-box-shadow', '0px 0px 0px 3px #ff0000');
    $('#' + divname).css('-o-box-shadow', '0px 0px 0px 3px #ff0000');
    setTimeout(() => {
      mahjong_self.untoggleCard(divname);
    }, 1000);
  }

  untoggleCard(divname) {
    divname = '#' + divname;
    $(divname).css('opacity','1.0');
    $(divname).css('pointer-events','auto');
    if (divname === "#row4_slot1" || divname === "#row4_slot14") {
      $(divname).css('box-shadow', '0px 10px 12px 1px #000000');
      $(divname).css('-moz-box-shadow', '0px 10px 12px 1px #000000');
      $(divname).css('-webkit-box-shadow', '0px 10px 12px 1px #000000');
      $(divname).css('-o-box-shadow', '0px 10px 12px 1px #000000');
    } else {
      $(divname).css('box-shadow', '12px 10px 12px 1px #000000');
      $(divname).css('-moz-box-shadow', '12px 10px 12px 1px #000000');
      $(divname).css('-webkit-box-shadow', '12px 10px 12px 1px #000000');
      $(divname).css('-o-box-shadow', '12px 10px 12px 1px #000000');
    }
  }

  displayUserInterface() {
    let mahjong_self = this;

    let html = '<span class="hidable">144 tiles are randomly folded into a multi-layered shape.' + 
               'The goal of this game is to remove all tiles of the same pair by matching the pairs and clicking at them in sequence' +
               'THere are layers of tiles and tiles stacked on top of other tiles make these tiles underneath invisible.' +
               'The game is finished when all pairs of tiles have been removed from the board.</span>';

    // TODO later - shuffle
    let option = '';
    // if (this.game.state.recycles_remaining > 0) {
    //   html += '<span>You may shuffle the unlocked tiles ';
    //   if (this.game.state.recycles_remaining == 2) { 
    //     html += '<strong>two</strong> more times.'; 
    //   }else{
    //     html += '<strong>one</strong> more time.';  
    //   }
    //   html += "</span>";
    //   option += ` id="shuffle">Shuffle cards`;
    // } else {
    //   option += ` id="quit">Start New Game`;
    // }
    if (this.game.hidden.length > 0){
      option += `<ul><li class="menu_option" id="undo">Undo`;
      option += "</li></ul>";
    }    
    
    this.updateStatusWithOptions(html,option); 

    $('.menu_option').off();
    $('.menu_option').on('click', function() {
      let action = $(this).attr("id");

      // if (action == "shuffle"){
      //   mahjong_self.updateStatusWithOptions("shuffle cards...");
      //   mahjong_self.prependMove("shuffle");
      //   mahjong_self.endTurn();
      //   return;
      // }
      // if (action == "quit"){
      //   mahjong_self.endGame();
      //   mahjong_self.newRound();
      //   mahjong_self.endTurn();
      //   return;
      // }
      if (action == "undo"){
        mahjong_self.undoMove();
        return;
      }
    });
  }

  undoMove() {
    this.untoggleCard(this.game.hidden[this.game.hidden.length - 1]);
    this.untoggleCard(this.game.hidden[this.game.hidden.length - 2]);
    this.game.hidden.splice(this.game.hidden.length - 2, 2);
    this.game.cardsLeft = this.game.cardsLeft + 2;
    this.displayUserInterface();
  }

  ////////////////////
  // VERY IMPORTANT //
  ////////////////////
  //
  // this is the main function for queue-based games. cryptographic logic
  // and shared commands (DEAL, SHUFFLE, etc.) are powered by the underlying
  // game engine, which kicks instructions here if it doesn't recognize them.
  //
  // the convention is for game-level instructions to be lowercase and game-
  // engine commands to be UPPERCASE so as to easily.
  //
  // return 0 -- halts execution
  // return 1 -- continues execution
  //
  // clear the queue manually and return 1 if there is no user-input at this
  // point in the game. if there is user-input, return 0 and the QUEUE will 
  // being to execute again the next time a move is received over the network.
  //
  handleGameLoop(msg=null) {

    // let mahjong_self = this;

    ///////////
    // QUEUE //
    ///////////
    if (this.game.queue.length > 0) {

      let qe = this.game.queue.length-1;
      let mv = this.game.queue[qe].split("\t");

      if (mv[0] === "play"){

        //
        // perhaps wait until game is being viewed to execute?
        //
        if (!this.browser_active) { return 0; }

        this.displayUserInterface();
        return 1;

      }

      if (mv[0] === "round") {
        this.newRound();
      }

      if (mv[0] === "exit_game"){
        this.game.queue = [];
        let player = parseInt(mv[1])
        this.saveGame(this.game.id);

        if (this.game.player === player){
          window.location.href = "/arcade";
        }else{
          this.updateStatus("Player has exited the building");
        }
        return 0;
      }

      return 1;

    } 

    //
    // nothing in queue, return 0 and halt
    //
    return 0; 

  }


  returnDeck() {

    let cards = [
      "Chun",
      "Hatsu",
      "Man1",
      "Man2",
      "Man3",
      "Man4",
      "Man5-Dora",
      "Man5",
      "Man6",
      "Man7",
      "Man8",
      "Man9",
      "Nan",
      "Pei",
      "Pin1",
      "Pin2",
      "Pin3",
      "Pin4",
      "Pin5-Dora",
      "Pin5",
      "Pin6",
      "Pin7",
      "Pin8",
      "Pin9",
      "Shaa",
      "Sou1",
      "Sou2",
      "Sou3",
      "Sou4",
      "Sou5-Dora",
      "Sou5",
      "Sou6",
      "Sou7",
      "Sou8",
      "Sou9",
      "Ton"
    ];

    // TODO - remove (use for testing)

    // let cards = [
    //   "Chun",
    //   "Hatsu"
    // ];

    let deck = {};
    
    for (let j=0; j<4; j++){
      cards.sort(() => Math.random() - 0.5);
      for (let i = 0; i<cards.length; i++) {
        let name = cards[i];
        deck[`${name}_${j}`] = name;
      }
    }

    return deck;

  }


}

module.exports = Mahjong;

