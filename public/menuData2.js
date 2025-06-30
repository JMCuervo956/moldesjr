export const menuData2 = [
      {
        title: "Salir",
        link: "/",
        icon: "fas fa-home" // Ícono de Font Awesome
      },
      {
        title: "Sobre Nosotros",
        icon: "fas fa-users", // Ícono de Font Awesome
        subItems: [
          {
            title: "Equipo",
            //link: "/nosotros/equipo",
            icon: "fas fa-user-friends",
            subItems: [
              { title: "Miembros del Equipo", link: "/usuarios", icon: "fas fa-users-cog" },
              { title: "Contactar con el Equipo", link: "/nosotros/equipo/contactar", icon: "fas fa-envelope" }
            ]
          },
          { title: "Historia", link: "/nosotros/historia", icon: "fas fa-history" }
        ]
      }
    ];
    