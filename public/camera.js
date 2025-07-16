// Módulo ES6
const startCamera = async () => {
  try {
    const videoElement = document.getElementById('video');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    videoElement.srcObject = stream;
  } catch (error) {
    console.error('Error al acceder a la cámara:', error);
  }
};

startCamera();