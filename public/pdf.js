import { PDFDocument, rgb, StandardFonts } from 'https://cdn.skypack.dev/pdf-lib';

window.addEventListener('DOMContentLoaded', () => {
  const boton = document.getElementById('generarPDF');
  console.log('✅ JS cargado correctamente'); // <- esto debería verse en consola

  if (boton) {
    boton.addEventListener('click', async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const { height } = page.getSize();

      page.drawText('Informe generado desde EJS + JS ESM JMCC', {
        x: 50,
        y: height - 100,
        size: 20,
        font,
        color: rgb(0.2, 0.4, 0.8),
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'informe.pdf';
      link.click();

      URL.revokeObjectURL(url);
    });
  }
});
