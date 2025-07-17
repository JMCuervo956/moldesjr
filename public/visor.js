import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

const socket = io();
const video = document.getElementById('remoteVideo');
const peer = new RTCPeerConnection();

peer.ontrack = event => {
  video.srcObject = event.streams[0];
};

socket.on('offer', async offer => {
  console.log('🟡 Recibido offer del emisor');
  await peer.setRemoteDescription(offer);
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  socket.emit('answer', peer.localDescription);
  console.log('🟢 Enviando answer de vuelta');
});

socket.on('candidate', candidate => {
  peer.addIceCandidate(candidate);
});

peer.onicecandidate = event => {
  if (event.candidate) {
    socket.emit('candidate', event.candidate);
  }
};
