const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalForm = document.getElementById('modalForm');
const closeBtn = document.getElementById('closeModal');

const formularios = {
    form1: [
      { name: 'nombre', type: 'text', placeholder: 'Tu nombre' },
    ],
    form2: [
      { name: 'correo', type: 'email', placeholder: 'Correo electrónico' },
    ],
    form3: [
      { name: 'edad', type: 'number', placeholder: 'Edad' },
    ],
    form4: [
      { name: 'pais', type: 'text', placeholder: 'País' },
    ],
    form5: [
      { name: 'color_fav', type: 'text', placeholder: 'Color favorito' },
    ],
    form6: [
      { name: 'usuario', type: 'text', placeholder: 'Usuario' },
      { name: 'clave', type: 'password', placeholder: 'Contraseña' }
    ],
    form7: [
      { name: 'comentario', type: 'text', placeholder: 'ddd' },
    ],
    form8: [
      { name: 'telefono', type: 'tel', placeholder: 'Teléfono' },
    ],
    form9: [
      { name: 'codigo', type: 'text', placeholder: 'Código postal' },
    ]
  };
  
function crearFormulario(campos) {
  modalForm.innerHTML = ''; // Limpiar el contenido anterior

  campos.forEach(campo => {
    const input = document.createElement('input');
    input.name = campo.name;
    input.type = campo.type;
    input.placeholder = campo.placeholder;
    input.required = true;
    modalForm.appendChild(input);
  });

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Enviar';
  modalForm.appendChild(submitBtn);
}

/*
document.querySelectorAll('.modern-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const formId = btn.dataset.form;
    const campos = formularios[formId];

    if (!campos) {
      alert('Formulario no encontrado');
      return;
    }

    modalTitle.textContent = `Formulario ${formId.slice(-1)}`;
    crearFormulario(campos);
    modal.classList.add('show');
  });
});
*/

closeBtn.addEventListener('click', () => {
  modal.classList.remove('show');
});

modalForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(modalForm);
  const values = Object.fromEntries(data.entries());
  console.log('Formulario enviado:', values);
  alert(`Formulario enviado correctamente`);
  modalForm.reset();
  modal.classList.remove('show');
});
