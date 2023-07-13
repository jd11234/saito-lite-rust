const GameTemplate = require("../../lib/templates/gametemplate");
const saito = require("../../lib/saito/saito");
const Board = require("./lib/ui/board");
const ManaOverlay = require("./lib/ui/overlays/mana");
const CombatOverlay = require("./lib/ui/overlays/combat");

//////////////////
// CONSTRUCTOR  //
//////////////////
class Realms extends GameTemplate {


	constructor(app) {
		super(app);

		this.app = app;
		this.name = "Realms";
		this.description = "Saito Realms is a card-driven magical battle game";
		this.categories 	 = "Games Cardgame Strategy Deckbuilding";
		this.card_img_dir = "/realms/img/cards";

		this.card_height_ratio = 1.39;

		this.interface = 1;

		this.minPlayers = 2;
		this.maxPlayers = 2;

		//
		// UI components
		//
		this.board = new Board(this.app, this);
		this.mana_overlay = new ManaOverlay(this.app, this);
		this.combat_overlay = new CombatOverlay(this.app, this);

		return this;
	}


	render(app) {

		if (!this.browser_active) { return; }

		super.render(app);

		//
		// ADD MENU
		//
		this.menu.addMenuOption("game-game", "Game");
		this.menu.addMenuOption("game-info", "Info");
		this.menu.addChatMenu();
		this.menu.render(app, this);

		//
		// add card events -- text shown and callback run if there
		//
		this.cardbox.render(app, this);
		//this.cardbox.skip_card_prompt = 0;
		this.cardbox.addCardType("showcard", "", null);
		this.cardbox.addCardType("card", "select", this.cardbox_callback);

		this.log.render(app, this);
		this.hud.render(app, this);

		this.board.render();

	}



	initializeGame(game_id) {

		//
		// initialize
		//
		if (this.game.status) { this.updateStatus(this.game.status); }

		//
		// import player cards
		//
		let deck1 = this.returnRedDeck();
		let deck2 = this.returnGreenDeck();

		//
		// initialize queue on new games
		//
		if (this.game.deck.length == 0) {

			this.game.state = this.returnState();

			this.game.queue.push("round");
			this.game.queue.push("READY");

			//
			// first play to go draws 6 to avoid pulling 8th first turn
			//
			this.game.queue.push("DEAL\t1\t1\t6");
			this.game.queue.push("DEAL\t2\t2\t7");

			//
			// encrypt and shuffle player-2 deck
			//
			this.game.queue.push("DECKENCRYPT\t2\t2");
			this.game.queue.push("DECKENCRYPT\t2\t1");
			this.game.queue.push("DECKXOR\t2\t2");
			this.game.queue.push("DECKXOR\t2\t1");

			// encrypt and shuffle player-1 deck
			this.game.queue.push("DECKENCRYPT\t1\t2");
			this.game.queue.push("DECKENCRYPT\t1\t1");
			this.game.queue.push("DECKXOR\t1\t2");
			this.game.queue.push("DECKXOR\t1\t1");

			// import our decks
			this.game.queue.push("DECK\t1\t" + JSON.stringify(deck1));
			this.game.queue.push("DECK\t2\t" + JSON.stringify(deck2));
		}

		//
		// add events to cards
		//
		this.deck = {};
		for (let key in deck1) { this.importCard(key, deck1[key]); }
		for (let key in deck2) { this.importCard(key, deck2[key]); }

	}



