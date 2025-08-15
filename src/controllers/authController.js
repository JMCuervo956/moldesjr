// src/controllers/authController.js
import bcryptjs from 'bcryptjs';
import { pool } from '../db.js';

export const login = async (req, res) => {
  const { unidad, user, pass } = req.body;

  try {
    
  const fechaHoraBogota = new Date(getBogotaDateTime()); // parseamos el string
  const hora = fechaHoraBogota.getHours();
  await pool.execute(
  `INSERT INTO logs_mjr (user, proceso, fecha_proceso) 
    VALUES (?, ?, ?)`,
  [user, 99, fechaHoraBogota]
);
  if (hora >= 8 && hora < 18) {
    console.log("La hora está entre las 08:00 y las 18:00.");
  } else {
    console.log("La hora está fuera del rango.");
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
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const bogotaOffsetHours = -5;
    const bogotaTime = new Date(utc + bogotaOffsetHours * 3600000);
  
    const yyyy = bogotaTime.getFullYear();
    const mm = String(bogotaTime.getMonth() + 1).padStart(2, '0');
    const dd = String(bogotaTime.getDate()).padStart(2, '0');
    const hh = String(bogotaTime.getHours()).padStart(2, '0');
    const min = String(bogotaTime.getMinutes()).padStart(2, '0');
    const ss = String(bogotaTime.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}