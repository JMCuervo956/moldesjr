// modal.js

export class Modal {
    constructor({ title = '', content = '', buttons = [] } = {}) {
      this._createModal();
      this.update({ title, content, buttons });
    }
  
    _createModal() {
      this.modal = document.createElement('div');
      this.modal.id = 'customModal';
      this.modal.classList.add('modal-container');
  
      this.modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <span class="modal-close">&times;</span>
          <h2 class="modal-title"></h2>
          <div class="modal-body"></div>
          <div class="modal-footer"></div>
        </div>
      `;
  
      document.body.appendChild(this.modal);
  
      this.modal.querySelector('.modal-close').addEventListener('click', () => this.close());
      this.modal.querySelector('.modal-overlay').addEventListener('click', () => this.close());
    }
  
    update({ title = '', content = '', buttons = [] } = {}) {
      this.modal.querySelector('.modal-title').innerHTML = title;
      this.modal.querySelector('.modal-body').innerHTML = content;
  
      const footer = this.modal.querySelector('.modal-footer');
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
      this.modal.style.display = 'block';
    }
  
    close() {
      this.modal.style.display = 'none';
    }
  }
  