const RedSquareMenuTemplate = require("./menu.template");

class RedSquareMenu {

  constructor(app) {
    this.name = "RedSquareMenu";
  }

  render(app, mod, container="") {

    if (!document.querySelector(".redsquare-menu")) {
      app.browser.addElementToClass(RedSquareMenuTemplate(app, mod), container);
    }

    this.attachEvents(app, mod);

  }

  attachEvents(app, mod) {

    let obj = document.querySelector('.redsquare-menu-invites');
    obj.onclick = (e) => {
      document.querySelector(".email-appspace").innerHTML = "";
      let invites_self = app.modules.returnModule("Invites");
      invites_self.respondTo("email-appspace").render(invites_self.app, invites_self);
    }

  } 

}

module.exports = RedSquareMenu;


