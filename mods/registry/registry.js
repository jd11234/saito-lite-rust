const ModTemplate = require("./../../lib/templates/modtemplate");
const RegisterUsernameOverlay = require("./lib/register-username");
const PeerService = require("saito-js/lib/peer_service").default;

////////////////////////////////////////////////////////
//
// IMPORTANT CHANGES WASM  -- Daniel 28/07
//
// Fees are dropped because transaction no longer has returnPaymentTo() function
// 
// This is probably bad idea and should be fixed later
//
///////////////////////////////////////////////////////


class Registry extends ModTemplate {
  constructor(app) {
    super(app);

    this.app = app;
    this.name = "Registry";
    this.description =
      "Adds support for the Saito DNS system, so that users can register user-generated names. Runs DNS server on core nodes.";
    this.categories = "Core Utilities Messaging";

    //
    // master DNS publickey for this module
    this.registry_publickey = "zYCCXRZt2DyPD9UmxRfwFgLTNAqCd5VE8RuNneg4aNMK";

    //
    // we could save the cached keys here instead of inserting them
    // into our wallet / keychain ? perhaps that would be a much more
    // efficient way of handling things that stuffing the wallet with
    // the information of strangers....
    //
    this.cached_keys = {};

    //Set True for testing locally
    this.local_dev = false;

    //
    // event listeners -
    //
    this.app.connection.on("registry-fetch-identifiers-and-update-dom", async (keys) => {
      let unidentified_keys = [];

      for (let i = 0; i < keys.length; i++) {
        if (this.cached_keys[keys[i]]) {
          this.app.browser.updateAddressHTML(keys[i], this.cached_keys[keys[i]]);
        } else {
          unidentified_keys.push(keys[i]);
        }
      }
      let peers = await this.app.network.getPeers();
      for (let i = 0; i < peers.length; i++) {
        let peer = peers[i];
        if (peer.hasService("registry")) {
          this.fetchManyIdentifiers(unidentified_keys, peer, (answer) => {
            Object.entries(answer).forEach(([key, value]) => {
              if (value !== this.publicKey) {
                this.cached_keys[key] = value;

                //
                // We don't NEED or WANT to filter for key == wallet.getPublicKey
                // If the key is in our keychain, we obviously care enough that we
                // want to update that key in the keychain!
                //

                // save if locally stored
                if (this.app.keychain.returnKey(key)) {
                  this.app.keychain.addKey({ publicKey: key, identifier: value });
                }

                this.app.browser.updateAddressHTML(key, value);
              }
            });
          });

          //
          // save all keys queried to cache so even if we get nothing
          // back we won't query the server again for them.
          //
          for (let i = 0; i < unidentified_keys.length; i++) {
            if (!this.cached_keys[unidentified_keys[i]]) {
              this.cached_keys[unidentified_keys[i]] = unidentified_keys[i];
            }
          }
        }
      }
    });

    this.app.connection.on("register-username-or-login", (obj) => {
      let key = this.app.keychain.returnKey(this.publicKey);
      if (key?.has_registered_username) {
        return;
      }

      if (!this.register_username_overlay) {
        this.register_username_overlay = new RegisterUsernameOverlay(this.app, this);
      }
      if (obj?.success_callback) {
        this.register_username_overlay.callback = obj.success_callback;
      }
      this.register_username_overlay.render(obj?.msg);
    });

    return this;
  }

  async initialize(app) {
    await super.initialize(app);
  }

  returnServices() {
    let services = [];
    //
    // until other nodes are mirroring the DNS directory and capable of feeding out
    // responses to inbound requests for DNS queries, only services that are actually
    // registering domains should report they run the registry module.
    //
    if (this.app.BROWSER == 0) {
      //if (this.registry_publickey == this.publicKey) {
      services.push(new PeerService(null, "registry", "saito"));
    }
    return services;
  }

