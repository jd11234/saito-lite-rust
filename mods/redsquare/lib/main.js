const RedSquareMainTemplate = require("./main.template");
const RedSquareAppspaceProfile = require("./appspace/profile");
const RedSquareAppspaceHome = require("./appspace/home");
const RedSquareAppspaceNotifications = require("./appspace/notifications");
const RedSquareAppspaceGames = require("./appspace/games");
const RedSquareAppspaceContacts = require("./appspace/contacts");
const SaitoLoader = require("../../../lib/saito/ui/saito-loader/saito-loader");

class RedSquareMain {

  constructor(app, mod, container = "") {

    this.app = app;
    this.mod = mod;
    this.container = container;
    this.name = "RedSquareMain";
    this.saito_loader = new SaitoLoader(app, mod, ".saito-main");     

    this.components = {};
    this.components['home'] = new RedSquareAppspaceHome(app, mod, ".saito-main");
    this.components['profile'] = new RedSquareAppspaceProfile(app, mod, ".saito-main");
    this.components['notifications'] = new RedSquareAppspaceNotifications(app, mod, ".saito-main");
    //this.components['contacts'] = new RedSquareAppspaceContacts(app, mod, ".saito-main");
    this.render_component = 'home';


    this.app.connection.on("redsquare-profile-render-request", (publickey) => {
      document.querySelector(".saito-main").innerHTML = "";
      this.render_component = 'profile';
      this.components[this.render_component].render(publickey);
      document.querySelector(".saito-sidebar.right").innerHTML = "";
      this.mod.sidebar.render();
    });

    this.app.connection.on("redsquare-home-render-request", (tx) => {
      document.querySelector(".saito-main").innerHTML = "";
      this.mod.viewing = "home";
      let rendered =  this.renderComponentFromHash();
      if (rendered) {
        this.mod.sidebar.render();
        return;
      } else {
        this.render_component = 'home';
        this.components[this.render_component].render();
        document.querySelector(".saito-sidebar.right").innerHTML = "";
        this.mod.sidebar.render();
      }
    });

    this.app.connection.on("redsquare-home-load-more-tweets-request", (tx) => {
      this.components[this.render_component].renderMoreTweets();
    });

    this.app.connection.on("redsquare-show-load-tweet-banner", (tx) => {
      let obj = document.querySelector('.redsquare-new-tweets-banner');
      if (obj) { obj.style.display = "block"; }
    });

    this.app.connection.on("redsquare-thread-render-request", (tweet) => {
      document.querySelector(".saito-main").innerHTML = "";
      this.render_component = 'home';
      this.mod.viewing = "thread";
      this.components[this.render_component].renderThread(tweet);
      document.querySelector(".saito-sidebar.right").innerHTML = "";
      this.mod.sidebar.render();
    });

    this.app.connection.on("redsquare-notifications-render-request", (tx) => {
      document.querySelector(".saito-main").innerHTML = "";
      this.render_component = 'notifications';
      this.components[this.render_component].render(this.app, this.mod);
      document.querySelector(".saito-sidebar.right").innerHTML = "";
      this.mod.sidebar.render();
       this.mod.notifications_last_viewed_ts = new Date().getTime();
      this.mod.notifications_number_unviewed = 0;
      this.mod.menu.incrementNotifications('notifications');
      this.mod.save();
    });

    this.app.connection.on("redsquare-contacts-render-request", (tx) => {
      document.querySelector(".saito-main").innerHTML = "";
      this.render_component = 'contacts';
      this.components[this.render_component].render();
      document.querySelector(".saito-sidebar.right").innerHTML = "";
      this.mod.sidebar.render();
    });

    //
    // this fires when a tweet is added to our tree
    //
    this.app.connection.on("redsquare-tweet-added-render-request", (tweet) => {

console.log("in redsquare tweet added render request...");
      
      if (this.render_component === "home") {
        if (tweet.updated_at < this.mod.tweets_last_viewed_ts) {

	  if (this.render_component === "home") {
	    if (!document.querySelector(".redsquare-appspace-body")) {
 	      this.components["home"].renderMain();             
	    }
	  }

          tweet.container = ".redsquare-appspace-body";
          tweet.render();

        } else {
         
          if (tweet.tx.transaction.from[0].add === this.app.wallet.returnPublicKey()) {
      	    tweet.container = ".redsquare-appspace-body";

            if (tweet.parent_id != "") {
              document.querySelector(".tweet-"+tweet.parent_id).remove();
              tweet.renderWithParentAsCritical();
            } else {
              tweet.render(true);
            }
            
      	  }

	}
      }
    });

  }

  render() {

    //
    // render framework for app
    //
    if (document.querySelector(".saito-container")) {
      this.app.browser.replaceElementBySelector(RedSquareMainTemplate(), ".saito-container");
    } else {
      this.app.browser.addElementToSelectorOrDom(RedSquareMainTemplate(), this.container);
    }

    //
    // first load? show loader
    //
    this.saito_loader.render();
    
 
  

    this.attachEvents();

  }

  attachEvents() {
    var scrollableElement = document.querySelector(".saito-container");
    var sidebar = document.querySelector(".saito-sidebar.right");
    var scrollTop = 0;
    var stop = 0;

    scrollableElement.addEventListener("scroll", (e) => {
      if (window.innerHeight - 150 < sidebar.clientHeight) {
        if (scrollTop < scrollableElement.scrollTop) {
          stop = window.innerHeight - sidebar.clientHeight + scrollableElement.scrollTop;
          if (scrollableElement.scrollTop + window.innerHeight > sidebar.clientHeight) {
try {
            sidebar.style.top = stop + "px";
} catch (err) {
  console.log("SIDEBAR ERROR 1");
}
          }
        } else {
          if (stop > scrollableElement.scrollTop) {
            stop = scrollableElement.scrollTop;
try {
            sidebar.style.top = stop + "px";
} catch (err) {
  console.log("SIDEBAR ERROR 2");
}
          }
        }
      } else {
        stop = scrollableElement.scrollTop;
try {
        sidebar.style.top = stop + "px";
} catch (err) {
  console.log("SIDEBAR ERROR 3");
}
      }
      scrollTop = scrollableElement.scrollTop;
    });



  }

  renderComponentFromHash(){

    var hash = new URL(document.URL).hash.split('#')[1];
    let component;
    let params;
    let render_component;
    let found = false;
    if (hash) {
      if (hash?.split("").includes("?")) {
        component = hash.split("?")[0];
        params = hash.split("?")[1];
      } else {
        component = hash;
      }
    }
    if (component) {
      if (this.components[component]) {
        this.render_component = component;
        document.querySelector(".saito-main").innerHTML = "";
        this.components[this.render_component].render();
        render_component = component;
        found = true;
      } else {
        this.app.modules.returnModulesRenderingInto(".saito-main").forEach((mod) => {
          if (mod.returnSlug() === component) {
            found = true;
            document.querySelector(".saito-main").innerHTML = "";
            mod.renderInto(".saito-main");
            document.querySelector('.saito-container').scroll({ top: 0, left: 0, behavior: 'smooth' });
            if (mod.canRenderInto(".saito-sidebar.right")) {
              document.querySelector(".saito-sidebar.right").innerHTML = "";
              mod.renderInto(".saito-sidebar.right");
            }
          }
        });
      }
    }

    return found;
  }

}

module.exports = RedSquareMain;

