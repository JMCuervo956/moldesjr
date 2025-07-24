import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

const socket = io();
const video = document.getElementById('remoteVideo');
console.log('VIDEO ELEMENT:', video);

const peer = new RTCPeerConnection();

navigator.mediaDevices.getUserMedia({ video: true, audio: false })
  .then(stream => {
    video.srcObject = stream;
    stream.getTracks().forEach(track => {
      peer.addTrack(track, stream);
    });

    peer.createOffer()
      .then(offer => peer.setLocalDescription(offer))
      .then(() => {
        socket.emit('offer', peer.localDescription);
        console.log('🟡 Enviando offer al visor:', peer.localDescription);
        
      });
  });

peer.onicecandidate = event => {
  if (event.candidate) {
    socket.emit('candidate', event.candidate);
  }
};

socket.on('answer', async answer => {
  await peer.setRemoteDescription(answer);
});

socket.on('candidate', candidate => {
  peer.addIceCandidate(candidate);
});