	handleGameLoop() {

  	  ///////////
	  // QUEUE //
	  ///////////
	  if (this.game.queue.length > 0) {

	    let qe = this.game.queue.length - 1;
	    let mv = this.game.queue[qe].split("\t");

	    console.log("QUEUE: " + JSON.stringify(this.game.queue));

	    //
	    // we never clear the "round" so that when we hit it
	    // we always bounce back higher on the queue by adding
	    // more turns for each player.
	    //
	    if (mv[0] == "round") {
	      this.game.queue.push("play\t2");
	      this.game.queue.push("DEAL\t2\t2\t1");
	      this.game.queue.push("play\t1");
	      this.game.queue.push("DEAL\t1\t1\t1");
	    }


	    //
	    // this "deploys" cards into the battleground, such
	    // as adding mana into play. the 4th argument allows us
	    // to specify that a player should ignore the instruction
	    // which is used when a player has made their move locally
	    // and we have already updated their board and do not want
	    // them to repeat that.
	    // 
	    if (mv[0] == "deploy") {

	      this.game.queue.splice(qe, 1);

	      let type = mv[1];
	      let player = parseInt(mv[2]);
	      let card = this.deck[mv[3]];
	      let player_ignores = parseInt(mv[4]);

	      if (this.game.player != player_ignores) {

		if (type == "land") {
		  this.deploy(player, card);
		}
			
		if (type == "creature") {
		  this.deploy(player, card);
		}
				
		if (type == "artifact") {
		  this.deploy(player, card);
		}
				
		if (type == "enchantment") {
		  this.deploy(player, card);
		}

	      }

   	      this.board.render();			

	      return 1;

	    }

	    if (mv[0] === "play") {

	      // this is only removed through "resolve"

	      let player = parseInt(mv[1]);
   	      if (this.game.player == player) {
		this.playerTurn();
	      } else {
	        this.updateStatusAndListCards("Opponent Turn", this.game.deck[this.game.player-1].hand);
	      }

	      return 0;

	    }

	  }
	  return 1;
	}

	
	playerTurn() {

		let realms_self = this;

		if (this.browser_active == 0) {
			return;
		}

console.log("CARDS IS: " + JSON.stringify(this.game.deck[this.game.player-1].hand));

		//
		// show my hand
		//
		this.updateStatusAndListCards(
		  	`play card(s) or click board to attack <span id="end-turn" class="end-turn">[ or pass ]</span>`,
		    	this.game.deck[this.game.player-1].hand, 
			function(cardname) {

				let card = realms_self.deck[cardname];
				alert("CLICKED ON CARD: " + cardname + " -- " + card.type);

				if (card.type == "land") {
					this.deploy(realms_self.game.player, cardname);
					this.addMove(`deploy\tland\t"${realms_self.game.player}\t${cardname}\t${realms_self.game.player}`);
					this.endTurn();
				}
				if (card.type == "creature") {
					this.deploy(realms_self.game.player, cardname);
					this.addMove(`deploy\tcreature\t"${realms_self.game.player}\t${cardname}\t${realms_self.game.player}`);
					this.endTurn();
				}
				if (card.type == "artifact") {
					this.deploy(realms_self.game.player, cardname);
					this.addMove(`deploy\tartifact\t"${realms_self.game.player}\t${cardname}\t${realms_self.game.player}`);
					this.endTurn();
				}
				if (card.type == "enchantment") {
					this.deploy(realms_self.game.player, cardname);
					this.addMove(`deploy\tenchantment\t"${realms_self.game.player}\t${cardname}\t${realms_self.game.player}`);
					this.endTurn();

				}

			}
		);

		//
		// or end their turn
		//
		document.getElementById("end-turn").onclick = (e) => {
			this.prependMove("RESOLVE\t" + this.app.wallet.returnPublicKey());
			this.endTurn();
		};

	}

/****
	playerPlayCardFromHand(card_index) {
		let card = this.game.deck[this.game.player - 1].cards[card_index];

		let c = this.card_library[card];

		console.log(c);

		if (c.type == "land") {
			if (this.game.state.has_placed_land) {
				salert("You may only play one land per turn.");
				return;
			} else {
				this.game.state.has_placed_land = 1;
			}
		}

		//To do -- insert test for mana pool


		let ui_id = this.insertCardSlot(this.game.player, "#summoning_stack");
		for (let i = 0; i < this.game.deck[this.game.player-1].hand.length; i++){
			if (this.game.deck[this.game.player-1].hand[i] == card_index){
				this.game.deck[this.game.player-1].hand.splice(i,1);
				this.game.state.summoning_stack.push({player: this.game.player, key: card, card: c, uuid: ui_id});
			}
		}

		this.addMove(`summon\t${this.game.player}\t${card}`);

		this.moveCard(card_index, ui_id);
		this.endTurn();
	}
****/


	returnState() {

		let state = {};
		state.players_info = [2];
		for (let i = 0; i < 2; i++) {
			state.players_info[i] = {
				health: 20,
				mana: 0, 
				cards: [],
				graveyard: [],
			};
		}

		return state;
	}



	deploy(player, cardname) {

	  let c = this.deck[cardname];

	  let obj = {
	    key    	: cardname ,
	    tapped 	: true ,
            affixed 	: [] ,
	  }

	  this.game.state.players_info[player-1].cards.push(obj);

	  this.board.render();
	}

	