  //
  // fetching publicKeys from identifiers
  // --- not used anywhere, delete???
  //
  fetchManyPublicKeys(identifiers = [], peer = null, mycallback = null) {
    if (mycallback == null) {
      return;
    }

    const found_keys = [];
    const missing_keys = [];

    identifiers.forEach((identifier) => {
      let publickey = this.app.browser.getPublicKeyByIdentifier(identifier);
      if (publickey != "" && publickey != identifier) {
        found_keys.push[publickey] = identifier;
      } else {
        missing_keys.push(identifier);
      }
    });

    if (missing_keys.length == 0) {
      if (mycallback){
        mycallback(found_keys);  
      }
      return;
    }

    const where_statement = `identifier in (${missing_keys.join(",")})`;
    const sql = `select *
                 from records
                 where ${where_statement}`;

    this.sendPeerDatabaseRequestWithFilter(
      "Registry",

      sql,

      (res) => {
        try {
          if (!res.err) {            
            if (res?.rows?.length > 0) {
              res.rows.forEach((row) => {
                const { publickey, identifier, bid, bsh, lc } = row;
                if (!found_keys.includes(publickey)) {
                  found_keys[publickey] = identifier;
                }
              });
            }
          }
          mycallback(found_keys);
        } catch (err) {
          console.error(err);
        }
      },

      (p) => {
        if (peer) {
          if (p.publicKey == peer.publicKey) {
            return 1;
          }
        } else {
          if (p.hasService("registry")) {
            return 1;
          }
        }
        return 0;
      }
    );
  }

  //
  // fetching identifiers
  //
  fetchManyIdentifiers(publickeys = [], peer = null, mycallback = null) {
    if (mycallback == null) {
      return;
    }

    const found_keys = [];
    const missing_keys = [];

    publickeys.forEach((publickey) => {
      const identifier = this.app.keychain.returnIdentifierByPublicKey(publickey);
      if (identifier.length > 0) {
        found_keys[publickey] = identifier;
      } else {
        missing_keys.push(`'${publickey}'`);
      }
    });

    if (missing_keys.length == 0) {
      if (mycallback){
        mycallback(found_keys);        
      }
      return;
    }

    const where_statement = `publickey in (${missing_keys.join(",")})`;
    const sql = `select *
                 from records
                 where ${where_statement}`;

    this.sendPeerDatabaseRequestWithFilter(
      "Registry",

      sql,

       (res) => {
        try {
          if (!res.err) {            
            if (res?.rows?.length > 0) {
              res.rows.forEach((row) => {
                const { publickey, identifier, bid, bsh, lc } = row;
                if (!found_keys.includes(publickey)) {
                  found_keys[publickey] = identifier;
                }
              });
            }
          }
          mycallback(found_keys);
        } catch (err) {
          console.error(err);
        }
      },

      (p) => {
        if (peer){
          if (p.publicKey == peer.publicKey) {
            return 1;
          }          
        } else {
          if (p.hasService("registry")) {
            return 1;
          }
        }
        return 0;
      }
   );
  }

  fetchIdentifier(publickey, peer = null, mycallback = null) {
    if (mycallback == null) {
      return;
    }

    this.sendPeerDatabaseRequestWithFilter(
      "Registry",

      'SELECT * FROM records WHERE publickey = "' + publickey + '"',

      (res) => {
        let rows = [];

        if (res.rows == undefined) {
          mycallback(rows);
        }
        if (res.err) {
          mycallback(rows);
        }
        if (res.rows == undefined) {
          mycallback(rows);
        }
        if (res.rows.length == 0) {
          mycallback(rows);
        }
        rows = res.rows.map((row) => {
          const { publickey, identifier, bid, bsh, lc } = row;

          // keep track that we fetched this already
          this.cached_keys[publickey] = identifier;
          if (!found_keys.includes(publickey)) {
            found_keys[publickey] = identifier;
          }
        });
        mycallback(found_keys);
      },

      (p) => {
        if (peer){
          if (p.publicKey == peer.publicKey) {
            return 1;
          }          
        }else{
          if (p.hasService("registry")){
            return 1;
          }
        }
        return 0;
      }
    );
  }

  respondTo(type = "") {
    if (type == "saito-return-key") {
      return {
        returnKey: (data = null) => {
          //
          // data might be a publickey, permit flexibility
          // in how this is called by pushing it into a
          // suitable object for searching
          //
          if (typeof data === "string") {
            let d = { publickey: "" };
            d.publickey = data;
            data = d;
          }

          //
          // if keys exist
          //
          for (let key in this.cached_keys) {
            if (key === data.publickey) {
              if (this.cached_keys[key] && key !== this.cached_keys[key]) {
                return { publickey: key, identifier: this.cached_keys[key] };
              } else {
                return { publickey: key };
              }
            }
          }

          return null;
        },
      };
    }

    return super.respondTo(type);
  }

