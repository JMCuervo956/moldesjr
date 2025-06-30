// menuRenderer.js
export function createMenu(items, currentPath = []) {
    const ul = document.createElement("ul");
  
    items.forEach(item => {
      const li = document.createElement("li");
      const fullPath = [...currentPath, item.title];
  
      const a = document.createElement("a");
      a.href = item.link || "#";
      a.innerHTML = `<i class="${item.icon}"></i> ${item.title}`;
  
      // Resaltar el ítem activo
      const isActive = currentPath.join('/') === fullPath.join('/');
      if (isActive) {
        li.classList.add("active");
      }
  
      if (item.subItems) {
        const shouldBeOpen = currentPath.slice(0, fullPath.length).join('/') === fullPath.join('/');
        if (shouldBeOpen) {
          li.classList.add("open");
        }
  
        a.addEventListener("click", (e) => {
          e.preventDefault();
          li.classList.toggle("open");
        });
  
        const subMenu = createMenu(item.subItems, fullPath);
        li.appendChild(a);
        li.appendChild(subMenu);
      } else {
        a.addEventListener("click", () => {
          localStorage.setItem("menuPath", JSON.stringify(fullPath));
        });
        li.appendChild(a);
      }
  
      ul.appendChild(li);
    });
  
    return ul;
  }
  