	importCard(key, card) {
		let game_self = this;

		let c = {
			key,
			name		: "Unnamed",
			color		: "*",
			cost		: [],
			power		: 0,
			toughness	: 0,
			text		: "This card has not provided text",
			img		: "/img/cards/sample.png",
		};

		c = Object.assign(c, card);

		//
		// add dummy events that return 0 (do nothing)
		//
		if (!c.onInstant) {
			c.onInstant = function (game_self, player, card) {
				return 0;
			};
		}
		if (!c.onEnterBattlefield) {
			c.onEnterBattlefield = function (game_self, player, card) {
				return 0;
			};
		}
		if (!c.onCostAdjustment) {
			c.onCostAdjustment = function (game_self, player, card) {
				return 0;
			};
		}

		game_self.deck[c.key] = c;
	}




	returnCardImage(cardname) {

	  	if (this.deck[cardname]) {
	  		return this.deck[cardname].returnCardImage();
	  	}


		return '';

	}


        importCard(key, card) {

                let game_self = this;

                let c = {
                        key		:	key,
                        name		: 	"Unnamed",
                        color		: 	"*",
                        cost		: 	[],
                        power		: 	0,
                        toughness	: 	0,
                        text		: 	"This card has not provided text",
                        img		: 	"/img/cards/sample.png",
                };
                c = Object.assign(c, card);


                //
                // add dummy events that return 0 (do nothing)
                //
		if (!c.returnCardImage) {
                	c.returnCardImage = function() {
				return `<div class="card"><img class="card cardimg" src="/realms/img/cards/016_shellring_vindicator.png"></div>`;
                	};
	        }
                if (!c.onInstant) {
                	c.onInstant = function (game_self, player, card) {
                        	return 0;
                	};
                }
                if (!c.onEnterBattlefield) {
                        c.onEnterBattlefield = function (game_self, player, card) {
                                return 0;
                        };
                }
                if (!c.onCostAdjustment) {
                        c.onCostAdjustment = function (game_self, player, card) {
                                return 0;
                        };
                }

		
                game_self.deck[c.key] = c;

        }




