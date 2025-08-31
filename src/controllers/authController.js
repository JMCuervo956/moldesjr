// src/controllers/authController.js
import bcryptjs from 'bcryptjs';
import { pool } from '../db.js';

export const login = async (req, res) => {
  const { unidad, user, pass } = req.body;

  try {
  
  const fechaHoraBogotaStr = getBogotaDateTime();
 
  // Convertir string a Date ajustado a Bogotá (para operaciones)
  // Una forma simple es crear un objeto Date en UTC usando el string:
  const fechaBogota = new Date(fechaHoraBogotaStr.replace(' ', 'T') + 'Z');

  // Ahora puedes usar:
  const hora = fechaBogota.getUTCHours();
  const dia = fechaBogota.getUTCDay();

/*
  const fechaISO = fechaHoraBogotaStr.toISOString().split('T')[0];
  const [rowsf] = await pool.execute(
    'SELECT 1 FROM festivos WHERE fecha = ? AND activo = 1',
    [fechaISO]
  );
  const esFestivo = rowsf.length > 0;  

  if (esFestivo) {
    await pool.execute(
    `INSERT INTO logs_mjr (user, proceso, fecha_proceso) 
      VALUES (?, ?, ?)`,
    [user, 97, fechaHoraBogotaStr]
    );
    return res.json({ status: 'error', message: 'Día festivo, no se permite el acceso' });
  }

  const diaSemana = fechaHoraBogotaStr.getDay(); // 0 = Domingo, 6 = Sábado
  if (diaSemana === 0 || diaSemana === 6) {
    await pool.execute(
    `INSERT INTO logs_mjr (user, proceso, fecha_proceso) 
      VALUES (?, ?, ?)`,
    [user, 98, fechaHoraBogotaStr]
    );
    return res.json({ status: 'error', message: 'Dia Fuera de Rango' });
  }  

  await pool.execute(
  `INSERT INTO logs_mjr (user, proceso, fecha_proceso) 
    VALUES (?, ?, ?)`,
  [user, 99, fechaHoraBogotaStr]
);
*/

  if (hora >= 7 && hora < 18) {
  } else {
    return res.json({ status: 'error', message: 'Hora Fuera de Rango' });
  }

  const [rows] = await pool.execute('SELECT * FROM users WHERE user = ?', [user]);

  if (rows.length === 0) {
      return res.json({ status: 'error', message: 'Usuario no encontrado' });
    }
    const userRecord = rows[0];
    const passwordMatch = await bcryptjs.compare(pass, userRecord.pass);
    if (!passwordMatch) {
      return res.json({ status: 'error', message: 'Contraseña incorrecta' });
    }

    req.session.loggedin = true;
    req.session.user = userRecord.user;
    req.session.name = userRecord.name;
    req.session.rol = userRecord.rol;
    req.session.pass = userRecord.pass;
    req.session.numprop = userRecord.numprop;
    req.session.username = user;

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