  async handlePeerTransaction(app, tx = null, peer, mycallback) {
    if (tx == null) {
      return;
    }
    let message = tx.returnMessage();

    //
    // this code doubles onConfirmation
    //
    if (message.request === "registry username update") {
      let tx = message?.data?.tx;

      //
      // registration from DNS registrar?
      //
      let identifier = tx.msg.identifier;
      let signed_message = tx.msg.signed_message;
      let sig = tx.msg.signature;

      try {
        if (
          this.app.crypto.verifyMessage(
            signed_message,
            sig,
            this.registry_publickey
          )
        ) {
          this.app.keychain.addKey(tx.to[0].publicKey, {
            identifier: identifier,
            watched: true,
            block_id: this.app.blockchain.returnLatestBlockId(),
            block_hash: this.app.blockchain.returnLatestBlockHash(),
            lc: 1,
          });
          this.app.browser.updateAddressHTML(tx.to[0].publicKey, identifier);
        } else {
          console.debug("failed verifying message for username registration : ", tx);
        }
      } catch (err) {
        console.error("ERROR verifying username registration message: ", err);
      }
    }

    await super.handlePeerTransaction(app, tx, peer, mycallback);
  }

  async notifyPeers(app, tx) {
    let peers = await app.network.getPeers();
    for (let i = 0; i < peers.length; i++) {
      if (peers[i].synctype == "lite") {
        //
        // fwd tx to peer
        //
        let message = {};
        message.request = "registry username update";
        message.data = {};
        message.data.tx = tx;

        await app.network.sendRequest(message.request, message.data, peers[i]);
      }
    }
  }

  async tryRegisterIdentifier(identifier, domain = "@saito") {

    let newtx = await this.app.wallet.createUnsignedTransactionWithDefaultFee(this.publicKey);
    if (!newtx) {
      console.log("NULL TX CREATED IN REGISTRY MODULE");
      throw Error("NULL TX CREATED IN REGISTRY MODULE");
    }


    if (typeof identifier === "string" || identifier instanceof String) {
      var regex = /^[0-9A-Za-z]+$/;
      if (!regex.test(identifier)) {
        throw Error("Alphanumeric Characters only");
      }
      newtx.msg.module = "Registry";
      //newtx.msg.request	= "register";
      newtx.msg.identifier = identifier + domain;

      newtx.addTo(this.registry_publickey);

      await newtx.sign();
      await this.app.network.propagateTransaction(newtx);

      // sucessful send
      return true;
    } else {
      throw TypeError("identifier must be a string");
    }
  }

  onPeerServiceUp(app, peer, service = {}) {}

  async onPeerHandshakeComplete(app, peer) {
    /***** USE VARIABLE TO TOGGLE LOCAL DEV MODE ******/
    if (this.local_dev) {
      if (this.app.options.server != undefined) {
        this.registry_publickey = this.publicKey;
      } else {
        this.registry_publickey = peer.publicKey;
      }
      console.log("WE ARE NOW LOCAL SERVER: " + this.registry_publickey);
    }
  }

