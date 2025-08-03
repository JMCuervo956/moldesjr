import { menuData } from './menuData.js';
import { menuData2 } from './menuData2.js';

const userRole = "josem"; // o el rol que tengas dinámico
document.addEventListener("DOMContentLoaded", () => {
  const nav1 = document.getElementById("menu");
  const nav2 = document.getElementById("filteredMenu");
  const permisos = window.permisosUsuario || [];
  const filteredMenu = filterMenuByModulos(menuData2, permisos);

  const storedPath = JSON.parse(localStorage.getItem("menuPath") || "[]");

  function createMenu(items, currentPath = []) {
    const ul = document.createElement("ul");

    items.forEach(item => {
      const li = document.createElement("li");  
      const fullPath = [...currentPath, item.title];

      const a = document.createElement("a");
      a.href = item.link || "#";
      a.innerHTML = `<i class="${item.icon}"></i> ${item.title}`;

      // Resaltar el ítem activo
      const isActive = storedPath.join('/') === fullPath.join('/');
      if (isActive) {
        li.classList.add("active");
      }

      if (item.subItems) {
        const shouldBeOpen = storedPath.slice(0, fullPath.length).join('/') === fullPath.join('/');
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

  // Renderizar menú según corresponda
  if (nav1) {
    const menu = createMenu(menuData);
    nav1.appendChild(menu);
  }

  if (nav2) {
    const menu = createMenu(filteredMenu); // <-- usa el menú filtrado
    nav2.appendChild(menu);
  }
});

function filterMenuByModulos(menu, modulosPermitidos) {
  return menu
    .map(item => {
      const subItems = item.subItems
        ? filterMenuByModulos(item.subItems, modulosPermitidos)
        : null;

      const tienePermiso = modulosPermitidos.includes(item.title);

      if (tienePermiso || (subItems && subItems.length > 0)) {
        return {
          ...item,
          subItems: subItems && subItems.length > 0 ? subItems : undefined
        };
      }

      return null;
    })
    .filter(Boolean);
}