	////////////////////////////////
	/// Cards and Card Functions ///
	////////////////////////////////
	returnCards() {

		var deck = {};

		deck["b001"] = {
			name: "Unguided Spirit",
			type: "creature",
			color: "blue",
			cost: ["*", "*", "*", "blue"],
			power: 3,
			toughness: 1,
			properties: ["flying"],
			text: `Flight - At the start of the battle pick one of the following:`,
			lore: `You'll see whatever I choose to show you. Don't get your hopes up.`,
			img: this.card_img_dir + "/025_unguided_spirit.png",
		};

		deck["b002"] = {
			name: "The Big Wave",
			type: "sorcery",
			color: "blue",
			cost: ["*", "*", "*", "*", "blue"],
			text: `Each player picks a non-domain permanent under their command.`,
			img: this.card_img_dir + "/024_big_wave.png",
		};

		deck["b003"] = {
			name: "Fake Destiny",
			type: "instant",
			color: "blue",
			cost: ["*", "blue"],
			text: `Send back a creature of your choosing to its Master's hand. If its Soul value is 3 or less, you get Foresight 1.`, 
			img: this.card_img_dir + "/026_fake_destiny.png",
		};

		deck["b004"] = {
			name: "Luminous Being",
			type: "creature",
			color: "blue",
			cost: ["*", "*", "*", "*", "*", "blue", "blue"],
			power: 7,
			toughness: 8,
			properties: ["blaze"],
			text: `Blaze - This spell cannot be countered.`,
			img: this.card_img_dir + "/027_luminous_being.png",
		};

		deck["b005"] = {
			name: "Symbiotic Possesion",
			type: "instant",
			color: "blue",
			cost: ["*", "*", "blue"],
			text: `Chose a creature, for the rest of the turn it becomes a 5/5 wisdom ghost.`,
			lore: `“A simple trade. Our brains for your brawn.”
							-Ancestral Hive Mind`,
			img: this.card_img_dir + "/028_symbiotic_possesion.png",
		};

		deck["b006"] = {
			name: "Lakeshire Hippogriff",
			type: "creature",
			color: "blue",
			cost: ["*", "*", "*", "*", "*", "blue"],
			power: 3,
			toughness: 3,
			properties: ["flying", "blaze"],
			text: `Blaze Flight`,
			lore: `"With the dragons gone, Lakeshire's hippogriffs eagerly reclaimed their perches atop the valley's mountain peaks."`,
			img: this.card_img_dir + "/029_lakeshire_hippogriff.png",
		};

		deck["b007"] = {
			name: "Deformed Scarecrow",
			type: "creature",
			color: "blue",
			cost: ["*", "*", "blue"],
			power: 2,
			toughness: 1,
			text: `When Deformed Scarecrow is killed, search through your compendium for another Deformed Scarecrow, put it on your hand after showing it to your opponent and then reshuffle the deck.`,
			lore: `Anything, or anybody, can be replaced.`,
			img: this.card_img_dir + "/030_deformed_scarecrow.png",
		};

		deck["island"] = {
			name: "Island",
			type: "land",
			color: "blue",
			img: this.card_img_dir + "/033_island.png",
		};

		deck["waterfall"] = {
			name: "Waterfall Ruin",
			type: "land",
			color: ["blue", "white"],
			img: this.card_img_dir + "/032_waterfall_ruin.png",
		};

		deck["w001"] = {
			name: "Shellring Vindicator",
			type: "creature",
			color: "white",
			cost: ["*", "*", "*", "white"],
			power: 3,
			toughness: 2,
			text: `Drain- As Shellring Vindicator joins the fray, bring back a creature with a Soul value of 2 or less from the crypt into the fray. As long as Shellring Vindicator is fielded, that creature cannot attack or block.`,
			img: this.card_img_dir + "/016_shellring_vindicator.png",
		};

		deck["w002"] = {
			name: "Triumphant Hippogriff",
			type: "creature",
			color: "white",
			cost: ["*", "*", "*", "white"],
			power: 2,
			toughness: 3,
			properties: ["flying"],
			text: `Flight - Once a turn, when a creature with 2 or higher Strentgh joins the fray under your command you may draw a card.`,
			lore: `Hope descended on lily-white wings, just as the prophet foretold.`,
			img: this.card_img_dir + "/017_triumphant_hippogriff.png",
		};

		deck["w003"] = {
			name: "Shellring Guard",
			type: "creature",
			color: "white",
			cost: ["*", "*", "white"],
			power: 1,
			toughness: 1,
			text: "As the Shellring Guard enters the fray, give a +1/+1 counter to a creature of your choosing.",
			lore: `Scuffle breaks out? Blow the whistle. Garbage fire? Blow the whistle. Undead come crawling out from the grave? Blow that godsdamned whistle. -Lieutenant Felk`,
			img: this.card_img_dir + "/018_shellring_guard.png",
		};

		deck["w004"] = {
			name: "Shellring Official",
			type: "creature",
			color: "white",
			cost: ["*", "white"],
			power: 1,
			toughness: 2,
			text: `Lookout - 4 'white': Add a +1/+1 counter to Shellring Official.`,
			lore: `You'll never wear the crown, heretic. Not on my watch.`,
			img: this.card_img_dir + "/019_shellring_official.png",
		};

		deck["w005"] = {
			name: "Mastodon Rider",
			type: "creature",
			color: "white",
			cost: ["*", "*", "*", "*", "white"],
			power: 2,
			toughness: 3,
			text: `When Mastodon Rider joins the fray or is killed, chose a creature or vessel under your command to give a +1/+1 counter to.`,
			lore: `Find me a bigger horse. -Pickler the Troll King`,
			img: this.card_img_dir + "/020_mastodon_rider.png",
		};

		deck["w006"] = {
			name: "Haven Judicator",
			type: "creature",
			color: "white",
			cost: ["*", "*", "white"],
			power: 3,
			toughness: 2,
			properties: ["flying"],
			text: "Flight - When Haven Judicator joins the fray, you recover 1 life and may draw a card.",
			lore: `To serve the righteous, and cleanse the rest. -Judicator's Oath`,
			img: this.card_img_dir + "/021_haven_judicator.png",
		};

		deck["w007"] = {
			name: "Burned Walker",
			type: "instant",
			color: "white",
			cost: ["*", "*", "*", "white"],
			text: "Choose an attacking creature and destroy it.",
			lore: `It would take more than a few sips of water to quench Nero's thirst for revenge.`,
			img: this.card_img_dir + "/022_burned_walker.png",
		};

		deck["w008"] = {
			name: "Trickster Spirit",
			type: "creature",
			color: "white",
			cost: ["*", "*", "*", "*", "*", "white"],
			power: 2,
			toughness: 5,
			properties: ["flip"],
			text: "Order, Flip: Flip a creature.",
			lore: `You'd offer me your soul? But there's hardly any left." -Fanpetal, faerie courtesan`,
			img: this.card_img_dir + "/023_trickster_spirit.png",
		};

		deck["steppe"] = {
			name: "Steppe",
			type: "land",
			color: "white",
			img: this.card_img_dir + "/035_steppe.png",
		};


		deck['c001'] = {
			name: "Hollow Battlegear", 
			type: "artifact",
			color: "Colorless",
			cost: ['*','*','*'],
			power: 4,
			toughness: 3,
			properties: ['wariness'],
			text: `Text`,
			lore: `Make the wyrm hurt like hell if he swallows me."-Lydda Nightblade, to the royal armorer`,
			img: this.card_img_dir + "/031_hollow_battlegear.png",
	    };

		return deck;
	}