  async onConfirmation(blk, tx, conf) {
    let txmsg = tx.returnMessage();

    if (conf == 0) {
      

      if (!!txmsg && txmsg.module === "Registry") {

        //
        // this is to us, and we are the main registry server
        //
        if (tx.isTo(this.publicKey) && this.publicKey === this.registry_publickey) {
          let identifier = txmsg.identifier;
          let publickey = tx.from[0].publicKey;
          let unixtime = new Date().getTime();
          let bid = blk.id;
          let bsh = blk.hash;
          let lock_block = 0;
          let signed_message = identifier + publickey + bid + bsh;
          let sig = this.app.crypto.signMessage(signed_message, await this.app.wallet.getPrivateKey());
          //this.app.wallet.signMessage(signed_message);
          let signer = this.registry_publickey;
          let lc = 1;

          // servers update database
          let res = await this.addRecord(
            identifier,
            publickey,
            unixtime,
            bid,
            bsh,
            lock_block,
            sig,
            signer,
            1
          );
          let fee = BigInt(0); //tx.returnPaymentTo(this.publicKey);

          // send message
          if (res == 1) {
            let newtx = await this.app.wallet.createUnsignedTransaction(
              tx.from[0].publicKey,
              BigInt(0),
              fee
            );
            newtx.msg.module = "Email";
            newtx.msg.origin = "Registry";
            newtx.msg.title = "Address Registration Success!";
            newtx.msg.message =
              "<p>You have successfully registered the identifier: <span class='boldred'>" +
              identifier +
              "</span></p>";
            newtx.msg.identifier = identifier;
            newtx.msg.signed_message = signed_message;
            newtx.msg.signature = sig;

            await newtx.sign();
            await this.app.network.propagateTransaction(newtx);
          } else {
            let newtx = await this.app.wallet.createUnsignedTransaction(
              tx.from[0].publicKey,
              BigInt(0),
              fee
            );
            newtx.msg.module = "Email";
            newtx.msg.title = "Address Registration Failed!";
            newtx.msg.message =
              "<p>The identifier you requested (<span class='boldred'>" +
              identifier +
              "</span>) has already been registered.</p>";
            newtx.msg.identifier = identifier;
            newtx.msg.signed_message = "";
            newtx.msg.signature = "";

            await newtx.sign();
            await this.app.network.propagateTransaction(newtx);
          }

          return;
        }
      }

      if (!!txmsg && txmsg.module == "Email") {
        if (tx.from[0].publicKey == this.registry_publickey) {
          if (tx.to[0].publicKey == this.publicKey) {
            if (
              tx.msg.identifier != undefined &&
              tx.msg.signed_message != undefined &&
              tx.msg.signature != undefined
            ) {
              //
              // am email? for us? from the DNS registrar?
              //
              let identifier = tx.msg.identifier;
              let signed_message = tx.msg.signed_message;
              let sig = tx.msg.signature;

              try {
                if (
                  this.app.crypto.verifyMessage(
                    signed_message,
                    sig,
                    this.registry_publickey
                  )
                ) {
                  this.app.keychain.addKey(tx.to[0].publicKey, {
                    identifier: identifier,
                    watched: true,
                    block_id: blk.id,
                    block_hash: blk.hash,
                    lc: 1,
                  });
                  console.info("verification success for : " + identifier);
                } else {
                  this.app.keychain.addKey(tx.to[0].publicKey, {
                    has_registered_username: false,
                  });
                  console.debug("verification failed for sig : ", tx);
                }
                this.app.browser.updateAddressHTML(tx.to[0].publicKey, identifier);
                this.app.connection.emit("update_identifier", tx.to[0].publicKey);
              } catch (err) {
                console.error("ERROR verifying username registration message: ", err);
              }
            }
          } else {
            if (this.publicKey != this.registry_publickey) {
              //
              // am email? for us? from the DNS registrar?
              //
              let identifier = tx.msg.identifier;
              let signed_message = tx.msg.signed_message;
              let sig = tx.msg.signature;

              // if i am server, save copy of record
              await this.addRecord(
                identifier,
                tx.to[0].publicKey,
                tx.timestamp,
                blk.id,
                blk.hash,
                0,
                sig,
                this.registry_publickey
              );

              // if i am a server, i will notify lite-peers of
              await this.notifyPeers(this.app, tx);
            }
          }
        }
      }
    }
  }

  async addRecord(
    identifier = "",
    publickey = "",
    unixtime = 0,
    bid = 0,
    bsh = "",
    lock_block = 0,
    sig = "",
    signer = "",
    lc = 1
  ) {

    let sql = `INSERT INTO records (identifier,
                                    publickey,
                                    unixtime,
                                    bid,
                                    bsh,
                                    lock_block,
                                    sig,
                                    signer,
                                    lc)
               VALUES ($identifier,
                       $publickey,
                       $unixtime,
                       $bid,
                       $bsh,
                       $lock_block,
                       $sig,
                       $signer,
                       $lc)`;
    let params = {
      $identifier: identifier,
      $publickey: publickey,
      $unixtime: unixtime,
      $bid: Number(bid),
      $bsh: bsh,
      $lock_block: lock_block,
      $sig: sig,
      $signer: signer,
      $lc: lc,
    };
      
    let res = await this.app.storage.executeDatabase(sql, params, "registry");

    return res?.stmt?.changes;
  }

  async onChainReorganization(bid, bsh, lc) {
    var sql = "UPDATE records SET lc = $lc WHERE bid = $bid AND bsh = $bsh";
    var params = { $bid: bid, $bsh: bsh };
    await this.app.storage.executeDatabase(sql, params, "registry");
    return;
  }

  shouldAffixCallbackToModule(modname) {
    if (modname == this.name) {
      return 1;
    }
    if (modname == "Email") {
      return 1;
    }
    return 0;
  }
}

module.exports = Registry;
