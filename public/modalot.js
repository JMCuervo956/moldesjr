// modalot.js

export class Modalot{
    constructor({ title = '', content = '', buttons = [] } = {}) {
      this._createModal();
      this.update({ title, content, buttons });
    }
  
    _createModal() {
      this.modalot = document.createElement('div');
      this.modalot.id = 'customModal';
      this.modalot.classList.add('modal-container');
  
      this.modalot.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <span class="modal-close">&times;</span>
          <h2 class="modal-title"></h2>
          <div class="modal-body"></div>
          <div class="modal-footer"></div>
        </div>
      `;
  
      document.body.appendChild(this.modalot);
  
      this.modalot.querySelector('.modal-close').addEventListener('click', () => this.close());
      this.modalot.querySelector('.modal-overlay').addEventListener('click', () => this.close());
    }
  
    update({ title = '', content = '', buttons = [] } = {}) {
      this.modalot.querySelector('.modal-title').innerHTML = title;
      this.modalot.querySelector('.modal-body').innerHTML = content;
  
      const footer = this.modalot.querySelector('.modal-footer');
      footer.innerHTML = ''; // Limpiar botones anteriores
  
      buttons.forEach((btn, index) => {
        const buttonEl = document.createElement('button');
        buttonEl.className = 'modal-button';
        buttonEl.textContent = btn.text;
        buttonEl.addEventListener('click', () => {
          if (typeof btn.onClick === 'function') btn.onClick();
          this.close();
        });
        footer.appendChild(buttonEl);
      });
    }
  
    open() {
      this.modalot.style.display = 'block';
    }
  
    close() {
      this.modalot.style.display = 'none';
    }
  }
  