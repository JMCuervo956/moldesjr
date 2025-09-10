import {createPool} from 'mysql2';
import mysql from 'mysql2/promise';
import {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT
} from './config.js';

export const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: DB_PORT,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  connectTimeout: 10000,
  ssl: {
    rejectUnauthorized: false // ← Clever Cloud NO requiere validación estricta de certificados
  }
});

//  acquireTimeout: 10000,

// Opcional pero recomendable: mantiene la conexión activa
setInterval(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Ping a Clever Cloud exitoso');
  } catch (err) {
    console.error('❌ Error en ping a Clever Cloud:', err.message);
  }
}, 30000);

