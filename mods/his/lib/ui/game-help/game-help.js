const GameHelpTemplate = require('./game-help.template');
const SaitoOverlay = require('./../../../../../lib/saito/ui/saito-overlay/saito-overlay');

/**
 * GameHelp is a small triangle that will show up on the bottom-left of the 
 * screen and toggle an overlay that can be filled with customized advice
 * when the user clicks on it.
 */
class GameHelp {

	/**
	 * @param app - the Saito application
	 * @param mod - reference to the game module
	 */
	constructor(app, mod) {
		this.app = app;
		this.game_mod = mod;
                this.overlay = new SaitoOverlay(this.app, this.game_mod);
		this.enabled = true;

		if (app.options) {
		  if (app.options.gameprefs) {
		    if (app.options.gameprefs.his_expert_mode) {
		      if (app.options.gameprefs.his_expert_mode == 1) {
			this.enabled = false;
		      }
		    }
		  }
		}
	}

	hide() {
	  if (this.enabled != true) { return; }

	  let gh = document.querySelector(".game-help");
	  if (gh) {
	    gh.classList.remove("game-help-visible");
	    gh.classList.add("game-help-hidden");
	  }
	}

	render(t=null, targs={}, line1="learn", line2="to play", fontsize="2.1rem") {

	  if (this.enabled != true) { return; }

		let gh = document.querySelector(".game-help");
		if (gh) {
			document.querySelector(".game-help-text .line1").innerHTML = line1;
			document.querySelector(".game-help-text .line2").innerHTML = line2;
			gh.classList.remove("game-help-hidden");
			gh.classList.add("game-help-visible");
		} else {
			this.app.browser.addElementToDom(GameHelpTemplate(line1, line2));
			document.querySelector(".game-help-text").style.fontSize = fontsize;
		}
		this.attachEvents(t, targs);
	}

	attachEvents(t=null, targs={}) {

	  let gh = document.querySelector(".game-help");
	  gh.onclick = (e) => {
	    if (t != null) { this.overlay.show(t(targs)); }
	    this.toggle();
	  }
	

	}

	toggle() {
	  let gh = document.querySelector(".game-help");
	  if (!gh.classList.contains("game-help-hidden")) {
	    this.hide();
	  } else {
	    this.render();
	  }
	}

}

module.exports = GameHelp;

