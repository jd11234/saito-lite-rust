
    ////////////////////////
    // Sudanese Civil War //
    ////////////////////////
    if (card == "sudan") {

      let target = 4;
      let opponent = "us";
      let success = 0;

      if (this.game.player == 2) { opponent = "ussr";  }

      var twilight_self = this;
      twilight_self.playerFinishedPlacingInfluence();

      twilight_self.game.queue.push("resolve\tsudan");

      let modifications = 0;

      for (let c of twilight_self.countries["sudan"].neighbours){
        if (twilight_self.isControlled(opponent, c) == 1) { modifications++; }
      }

      let die = twilight_self.rollDice(6);
      twilight_self.game.queue.push("NOTIFY\t"+player.toUpperCase()+` rolls: ${die}, adjusted: ${die-modifications}`);

      if (die >= (target + modifications)) {

	twilight_self.game.state.events.sudanese_civil_war = true;
        twilight_self.countries['sudan'].bg = 1;
        twilight_self.game.countries['sudan'].bg = 1;

        let influence_change = 0;
        if (player == "us") {
          influence_change = twilight_self.countries['sudan'].ussr;
        } else {
          influence_change = twilight_self.countries['sudan'].us;
        }
        if (influence_change > 0){
          twilight_self.placeInfluence("sudan", 2, player);
          twilight_self.removeInfluence("sudan", influence_change, opponent);
        } else {
          twilight_self.placeInfluence("sudan", 2, player);
	}
        twilight_self.game.queue.push(`milops\t${player}\t2`);
        twilight_self.game.queue.push(`war\t${card}\t${player}\t${die}\t${modifications}\t${player}\t${success}`);
            
      }
      return 1;
    }