	returnRedDeck() {

	    var deck = {};

	    deck['r001'] = { 
		name: "Magic Cube",
		type: "instant",
		color: "red",
		cost: ['*','*','red']	,
		text: `Pick one of the following:`,
		lore: `One by one, the pretenders crumbled into rubble and dust.` ,
		img: this.card_img_dir + "/001_magic_cube.png",
	    }

	    deck['r002'] 	= { 
		name: "Unwavering Lighting", 
		type: "Instant",
		color: "red",
		cost: ['*','*','*','*','*','red'],
		text: `Unwavering Lighting inflicts 5 damage to a creature of your choosing and 2 damage to its Master. 
			The creature is banished, not destroyed, if it cannot endured the attack.` ,
		lore: `Begone, lichling. And give your master my regards.` ,
		img: this.card_img_dir + "/sample.png",
	    }

	    deck['r003'] 	= { 
		name: "Unformed Assassin", 
		type: "Creature - Human Rogue",
		color: "red",
		cost: ['*','*','*','*','red'],
		power: 4,
		toughness: 3,
		properties: ['Swiftness'],
		text: `Swiftness - When Unformed Assassin attacks alonside exactly 1 creature on the same turn, it will copy 
			that creature's strength and endurance becomes 4/3 for the rest of the turn.`,
		lore: `I like your style. Mind if I take it?`,
		img: this.card_img_dir + "/sample.png",
	    }

	    deck['r004'] 	= { 
		name: "Restless Flameband", 
		type: "Creature - Orc Berserker",
		color: "red",
		cost: ['*','*','*','*','*','red'],
		power: 5,
		toughness: 4,
		properties: ['Crush'],
		text: `Crush - Restless Flameband joins the fray with a +1/+1 counter on it if an opponent has received damage this turn.`,
		lore: `The flamebands only ever agree to do one thing: kill.`,
		img: this.card_img_dir + "/sample.png",
	    }

	    deck['r005'] 	= { 
		name: "Thisty Palemane", 
		type: "Creature - Kobold",
		color: "red",
		cost: ['*','*','red']	,
		power: 5,
		toughness: 4,
		//properties: ['Crush'],
		text: `3'red': Chose a creature. That creature can't block this turn.`,
		lore: `It won't hurt when they bleed you dry. But it won't be quick, either." - Oswyn Adal, monster hunter`,
		img: this.card_img_dir + "/sample.png",
	    }

	    deck['r006'] 	= { 
		name: "Tempest Ravager", 
		type: "Creature - Spirit",
		color: "red",
		cost: ['*','*','red']	,
		power: 3,
		toughness: 3,
		properties: ['Swiftness'],
		text: `Swiftness- Each time Tempest Ravager attacks, add +1/+1 to a creature under your command. Then Tempest Ravager deals damage to each opponent by the same number of modified creatures you control other than itself. (Equipment, Auras and counters are all valid modifications.)`,
		img: this.card_img_dir + "/sample.png",
	    }

	    deck['r007'] 	= { 
		name: "Outcast Palemane", 
		type: "Creature - Kobold Warrior",
		color: "red",
		cost: ['*','red']	,
		power: 1,
		toughness: 1,
		properties: ['Crush'],
		text: `As long as Outcast Palemane is attacking, it has Initiative. 2'red': Outcast Palemane gains +2/+0 for the rest of the turn.`,
		lore: `Hunger and hatred embodied. It's a small body, though.`,
		img: this.card_img_dir + "/sample.png",
	    }
	    deck['volcano'] 		= { 
		name: "Volcano",
		type: "land",
		color: "red",
		img: this.card_img_dir + "/sample.png"
	    }
	    deck['Duskwood Edge'] = { 
		name: "Duskwood Edge",
		type: "land",
		color: "red"&&"green",
		img: this.card_img_dir + "/sample.png"
	    }

	 	return deck;

	}


