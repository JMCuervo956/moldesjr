export const menuData2 = [
    {
        title: "Salir",
        link: "/",
        icon: "fas fa-home" // Ícono de Font Awesome
    },

    {
        title: "Centros de Costos",
        link: "/ccosto",
        icon: "fas fa-user-plus icon-envelope",
    },

    {
        title: "Ordenes de Trabajo",
        icon: "fas fa-users icon-users",
        subItems: [
        { title: "Ordenes", link: "/otrabajo", icon: "fas fa-users-cog icon-users-cog" },
        { title: "Actividades", link: "/actividades", icon: "fas fa-history icon-history" },
        {
            title: "Inspeccion",
            icon: "fas fa-users icon-users",
            subItems: [
            { title: "Seguimiento en Curso", link: "/inspasig", icon: "fas fa-folder-open" },
            { title: "Seguimiento Auxiliares", link: "/inspaux", icon: "fas fa-folder-open" },
            { title: "Cerrar e Historial", link: "/inspeccioncfg", icon: "fas fa-puzzle-piece" },
            ]
        },      
        ]
    },

    {
        title: "Informes / Consultas",
        link: "/opciones",
        icon: "fas fa-file-alt icon-file-alt",
    },
  ];
    