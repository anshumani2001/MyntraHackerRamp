const socket = io('/');
const partcipantList = document.getElementById('participants__list');
let tUserId;
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
      let msgHTML
      console.log(message.userId)
      if (message.userId == tUserId) {
          msgHTML = `<li class="chat-right">
          <div class="chat-hour" style="font-size: large;">${msgT}</div>
          <div class="chat-text" style="font-size: large;">${message.message}</div>
          <div class="chat-avatar">
          <!-- <img src="https://www.bootdey.com/img/Content/avatar/avatar3.png" alt="Retail Admin"> -->
          <div class="chat-name" style="font-size: large;">${message.sentBy}</div>
          </div>
       </li> `
      } else {
        msgHTML = `<li class="chat-left">
                       <div class="chat-avatar">
                       <!-- <img src="https://www.bootdey.com/img/Content/avatar/avatar3.png" alt="Retail Admin"> -->
                       <div class="chat-name" style="font-size: large;">${message.sentBy}</div>
                       </div>
                       <div class="chat-text" style="font-size: large;">${message.message}</div>
                       <div class="chat-hour" style="font-size: large;">${msgT}</div>
                    </li> `;
      }
      $(".messages").append(msgHTML);
        scrollToBottom()
    })

socket.on('user-disconnected', userId => {
    if (peers[userId])
        peers[userId].close()
  })
peer.on('open', id => {
  tUserId = id;
    console.log(id);
    socket.emit('join-room', ROOM_ID, id);
})


const scrollToBottom = () => {
    var d = $('.main__chat_window');
    d.scrollTop(d.prop("scrollHeight"));
}
console.log(thisuser)
scrollToBottom()