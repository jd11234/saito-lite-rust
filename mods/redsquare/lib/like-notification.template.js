const SaitoUser = require('./../../../lib/saito/new-ui/templates/saito-user.template');

module.exports = (app, mod, tx) => {

    let txmsg = tx.returnMessage();
    let txsig = "";
    if (txmsg.data?.sig) { txsig = txmsg.data.sig; }

    return `
       <div class="redsquare-item notification-item notification-item-${tx.transaction.sig} liked-tweet-${txsig}" data-id="${txsig}">
         ${SaitoUser(app, mod, tx.transaction.from[0].add, "<i class='fas fa-heart fa-notification'></i> <span class='notification-type'>liked your tweet</span>", new Date().getTime())}
         <div class="redsquare-item-contents" id="redsquare-item-contents-${tx.transaction.sig}" data-id="${tx.transaction.sig}">           
            <div class="tweet" id="tweet-${tx.transaction.sig}" data-id="${tx.transaction.sig}"></div>
         </div>
       </div>
    `;

}

