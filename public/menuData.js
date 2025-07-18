// menuData.js
export const menuData = [
  {
    title: "Salir",
    link: "/",
    icon: "fas fa-home icon-home"
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
          { title: "Seguimiento", link: "/inspasig", icon: "fas fa-users-cog icon-users-cog" },
          { title: "Cerrar", link: "/inspeccion", icon: "fas fa-users-cog icon-users-cog" },
          { title: "Generar", link: "/inspeccion", icon: "fas fa-users-cog icon-users-cog" },
          { title: "Informe Excel", link: "/informe.xlsx", icon: "fas fa-file-excel" },
          { title: "Informe PDF", link: "/informe.pdf", icon: "fas fa-file-pdf" },
        ]
      },      

    ]
  },
  {
    title: "Informes / Consultas",
    link: "/opciones",
    icon: "fas fa-file-alt icon-file-alt",
  },
  {
    title: "Configuracion",
    icon: "fas fa-cogs icon-cogs",
    subItems: [
      { title: "Usuarios", link: "/users", icon: "fas fa-users-cog icon-users-cog" },
      { title: "Paises", link: "/paises", icon: "fas fa-users-cog icon-users-cog" },
      { title: "Ciudades", link: "/ciudades", icon: "fas fa-users-cog icon-users-cog" },
      { title: "Clientes", link: "/clientes", icon: "fas fa-users-cog icon-users-cog" },
      { title: "Equipo Funcional", link: "/efuncional", icon: "fas fa-users-cog icon-users-cog" },
      { title: "Estados Centro de Costo", link: "/codigos", icon: "fas fa-users-cog icon-users-cog" },
    ]
  }
];
