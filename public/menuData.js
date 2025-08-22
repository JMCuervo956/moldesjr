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
    ]
  },
  {
    title: "Inspeccion",
    icon: "fas fa-users icon-users",
    subItems: [
      { title: "Seguimiento en Curso", link: "/inspasig", icon: "fas fa-folder-open" },
      { title: "Cerrar e Historial", link: "/inspeccioncfg", icon: "fas fa-puzzle-piece" },
    ]
  },      
  {
    title: "Inspeccion Auxiliares",
    icon: "fas fa-users icon-users",
    subItems: [
      { title: "Seguimiento Auxiliares", link: "/inspaux", icon: "fas fa-folder-open" },
      { title: "Cerrar", link: "/cerraraux", icon: "fas fa-puzzle-piece" },
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
      { title: "Usuarios", link: "/users", icon: "fas fa-user-cog" },
      { title: "Paises", link: "/paises", icon: "fas fa-users-cog icon-users-cog" },
      { title: "Ciudades", link: "/ciudades", icon: "fas fa-users-cog icon-users-cog" },
      { title: "Clientes", link: "/clientes", icon: "fas fa-users-cog icon-users-cog" },
      { title: "Equipo Funcional", link: "/efuncional", icon: "fas fa-users-cog icon-users-cog" },
      { title: "Estados Centro de Costo", link: "/codigos", icon: "fas fa-users-cog icon-users-cog" },
    ]
  }
];
