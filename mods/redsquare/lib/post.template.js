const SaitoUserTemplate = require('./../../../lib/saito/new-ui/templates/saito-user.template');


module.exports = (app, mod, publickey, parent_id = "", thread_id = "") => {

  return `

    ${SaitoUserTemplate(app, mod, publickey, "create a text-tweet or drag-and-drop images...")}

    <textarea rows="7" class="post-tweet-textarea" name="post-tweet-textarea" id="post-tweet-textarea" placeholder="What's happening" cols="60"></textarea>

    <div id="redsquare-post-tweet-image-upload" class="post-tweet-image-upload">
      <div class="post-tweet-image-upload-content">
        <i class="fa-solid fa-image"></i>
        <div>
          <p id="post-tweet-select-image">Drop, Past or Browse for images</p>
          <p id="post-tweet-supports">Supports JPG, JPEG, PNG</p>
        </div>
      </div>
    </div>

    <input type="hidden" id="parent_id" name="parent_id" value="${parent_id}" />
    <input type="hidden" id="thread_id" name="thread_id" value="${thread_id}" />

    <div id="post-tweet-img-preview-container"></div>

    <div class="saito-button-primary post-tweet-button" id="post-tweet-button"> Tweet </div>
    <div style="clear:both"></div>

    <section id="post-tweet-loader" class="post-tweet-loader">
      <span class="loading__anim"></span>
    </section>
        

  `;

}

