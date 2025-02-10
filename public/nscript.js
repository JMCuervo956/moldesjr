let timer;
let timeLeft = localStorage.getItem('timeLeft') ? parseInt(localStorage.getItem('timeLeft')) : 15; // Tiempo cargado desde localStorage o 15 si es la primera vez

// Función para actualizar el cronómetro
function updateTimer() {
  const timerElement = document.getElementById('timer');
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Guardar el tiempo restante en localStorage
  localStorage.setItem('timeLeft', timeLeft);

  if (timeLeft <= 0) {
    clearInterval(timer);
    //alert("Se acabó el tiempo para responder.....");
    // Deshabilitar el botón de envío
    document.querySelector('input[type="submit"]').disabled = true;
    
    // Deshabilitar los botones de radio (opciones de respuesta)
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(button => {
      button.disabled = true; // Deshabilitar cada botón de radio
    });
  } else {
    timeLeft--;
  }
}

// Iniciar el cronómetro solo si el tiempo restante es mayor que 0
if (timeLeft > 0) {
  timer = setInterval(updateTimer, 1000);
} else {
  // Si el tiempo ya es 0, reiniciar a 15 segundos automáticamente
  ///resetTimer();
}

// Función para reiniciar el cronómetro a 15 segundos
function resetTimer() {
  timeLeft = 15; // Resetear a 15 segundos
  localStorage.setItem('timeLeft', timeLeft); // Guardar en localStorage
  clearInterval(timer); // Detener cualquier cronómetro en curso
  timer = setInterval(updateTimer, 1000); // Iniciar el cronómetro desde 15 segundos
}

// Lógica para enviar la respuesta
document.getElementById('registerForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const answer = document.querySelector('input[name="preguntas"]:checked'); // Obtener la respuesta seleccionada
  if (answer) {
//    alert('¡Respuesta enviada!');
  } else {
    alert('Por favor, selecciona una respuesta.');
  }

  // Detener el cronómetro y deshabilitar el formulario
  clearInterval(timer);
  document.querySelector('input[type="submit"]').disabled = true;
  const radioButtons = document.querySelectorAll('input[type="radio"]');
  radioButtons.forEach(button => {
    button.disabled = true;
  });


  // Resetear el tiempo después de enviar la respuesta
//             resetTimer(); // Reiniciar el cronómetro a 15 segundos después de enviar la respuesta
});

/*
// Esto también asegura que, si el tiempo se acaba, se resetee a 15 segundos si recargamos la página
window.addEventListener('load', function() {
  if (timeLeft <= 0) {
    resetTimer(); // Reiniciar a 15 segundos si el tiempo es 0
  }
});
*/