// src/app.js

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import session from './middlewares/session.js';
import authRoutes from './routes/auth.js';
import { pool } from './db.js';
import { PORT } from './config.js';

// Inicializa dotenv
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración básica
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Session
app.use(session);

// Ruta principal (login)
app.get('/', (req, res) => {
  res.render('login');
});

// Descarga de archivos
app.get('/origen/:folder/:filename', (req, res) => {
  const { folder, filename } = req.params;
  const filePath = path.join(__dirname, `../uploads/${folder}/`, filename);

  res.download(filePath, err => {
    if (err) {
      console.error('Error al descargar el archivo:', err);
      res.status(500).send('Error al descargar el archivo.');
    }
  });
});

// Vista del menú principal
app.get('/menuprc', (req, res) => {
  if (req.session.loggedin) {
    const { user, name, rol, unidad: userUser } = req.session;
    res.render('menuprc', { user, name, rol, userUser });
  } else {
    res.redirect('/');
  }
});

// Rutas externas (login modularizado)
app.use('/', authRoutes);


//  funcion hora  Bogota   Promise.all  Promise.all

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

/* CCOSTO */  /*************************************************************************************/

app.get('/ccosto', async (req, res) => {
  if (!req.session.loggedin) return res.redirect('/');

  const conn = await pool.getConnection();
  try {
    const userUser = req.session.user;
    const userName = req.session.name;
    const fechaHoraBogota = getBogotaDateTime();

    const [ccosto] = await conn.execute(` 
      SELECT a.*, b.cliente as clienteN,
        CASE
            WHEN ? < a.fecha_orden THEN 'Por Iniciar'
            WHEN ? >= a.fecha_orden AND ? <= a.fecha_entrega THEN 'En Progreso'
            WHEN ? > a.fecha_entrega THEN 'Atrasado'
            ELSE 'Sin Estado'
        END AS estado_actual
      FROM tbl_ccosto a
      JOIN tbl_cliente b ON a.cliente = b.nit;
    `, [fechaHoraBogota, fechaHoraBogota, fechaHoraBogota, fechaHoraBogota]);

    const [unidadT] = await conn.execute('SELECT * FROM tbl_unidad');
    const [clienteT] = await conn.execute('SELECT * FROM tbl_cliente order by cliente');
    const [paisesl] = await conn.execute('SELECT * FROM tbl_paises');

    const mensaje = req.session.mensaje;
    delete req.session.mensaje;

    res.render('ccosto', { ccosto, unidadT, clienteT, paisesl, user: userUser, name: userName, mensaje });
  } catch (error) {
    console.error('Error obteniendo ccosto:', error);
    res.status(500).send('Error al obtener ccosto');
  } finally {
    conn.release(); // 👈 Siempre libera la conexión
  }
});
 
// POST CCOSTO

app.post('/ccosto', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      idcc, descripcion, ocompra, cliente, fecha_orden,
      fecha_entrega, cantidad, unidad, peso, pais,
      ciudad, comentarios, editando
    } = req.body;

    let mensaje;

    if (editando === "true") {
      await conn.execute(
        `UPDATE tbl_ccosto SET descripcion=?, ocompra=?, cliente=?, fecha_orden=?, fecha_entrega=?, cantidad=?, unidad=?, peso=?, pais=?, ciudad=?, comentarios=? WHERE idcc=?`,
        [descripcion, ocompra, cliente, fecha_orden, fecha_entrega, cantidad, unidad, peso, pais, ciudad, comentarios, idcc]
      );

      mensaje = { tipo: 'success', texto: 'Centro de costo actualizado exitosamente.' };
    } else {
      const [rows] = await conn.execute(
        'SELECT COUNT(*) AS count FROM tbl_ccosto WHERE idcc = ?',
        [idcc]
      );

      if (rows[0].count > 0) {
        mensaje = { tipo: 'danger', texto: 'Ya existe Centro de Costo' };
      } else {
        await conn.execute(
          `INSERT INTO tbl_ccosto (idcc, descripcion, ocompra, cliente, fecha_orden, fecha_entrega, cantidad, unidad, peso, pais, ciudad, comentarios)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [idcc, descripcion, ocompra, cliente, fecha_orden, fecha_entrega, cantidad, unidad, peso, pais, ciudad, comentarios?.trim()]
        );

        mensaje = { tipo: 'success', texto: `Centro de Costo guardado exitosamente: ${idcc}` };
      }
    }

    // Recargar datos para mostrar de nuevo el formulario
    const [ccosto] = await conn.execute(`
      SELECT a.*, b.cliente as clienteN
      FROM tbl_ccosto a
      JOIN tbl_cliente b ON a.cliente = b.nit;
    `);
    const [unidadT] = await conn.execute('SELECT * FROM tbl_unidad');
    const [clienteT] = await conn.execute('SELECT * FROM tbl_cliente ORDER BY cliente');
    const [paisesl] = await conn.execute('SELECT * FROM tbl_paises');

    res.render('ccosto', { mensaje, ccosto, unidadT, clienteT, paisesl });

  } catch (error) {
    console.error('Error guardando ccosto:', error);

    const [ccosto] = await conn.execute(`
      SELECT a.*, b.cliente as clienteN
      FROM tbl_ccosto a
      JOIN tbl_cliente b ON a.cliente = b.nit;
    `);
    const [unidadT] = await conn.execute('SELECT * FROM tbl_unidad');
    const [clienteT] = await conn.execute('SELECT * FROM tbl_cliente ORDER BY cliente');
    const [paisesl] = await conn.execute('SELECT * FROM tbl_paises');

    res.status(500).render('ccosto', {
      mensaje: { tipo: 'danger', texto: 'Error al procesar la solicitud.' },
      ccosto, unidadT, clienteT, paisesl
    });
  } finally {
    conn.release(); // 🔴 Muy importante
  }
});

app.get('/ccosto/delete/:idcc', async (req, res) => {
    const idcc = req.params.idcc;
    try {
      await pool.execute('DELETE FROM tbl_ccosto WHERE idcc = ?', [idcc]);
      req.session.mensaje = {
        tipo: 'success',
        texto: `Eliminado exitosamente - ID: ${idcc}`
      };
    } catch (err) {
      let texto = `Error al eliminar C. Costo - ID: ${idcc}`;
      if (err.message.includes('foreign key constraint fails')) {
        texto = 'No se puede eliminar porque tiene elementos asociados.';
      }
      req.session.mensaje = { tipo: 'danger', texto };
    }
    res.redirect('/ccosto');
  });


// Puerto de escucha
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running at http://0.0.0.0:${PORT}`);
});
