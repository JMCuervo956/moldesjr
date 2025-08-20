// fileHandler.js
export async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async function(e) {
        const content = e.target.result;
        document.getElementById('fileContent').textContent = content;

        // Enviar el contenido al servidor
        try {
            const response = await fetch('/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });

            if (!response.ok) {
                throw new Error('Error al enviar el contenido al servidor');
            }

            alert('Archivo subido y contenido guardado en la base de datos');
        } catch (error) {
            console.error('Error:', error);
            alert('Hubo un problema al enviar el archivo');
        }
    };

    reader.readAsText(file);
}

// fileHandler.js

export function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        const content = e.target.result;
        document.getElementById('fileContent').textContent = content;
    };

    reader.readAsText(file);
}

document.getElementById('downloadFile').addEventListener('click', () => {
    const text = document.getElementById('fileContent').textContent;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'archivo.txt';
    a.click();
    URL.revokeObjectURL(url);
});
