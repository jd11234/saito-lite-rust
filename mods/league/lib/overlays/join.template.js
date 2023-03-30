module.exports = JoinLeagueTemplate = (app, mod, league) => {

	let game = league.game.toLowerCase();
	let pubKey = app.wallet.returnPublicKey();
	let key = app.keychain.returnKey({ publickey : pubKey });
	let user_email = key.email || "";

	let name = app.keychain.returnIdentifierByPublicKey(pubKey, true);
	if (name == pubKey){
		name = "Anonymous Player";
	}

	console.log(JSON.parse(JSON.stringify(league)));

	let html = `
	   <div class="league-join-overlay-box">
        <img src="/${game}/img/arcade/arcade.jpg" />
	`;

	/*let html = `
	   <div class="league-join-overlay-box">
      	  	<div class="join-overlay-header">
		  		<div class="game-image" style="background-image: url('/${game}/img/arcade/arcade.jpg')"></div>
		  		<div class="title-box">
			  		<div class="title">${league.name}</div>
			  		<div class="description">${league.game} League</div>
 	    		  	${app.browser.returnAddressHTML(league.admin)}
		  		</div>
	  		</div>
	  		<div class="league-join-info">
  	
	  		`;
	*/

  	if (league.rank >= 0) {

	  	return html + `
	        <div class="title-box">
		    	<div class="title">League Joined</div>
			</div>
			<div class="league-join-info">
				<p>Redirecting to League View in <span id="countdown">3</span>s...</p>
			</div>
	  	  	<div class="league-join-controls">
				<div class="saito-overlay-form-alt-opt">Click to redirect/div>
				<div></div>
			</div>
	    </div>
	   `;	  
  	
	} else {

		html += `
		    <div class="title-box">
		    	<div class="title">${league.name}</div>
			</div>
			<div class="league-join-info">
				<p>Click below to join this ${league.game} league as <span class="address">"${name}"</span>. If you already have an account on Saito, please login before joining. You can register a name/account later.</p>
			</div>
	  	  	<div class="league-join-controls">
				<div class="saito-overlay-form-alt-opt">Saito login</div>
	        	<button type="button" class="saito-button-primary fat" id="league-join-btn" data-id="${league.id}">JOIN LEAGUE</button>    
	      	</div>
	    </div>

	   `;

	}

	return html;

};

