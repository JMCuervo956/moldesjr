document.getElementById('uploadForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) {
        alert('Por favor, selecciona un archivo.');
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('upload.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        if (response.ok) {
            alert('Archivo cargado exitosamente.');
        } else {
            alert(`Error: ${result.message}`);
        }
    } catch (error) {
        console.error('Error en la carga del archivo:', error);
        alert('Hubo un problema con la carga del archivo.');
    }
});
