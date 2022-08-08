

    //
    // OAS
    //
    if (card == "oas") {

      if (this.game.player == 1) {
        return 0;
      }
      if (this.game.player == 2) {
        //If the event card has a UI component, run the clock for the player we are waiting on
        this.startClock();

        var twilight_self = this;
        twilight_self.playerFinishedPlacingInfluence();

        var ops_to_place = 2;

        twilight_self.addMove("resolve\toas");

        this.updateStatus("<div class='status-message' id='status-message'>US places two influence in Central or South America</div>");
        for (var i in this.countries) {
          if (this.countries[i].region == "samerica" || this.countries[i].region == "camerica"){
            this.countries[i].place = 1;
            $("#"+i).addClass("westerneurope");
          }
        }

          //if (i == "venezuela" || i == "colombia" || i == "ecuador" || i == "peru" || i == "chile" || i == "bolivia" || i == "argentina" || i == "paraguay" || i == "uruguay" || i == "brazil" || i == "mexico" || i == "guatemala" || i == "elsalvador" || i == "honduras" || i == "nicaragua" || i == "costarica" || i == "panama" || i == "cuba" || i == "haiti" || i == "dominicanrepublic") {

          $(".westerneurope").off();
          $(".westerneurope").on('click', function() {
            let countryname = $(this).attr('id');
            if (twilight_self.countries[countryname].place == 1) {
                twilight_self.addMove("place\tus\tus\t"+countryname+"\t1");
                twilight_self.placeInfluence(countryname, 1, "us");
              } else {
                twilight_self.displayModal("you cannot place there...");
              }
          
              ops_to_place--;
              if (ops_to_place == 0) {
                twilight_self.playerFinishedPlacingInfluence();
                twilight_self.endTurn();
              }
                
            });
          
        
        return 0;
      }
    }



