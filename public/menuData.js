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
    icon: "fa-solid fa-briefcase icon-users",
    subItems: [
      { title: "Ordenes", link: "/otrabajo", icon: "fas fa-users-cog icon-users-cog" },
      { title: "Actividades", link: "/actividades", icon: "fas fa-history icon-history" },
    ]
  },
  {
    title: "Inspeccion",
    icon: "fa-solid fa-magnifying-glass icon-cogs",
    subItems: [
      { title: "Seguimiento en Curso", link: "/inspasig", icon: "fas fa-puzzle-piece" },
      { title: "Cerrar e Historial", link: "/inspeccioncfg", icon: "fas fa-folder-open" },
    ]
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
  {
    title: "Configuracion",
    icon: "fas fa-cogs icon-cogs",
    subItems: [
      { title: "Usuarios", link: "/users", icon: "fas fa-user-cog" },
      { title: "Paises", link: "/paises", icon: "fas fa-users-cog icon-users-cog" },
      { title: "Ciudades", link: "/ciudades", icon: "fas fa-users-cog icon-users-cog" },
      { title: "Clientes", link: "/clientes", icon: "fas fa-users-cog icon-users-cog" },
      { title: "Equipo Funcional", link: "/efuncional", icon: "fas fa-users-cog icon-users-cog" },
      { title: "Proveedor", link: "/proveedor", icon: "fas fa-users-cog icon-users-cog" },
    ]
  }
];