	returnGreenDeck() {

	    var deck = {};

	    deck['g001'] 	= { 
		name: "Leshy",
		type: "Creature - Fungus",
		color: "green",
		cost: ['*','green']	,
		power: 2,
		toughness: 1,
		properties: [],
		text: `If you control a permanent with a Soul value of 4 or higher, Leshy enters the fray with a +1/+1 counter.
		Every time you conjure a spell with a Soul value of 4 or higher, give a +1/+1 counter to Leshy.`,
		img: this.card_img_dir + "/008_leshy.png",
	    }
	
	    deck['g002'] 	= { 
		name: "Dormant Predator", 
		type: "Creature - Treant Spirit",
		color: "green",
		cost: ['*','*','*','*','*','green','green']		,
		power: 6,
		toughness: 6,
		properties: []	,
		text: `As Dormant Predator joins the fray, your life increases by the same amount as the highest 
			endurance among the creatures you have fielded.`,
		lore: `All the fury of the forest, fixed with a knowing mind and a hunger to grow.`,
		img: this.card_img_dir + "/sample.png",
	    }
	
	    deck['g003'] 	= { 
		name: "Dormant Wacher", 
		type: "Creature - Treant",
		color: "green",
		cost: ['*','*','*','green'],
		power: 2,
		toughness: 3,
		properties: ['Grasp']	,
		text: `Grasp - If Dormant Watcher blocks a creature with flight, add +2/+0 to Dormant Watcher until end of turn.`,
		lore: `The more of mankind it saw, the more there was to hate.`,
		img: this.card_img_dir + "/sample.png",
	    }

	    deck['g004'] 	= { 
		name: "Forest Dreamcatcher",
		type: "Enchantment",
		color: "green"	,
		cost: ['*','*','*','*','*','red']	,
		text: `Test Here`,
		img: this.card_img_dir + "/sample.png",
	    }

	    deck['g005'] 	= { 
		name: "Deadwood Ranger", 
		type: "Creature - Human Scout",
		color: "green",
		cost: ['*','*','green']			  		,
		power: 1,
		toughness: 1,
		properties: []	,
		text: `Test Here`,
		lore: `Come on, Risst. We'll follow this path to the end." -Oswyn Adal, monster hunter`,
		img: this.card_img_dir + "/sample.png",
	    }
	
	    deck['g006'] 	= { 
		name: "Dormant Sleeper", 
		type: "Creature - Treant",
		color: "green",
		cost: ['*','*','*','green'],
		power: 4,
		toughness: 4,
		properties: ['Wariness']	,
		text: `Test`,
		lore: `The leaves rustled softly, as if something massive slumbered just beneath the forest floor.`,
		img: this.card_img_dir + "/sample.png",
	    }
	    deck['g007'] 	= { 
		name: "Leshy Fruit", 
		type: "Creature - Fungus",
		color: "green",
		cost: ['*','*','*','green'],
		power: 3,
		toughness: 2,
		properties: []	,
		text: `When Leshy Fruit is killed, you may draw a card.`,
		lore: `Flowers blossomed from the corpses' slack-jawed mouths, and Leshy smiled at his garden's bountiful harvest.` ,
		img: this.card_img_dir + "/sample.png",
	    }
	    deck['g008'] 	= { 
		name: "Spider's Game", 
		type: "Instant",
		color: "green",
		cost: ['*','*','green'],
		properties: []	,
		text: `A creature of your choosing gains +3/+3 and the grasp effect for the rest of the turn. Unflip that creature.`,
		lore: `I'll help you, human. But not until I've had my fun. -Mother of Thousands` ,
		img: this.card_img_dir + "/sample.png",
	    }
	    deck['forest'] 		= { 
		name: "Forest",
		type: "land",
		color: "green",
		img: this.card_img_dir + "/sample.png"
	    }
	    deck['Duskwood Edge'] 		= { 
		name: "Duskwood Edge", 
		type: "land",
		color: "red" && "green",
		img: this.card_img_dir + "/sample.png"
	    }

	    return deck;

	}



}

module.exports = Realms;


