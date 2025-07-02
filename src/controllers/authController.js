// src/controllers/authController.js
import bcryptjs from 'bcryptjs';
import { pool } from '../db.js';

export const login = async (req, res) => {
  const { unidad, user, pass } = req.body;

  try {
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
