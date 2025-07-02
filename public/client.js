
// src/client.js
document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('join-meet-button');
    
    if (button) {
        button.addEventListener('click', () => {
            alert("El botón fue clicado."); // Para verificar si el clic se registra
        });
        
    } else {
        console.error("El botón no se encontró.");
    }
});