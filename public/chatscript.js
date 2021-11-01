const socket = io('/');
const partcipantList = document.getElementById('participants__list');

var peer = new Peer(undefined, {
    path: "/peerjs",
    host: '/',
    port: '3000'
});
const zeroPad = (num, places) => String(num).padStart(places, '0')
const peers = {}
peer.on('call', call => {
    call.answer(stream)
})
socket.on("user-connected", (userId) => {
    setTimeout(function () {
      connectToNewUser(userId, stream);
    }, 1000);
});
let text = $("input");
$('html').keydown(function (e) {
if (e.which == 13 && text.val().length !== 0) {
    console.log(text.val())
    const msgg = {
      message: text.val(),
      sentBy: uName
    }
    socket.emit('message', msgg);
    text.val('')
  }
});
    socket.on("createMessage", (message) => {
      console.log(message);
      const msgDate = new Date();
      const zeroPad = (num, places) => String(num).padStart(places, '0')
      console.log(msgDate)
      const msgT = `${zeroPad(msgDate.getHours(), 2)}:${zeroPad(msgDate.getMinutes(),2)}`
      const msgD = `${zeroPad(msgDate.getDate(), 2)}/${zeroPad(msgDate.getMonth(), 2)}/${zeroPad(msgDate.getFullYear(), 4)}`
      const msgHTML = `<li class="message d-flex align-items-center justify-content-between mb-1">
                          <small><b>${message.sentBy}</b></small>
                          <small class="small font-weight-bold">
                            ${msgT}
                          </small>
                       </li>
                       <li  class="message align-items-center  mb-1">
                          <small>${message.message}</small>
                       </li>`;
      $(".messages").append(msgHTML);
        scrollToBottom()
    })

socket.on('user-disconnected', userId => {
    if (peers[userId])
        peers[userId].close()
  })
peer.on('open', id => {
    console.log(id);
    socket.emit('join-room', ROOM_ID, id);
})


const scrollToBottom = () => {
    var d = $('.main__chat_window');
    d.scrollTop(d.prop("scrollHeight"));
}
  
scrollToBottom()