export const menuData2 = [
  {
    title: "Salir",
    link: "/",
    icon: "fas fa-home",
    roles: ["Salir"],
  },
  {
    title: "Centros de Costo",  
    link: "/ccosto",
    icon: "fas fa-user-plus icon-envelope",
  },
  {
    title: "Ordenes de trabajo",
    icon: "fa-solid fa-briefcase icon-users",
    subItems: [
      {
        title: "Ordenes",
        link: "/otrabajo",
        icon: "fas fa-users-cog icon-users-cog",
      },
      {
        title: "Actividades",
        link: "/actividades",
        icon: "fas fa-history icon-history",
      },
    ],
  },
  {
    title: "Inspeccion",
    icon: "fa-solid fa-magnifying-glass icon-cogs",
    subItems: [
      {
        title: "Seguimiento en Curso",
        link: "/inspasig",
        icon: "fas fa-puzzle-piece",
      },
      {
        title: "Cerrar e Historial",
        link: "/inspeccioncfg",
        icon: "fas fa-folder-open",
      },
    ],
  },
  {
    title: "Inspeccion Auxiliares",
    icon: "fa-solid fa-binoculars icon-file-alt",
    subItems: [
      { title: "Seguimiento Auxiliares", link: "/inspaux", icon: "fas fa-puzzle-piece" },
      { title: "Cerrar", link: "/cerraraux", icon: "fas fa-folder-open" },
    ]
  },      

  {
    title: "Informes / Consultas",
    link: "/opciones",
    icon: "fas fa-file-alt icon-home",
  },
];

