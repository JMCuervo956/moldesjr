import bcryptjs from 'bcryptjs';
import { pool } from '../db.js';

export const login = async (req, res) => {
  const { unidad, user, pass } = req.body;

  try {
  
  const fechaHoraBogotaStr = getBogotaDateTime();
 
  const fechaBogota = new Date(fechaHoraBogotaStr.replace(' ', 'T') + 'Z');

  const [rows] = await pool.execute('SELECT * FROM users WHERE user = ?', [user]);

  if (rows.length === 0) {
      return res.json({ status: 'error', message: 'Usuario no encontrado' });
    }
    const userRecord = rows[0];
    const passwordMatch = await bcryptjs.compare(pass, userRecord.pass);
    if (!passwordMatch) {
      return res.json({ status: 'error', message: 'Contraseña incorrecta' });
    }
    req.session.reciénLogueado = true;
    req.session.loggedin = true;
    req.session.user = userRecord.user;
    req.session.name = userRecord.name;
    req.session.rol = userRecord.rol;
    req.session.pass = userRecord.pass;
    req.session.numprop = userRecord.numprop;
    req.session.username = user;

    // parametros

    const [paramRows] = await pool.execute('SELECT * FROM tbl_parametro');

    if (paramRows.length > 0) {
      const param = paramRows[0];
      req.session.param = {
        horaini: param.id_horaini,
        horafin: param.id_horafin,
        diasverif: param.id_diasverif,
        diassem: param.id_dia
      };      
    };

    // Ahora puedes usar:
    const hora = fechaBogota.getUTCHours();
    const dia = fechaBogota.getUTCDay();

    const { horaini, horafin, diasverif, diassem } = req.session.param || {};

   
    if (hora >= 7 && hora < horafin) {
    } else {
      return res.json({ status: 'error', message: 'Hora Fuera de Rango' });
    }

    if (getBogotaWeekday('capitalized') !== diassem) {
    } else {
      return res.json({ status: 'error', message: 'Día fuera de rango' });
    }

    return res.json({ status: 'success', message: '!LOGIN Correcto!' });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

function getBogotaDateTime() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const parts = formatter.formatToParts(new Date());
  const data = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${data.year}-${data.month}-${data.day} ${data.hour}:${data.minute}:${data.second}`;
}

function getBogotaWeekday(format = 'capitalized') {
  const date = new Date();

  const formatter = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    weekday: format === 'full' ? 'long' : 'short'
  });

  let weekday = formatter.format(date); // Ej: 'dom.' o 'domingo'

  // Limpiar el punto si existe (algunos navegadores devuelven 'dom.' con punto)
  weekday = weekday.replace('.', '');

  switch (format) {
    case 'lower':
      return weekday.toLowerCase();       // 'dom'
    case 'upper':
      return weekday.toUpperCase();       // 'DOM'
    case 'capitalized':
      return weekday.charAt(0).toUpperCase() + weekday.slice(1).toLowerCase(); // 'Dom'
    case 'full':
      return weekday.charAt(0).toUpperCase() + weekday.slice(1).toLowerCase(); // 'Domingo'
    default:
      return weekday; // por defecto devuelve capitalizada
  }
}

/*

console.log(getBogotaWeekday('lower'));       // 'dom'
console.log(getBogotaWeekday('upper'));       // 'DOM'
console.log(getBogotaWeekday('capitalized')); // 'Dom'
console.log(getBogotaWeekday('full'));        // 'Domingo'

*/