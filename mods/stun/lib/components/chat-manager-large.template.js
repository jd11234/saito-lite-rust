const ChatManagerLargeTemplate = (call_type, room_code, mode) => {
  let add_user =
    room_code && mode === "full"
      ? `<span class="add_users_container">
  <i class=" add_users fa fa-plus" > </i>
</span>`
      : "";

  let chat_control =
    mode === "full"
      ? `    <span class="chat_control_container">
  <i class="chat_control fa-regular fa-comments"></i>
</span>`
      : "";

  return `
    <div class="stunx-chatbox" id="stunx-chatbox">
      <main>
        <section class="large-wrapper">
        <div class="video-container-large">
        <div class="expanded-video">

        </div>
        <div class="side-videos">
        </div>
    </div>
        </section>

        <section class="footer">

        <div class="control-panel">
           <div class="timer"  style="opacity: ${mode === "full" ? 1: 0}" >
        <p class="counter"> 00.00 </p>

        <div class="users-on-call"  style="opacity: ${mode === "full" ? 1: 0}" >
            <div class="image-list">
                
            </div>
            <p > <span class="users-on-call-count">1</span> on call </p>
        </div>
    </div>

   <div class="control-list">
          ${add_user}
          ${chat_control}    
           <span class="audio-control">
            <i class=" fa fa-microphone" > </i>
            </span>
            <span class="video-control"  style=" background-color: ${
              call_type === "audio" ? "grey" : "white"
            }">
            <i  style=" cursor :${call_type === "audio" ? "none" : "pointer"}; color:${
    call_type === "audio" ? "black" : "green"
  }" class="  fas fa-video"> </i>
            </span>
            <span class="disconnect-control">
            <i class="disconnect_btn  fas fa-phone"> </i>
            </span>
        </div>
    </div>
        </section>
      </main>

    <div class="minimizer">
    <i class=" fas fa-caret-down"></i>
    </div>
    </div>`;
};

module.exports = ChatManagerLargeTemplate;

{
  /* <div class="box">
<button class="b-btngrid">2h5dt6dd678s..</button>
</div>
<div class="box">
<button class="b-btngrid">2h5dt6dd678s..</button>
</div> */
}

// <i class="audio-control fa fa-microphone-slash" aria-hidden="true"></i>

// <video id="localStream" muted="true"  class="box" style="display: block" autoplay>
//       <button class="b-btngrid">2h5dt6dd678s..</button>
//     </video>
//     <video id="remoteStream1"   autoplay class="box">
//       <button class="b-btngrid">2h5dt6dd678s..</button>
//     </video>
//     <video id="remoteStream2"   autoplay class="box">
//       <button class="b-btngrid">2h5dt6dd678s..</button>
//     </video>
//     <video id="remoteStream3"    autoplay class="box">
//       <button class="b-btngrid">2h5dt6dd678s..</button>
//     </video>
//     <video id="remoteStream4" style="display: none"   autoplay class="box">
//       <button class="b-btngrid">2h5dt6dd678s..</button>
//     </video>

// <span> <i class="fas fa-chalkboard effects-control"></i> </span>
