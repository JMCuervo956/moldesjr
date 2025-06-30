// estaFechas.js

// Devuelve la fecha y hora actual ajustada a Bogotá (UTC-5)
export function getBogotaDate() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const bogotaOffset = -5; // UTC-5
  return new Date(utc + bogotaOffset * 3600000);
}

// Convierte un objeto Date a string 'YYYY-MM-DD' en zona horaria local
export function fechaToYMD(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calcula el estado y color basado en las fechas dadas
 * @param {string} fecha_orden_str - Fecha de orden (YYYY-MM-DD)
 * @param {string} fecha_entrega_str - Fecha de entrega (YYYY-MM-DD)
 * @param {string|null} fecha_fin_str - Fecha final (YYYY-MM-DD) o null
 * @returns {{ estado: string, color: string }}
 */
export function calcularEstadoConColor(fecha_orden_str, fecha_entrega_str, fecha_fin_str = null) {
  const hoy = getBogotaDate();
  const hoyStr = fechaToYMD(hoy);

  const fecha_orden = new Date(fecha_orden_str);
  const fecha_entrega = new Date(fecha_entrega_str);
  const fecha_fin = fecha_fin_str ? new Date(fecha_fin_str) : null;

  const ordenStr = fechaToYMD(fecha_orden);
  const entregaStr = fechaToYMD(fecha_entrega);
  const finStr = fecha_fin ? fechaToYMD(fecha_fin) : null;

  if (!fecha_fin) {
    // 1.a: Si fecha_entrega es mayor que hoy => "Por iniciar" (gris)
    if (entregaStr > hoyStr) {
      return { estado: 'Por iniciar', color: 'gray' };
    }
    // 1.b: fecha_orden es igual a hoy y <= fecha_entrega => "En proceso" (verde)
    if (ordenStr === hoyStr && ordenStr <= entregaStr) {
      return { estado: 'En proceso', color: 'green' };
    }
    // 1.c: fecha_orden > hoy y <= fecha_entrega => "Inicio tarde y en proceso" (verde)
    if (ordenStr > hoyStr && ordenStr <= entregaStr) {
      return { estado: 'Inicio tarde y en proceso', color: 'green' };
    }
    // 1.d: fecha_orden > hoy => "En retraso" (rojo)
    if (ordenStr < hoyStr) {
      return { estado: 'En retraso', color: 'red' };
    }
    return { estado: 'Estado indefinido', color: 'black' };
  }

  // 2.a: Si fecha_fin > fecha_entrega => "Entrega atrasada" (rojo)
  if (finStr > entregaStr) {
    return { estado: 'Entrega atrasada', color: 'red' };
  }
  // 2.b: Si fecha_fin <= fecha_entrega => "Finalizada antes tiempos" (verde)
  if (finStr <= entregaStr) {
    return { estado: 'Finalizada antes tiempos', color: 'green' };
  }

  return { estado: 'Estado indefinido', color: 'black' };
}
