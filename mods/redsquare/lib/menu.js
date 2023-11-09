const RedSquareMenuTemplate = require("./menu.template");
const Post = require("./post");

class RedSquareMenu {
  constructor(app, mod, container = "") {
    this.app = app;
    this.mod = mod;
    this.container = container;
    this.name = "RedSquareMenu";
    this.increments = 0;
  }

  render() {
    //
    // replace element or insert into page
    //
    if (document.querySelector(".redsquare-menu")) {
      this.app.browser.replaceElementBySelector(
        RedSquareMenuTemplate(this.app, this.mod),
        ".redsquare-menu"
      );
    } else {
      this.app.browser.addElementToSelector(
        RedSquareMenuTemplate(this.app, this.mod),
        this.container
      );
    }

    //
    // appspace modules
    //
    this.app.modules.returnModulesRenderingInto(".saito-main").forEach((mod) => {
      if (!document.querySelector(`.redsquare-menu-${mod.returnSlug()}`)) {
        this.app.browser.addElementToSelector(
          `<li class="redsquare-menu-${mod.returnSlug()}">
            <i class="${mod.icon}"></i>
            <span>${mod.returnName()}</span>
          </li>`,
          ".saito-menu-list"
        );
      }
    });

    this.attachEvents();
  }

  attachEvents() {
    this_self = this;

    document.getElementById("new-tweet").onclick = (e) => {
      let post = new Post(this.app, this.mod);
      post.render();
    };

    if (document.getElementById("mobile-new-tweet") != null) {
      document.getElementById("mobile-new-tweet").onclick = (e) => {
        let post = new Post(this.app, this.mod);
        post.render();
      };
    }

    document.querySelector(".redsquare-menu-home").onclick = (e) => {
      window.history.pushState({}, document.title, "/" + this.mod.slug);
      history.replaceState(null, null, ' ');
      this.app.connection.emit("redsquare-home-render-request");

      //
      // show loading new content message
      //
      this.app.connection.emit("redsquare-insert-loading-message");

      //
      // and load any NEW tweets at the top
      //
      this.mod.loadTweets('later', (tx_count) => {
        this.app.connection.emit("redsquare-home-postcache-render-request", tx_count);
      });   

    }

    document.querySelector(".redsquare-menu-notifications").onclick = (e) => {
      window.history.pushState({}, document.title, "/" + this.mod.slug);
      window.location.hash = "#notifications";
      this.app.connection.emit("redsquare-notifications-render-request");
    };

    document.querySelector(".redsquare-menu-profile").onclick = (e) => {
      window.history.pushState({}, document.title, "/" + this.mod.slug);
      window.location.hash = "#profile";
      this.app.connection.emit("redsquare-profile-render-request", this.mod.publicKey);
    };

    //
    // appspace modules
    //
    this.app.modules.returnModulesRenderingInto(".saito-main").forEach((mod) => {
      document.querySelector(`.redsquare-menu-${mod.returnSlug()}`).onclick = (e) => {
        setHash(mod.returnSlug());
        document.querySelector(".saito-main").innerHTML = "";
        mod.renderInto(".saito-main");
        document.querySelector(".saito-container").scroll({ top: 0, left: 0, behavior: "smooth" });
        if (mod.canRenderInto(".saito-sidebar.right")) {
          document.querySelector(".saito-sidebar.right").innerHTML = "";
          mod.renderInto(".saito-sidebar.right");
        }
      };
    });
  }

  incrementNotifications(menu_item, notifications = -1) {

    let qs = `.redsquare-menu-${menu_item}`;

    if (notifications < this.increments && notifications != -1) { notifications = this.increments; }

    if (document.querySelector(qs)) {
      qs = `.redsquare-menu-${menu_item} > .saito-notification-dot`;
      let obj = document.querySelector(qs);
      if (!obj) {
        if (notifications > 0) {
          this.app.browser.addElementToSelector(
            `<div class="saito-notification-dot">${notifications}</div>`,
            `.redsquare-menu-${menu_item}`
          );
        } else {
          this.app.browser.addElementToSelector(
            `<div class="saito-notification-dot"></div>`,
            `.redsquare-menu-${menu_item}`
          );
          qs = `.redsquare-menu-${menu_item} > .saito-notification-dot`;
          let obj = document.querySelector(qs);
          obj.style.display = "none";
        }
      } else {
        let existing_notifications = 0;
        if (obj.innerHTML) {
          existing_notifications = parseInt(obj.innerHTML);
        }
        if (notifications <= 0) {
          obj.style.display = "none";
          obj.innerHTML = 0;
        } else {
          obj.style.display = "flex";
          existing_notifications++;
          obj.innerHTML = existing_notifications;
        }
      }
    }
  }
}

module.exports = RedSquareMenu;

