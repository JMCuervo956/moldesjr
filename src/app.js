// src/app.js

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import session from './middlewares/session.js';
import authRoutes from './routes/auth.js';
import { requireSession } from './middlewares/requireSession.js';
import { PORT } from './config.js';
import crypto from 'crypto';

import { pool } from './db.js';
import bcryptjs from 'bcryptjs';

// Inicializa dotenv
dotenv.config();
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer(app);
const io = new Server(server); // ← definición correcta para ESM


// Configuración básica
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

//console.log('NODE_ENV:', process.env.NODE_ENV);

// Session
app.set('trust proxy', 1);
app.use(session);

// Ruta principal (login)
app.get('/', (req, res) => {
  res.render('login', { query: req.query });
});


// Ruta para mostrar permisos del usuario
app.get('/permisos/:userCode?', async (req, res) => {
  if (!req.session.loggedin) return res.redirect('/?expired=1');

  const userCode = req.params.userCode || null;
  try {
    const [usuarios] = await pool.query('SELECT * FROM users');
    const [modulos] = await pool.query('SELECT * FROM tbl_menu');
    let permisos = [];

    if (userCode) {
      [permisos] = await pool.query(
        'SELECT * FROM users_add WHERE user_code = ?',
        [userCode]
      );
    }
    res.render('permisos.ejs', {
      usuarios,
      permisos,
      userCode,
      modulos 
    });

  } catch (err) {
    console.error('Error cargando permisos:', err);
    res.status(500).send('Error interno del servidor');
  }
});

// Actualizar permiso existente
app.post('/permisos/actualizar', async (req, res) => {
  if (!req.session.loggedin) return res.redirect('/?expired=1');
  const {
    user_code,
    module,
    can_view,
    can_create,
    can_edit,
    can_delete
  } = req.body;
  try {
    await pool.query(
      `UPDATE users_add
       SET can_view = ?, can_create = ?, can_edit = ?, can_delete = ?, fecha_act = CURDATE()
       WHERE user_code  = ? AND module = ? `,
      [
        can_view ? 1 : 0,
        can_create ? 1 : 0,
        can_edit ? 1 : 0,
        can_delete ? 1 : 0,
        user_code,
        module
      ]
    );

    res.redirect(`/permisos/${user_code}`);
  } catch (err) {
    console.error('Error actualizando permiso:', err);
    res.status(500).send('Error al actualizar permiso');
  }
});

// Agregar nuevo permiso
app.post('/permisos/agregar', async (req, res) => {
  if (!req.session.loggedin) return res.redirect('/?expired=1');
  const {
    user_code,
    module,
    opcion,
    can_view,
    can_create,
    can_edit,
    can_delete
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO users_add (user_code , module, opcion, can_view, can_create, can_edit, can_delete, fecha_cre)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [
        user_code,
        module,
        opcion || '',
        can_view ? 1 : 0,
        can_create ? 1 : 0,
        can_edit ? 1 : 0,
        can_delete ? 1 : 0
      ]
    );

    res.redirect(`/permisos/${user_code}`);
  } catch (err) {
    console.error('Error agregando permiso:', err);
    res.status(500).send('Error al agregar permiso');
  }
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
app.get('/menuprc', requireSession, async (req, res) => {
  const { user, name, rol, unidad: userUser } = req.session;

  try {
    const fechaHoraBogota = getBogotaDateTime();
    await pool.execute(
      'INSERT INTO logs_mjr (user, proceso, fecha_proceso) VALUES (?, ?, ?)',
      [user, 1, fechaHoraBogota]
    );

    res.render('menuprc', { user, name, rol, userUser });
  } catch (error) {
    console.error('Error en /menuprc:', error.message);

    // ✅ Mensaje en sesión con objeto completo (tipo + texto)
    req.session.mensaje = {
      texto: 'Ocurrió un error al cargar el menú principal. Intente nuevamente.',
      tipo: 'danger'
    };

    // ✅ Redirección segura
    res.redirect('/menuprc');

    // 🔴 ¡NO pongas res.status().send() después de redirigir!
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
  if (!req.session.loggedin) return res.redirect('/?expired=1');

  const conn = await pool.getConnection();
  try {
    const userUser = req.session.user;
    const userName = req.session.name;
    const fechaHoraBogota = getBogotaDateTime();

    const [[ccosto], [unidadT], [clienteT], [paisesl]] = await Promise.all([
      conn.execute(` 
        SELECT a.*, b.cliente as clienteN,
          CASE
              WHEN ? < a.fecha_orden THEN 'Por Iniciar'
              WHEN ? >= a.fecha_orden AND ? <= a.fecha_entrega THEN 'En Progreso'
              WHEN ? > a.fecha_entrega THEN 'Atrasado'
              ELSE 'Sin Estado'
          END AS estado_actual
        FROM tbl_ccosto a
        JOIN tbl_cliente b ON a.cliente = b.nit;
      `, [fechaHoraBogota, fechaHoraBogota, fechaHoraBogota, fechaHoraBogota]),
      conn.execute('SELECT * FROM tbl_unidad'),
      conn.execute('SELECT * FROM tbl_cliente ORDER BY cliente'),
      conn.execute('SELECT * FROM tbl_paises')
    ]);

    const mensaje = req.session.mensaje;
    delete req.session.mensaje;

    await pool.execute(
      `INSERT INTO logs_mjr (user, proceso, fecha_proceso) 
        VALUES (?, ?, ?)`,
      [userUser, 2, fechaHoraBogota]
    );
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
    conn.release(); 
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

 /* BarraProgreso **********************************************************/

app.get('/barraprogreso', async (req, res) => {
    if (!req.session.loggedin) return res.redirect('/?expired=1');
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;
            // Recuperar datos de la URL
            //const id = req.params.id;
            const id = req.query.idcc;
            const [rows] = await pool.execute(`
                SELECT a.*, b.cliente as client,c.unidad as nund
                FROM tbl_ccosto a
                LEFT JOIN tbl_cliente b ON a.cliente = b.nit
                LEFT JOIN tbl_unidad c ON a.unidad = c.id_unidad
                WHERE idcc = ?
            `, [id]);
            const row = rows[0]; // obtenemos la primera fila
            const data = {
            cc: row.idcc,
            descripcion: row.descripcion,
            oc: row.ocompra,
            cliente: row.cliente,
            ncliente: row.client,
            cantidad: row.cantidad,
            peso: row.peso,
            unidad: row.unidad,
            nunidad: row.nund,
            comentarios: row.comentarios
                ? row.comentarios.replace(/(\r\n|\n|\r)/g, '<br>')
                : '',
            FechaOrden: row.fecha_orden
                ? row.fecha_orden.toISOString().split('T')[0]
                : null,
            FechaEntrega: row.fecha_entrega
                ? row.fecha_entrega.toISOString().split('T')[0]
                : null,
            FechaFin: row.fecha_fin
                ? row.fecha_fin.toISOString().split('T')[0]
                : null
            };
            //  Recuperar mensaje de sesión
            const mensaje = req.session.mensaje;
            delete req.session.mensaje;
            res.render('barraprogreso', { preguntas: rows, user: userUser, name: userName, datosBD: data });

        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error real:', error);
        res.status(500).send('Error conectando a la base de datos.');
    }
});
 
/* ORDEN DE TRABAJO /***************************************************************************/

app.get('/otrabajo', async (req, res) => {
  if (!req.session.loggedin) return res.redirect('/?expired=1');

  const conn = await pool.getConnection();
  try {
    const userUser = req.session.user;
    const userName = req.session.name;
    const fechaHoraBogota = getBogotaDateTime();

    const [
      [otrabajo],
      [prov],
      [dise],
      [supe],
      [sold],
      [ccost]
    ] = await Promise.all([
      conn.execute(`
        SELECT 
          a.*, b.funcionario as clienteN, c.descripcion as descco,
          CASE
            WHEN ? < c.fecha_orden THEN 'Por Iniciar'
            WHEN ? >= c.fecha_orden AND ? <= c.fecha_entrega THEN 'En Progreso'
            WHEN ? > c.fecha_entrega THEN 'Atrasado'
            ELSE 'Sin Estado'
          END AS estado_actual
        FROM tbl_otrabajo a
        LEFT JOIN tbl_efuncional b ON a.proveedor = b.identificador
        LEFT JOIN tbl_ccosto c ON a.idot = c.idcc;
      `, [fechaHoraBogota, fechaHoraBogota, fechaHoraBogota, fechaHoraBogota]),
      conn.execute('SELECT * FROM tbl_efuncional WHERE perfil = 1'),
      conn.execute('SELECT * FROM tbl_efuncional WHERE perfil = 2'),
      conn.execute('SELECT * FROM tbl_efuncional WHERE perfil = 3'),
      conn.execute('SELECT * FROM tbl_efuncional WHERE perfil = 4'),
      conn.execute('SELECT * FROM tbl_ccosto')
    ]);

    const mensaje = req.session.mensaje;
    delete req.session.mensaje;

    await pool.execute(
      `INSERT INTO logs_mjr (user, proceso, fecha_proceso) 
        VALUES (?, ?, ?)`,
      [userUser, 3, fechaHoraBogota]
    );

    
    res.render('otrabajo', { otrabajo, prov, dise, supe, sold, ccost, user: userUser, name: userName, mensaje });
  } catch (error) {
    console.error('Error obteniendo otrabajo:', error);
    res.status(500).send('Error al obtener otrabajo');
  } finally {
    conn.release();
  }
});


app.post('/otrabajo', async (req, res) => {
  if (!req.session.loggedin) return res.redirect('/?expired=1');

  const conn = await pool.getConnection();
  try {
    const { idot, descripcion, proveedor, disenador, supervisor, soldador, observacion, editando } = req.body;
    let mensaje;

    if (editando === "true") {
      // Actualizar registro
      await conn.execute(
        `UPDATE tbl_otrabajo 
         SET descripcion = ?, proveedor = ?, disenador = ?, supervisor = ?, soldador = ?, observacion = ? 
         WHERE idot = ?`,
        [descripcion, proveedor, 0, 0, 0, observacion, idot]
      );
      mensaje = {
        tipo: 'success',
        texto: 'Centro de costo actualizado exitosamente.'
      };
    } else {
      // Verificar si ya existe el idot
      const [rows] = await conn.execute(
        'SELECT COUNT(*) AS count FROM tbl_otrabajo WHERE idot = ?',
        [idot]
      );

      if (rows[0].count > 0) {
        mensaje = {
          tipo: 'danger',
          texto: 'Ya existe Orden de Trabajo'
        };
      } else {
        const fechaHoraBogota = getBogotaDateTime();
        await conn.execute(
          `INSERT INTO tbl_otrabajo 
           (idot, descripcion, proveedor, disenador, supervisor, soldador, observacion, fecharg) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [idot, descripcion, proveedor, 0, 0, 0, observacion, fechaHoraBogota]
        );
        mensaje = {
          tipo: 'success',
          texto: `Orden de Trabajo guardado exitosamente: ${idot}`
        };
      }
    }

    // Consultas paralelas para obtener datos actualizados
    const fechaHoraBogota = getBogotaDateTime();
    const [
      [otrabajo],
      [prov],
      [dise],
      [supe],
      [sold],
      [ccost]
    ] = await Promise.all([
      conn.execute(`
        SELECT 
          a.*, 
          b.funcionario as clienteN, 
          c.descripcion as descco,
          CASE
            WHEN ? < c.fecha_orden THEN 'Por Iniciar'
            WHEN ? >= c.fecha_orden AND ? <= c.fecha_entrega THEN 'En Progreso'
            WHEN ? > c.fecha_entrega THEN 'Atrasado'
            ELSE 'Sin Estado'
          END AS estado_actual
        FROM tbl_otrabajo a
        LEFT JOIN tbl_efuncional b ON a.proveedor = b.identificador
        LEFT JOIN tbl_ccosto c ON a.idot = c.idcc;
      `, [fechaHoraBogota, fechaHoraBogota, fechaHoraBogota, fechaHoraBogota]),
      conn.execute('SELECT * FROM tbl_efuncional WHERE perfil = 1'),
      conn.execute('SELECT * FROM tbl_efuncional WHERE perfil = 2'),
      conn.execute('SELECT * FROM tbl_efuncional WHERE perfil = 3'),
      conn.execute('SELECT * FROM tbl_efuncional WHERE perfil = 4'),
      conn.execute('SELECT * FROM tbl_ccosto')
    ]);

    res.render('otrabajo', {
      mensaje,
      otrabajo,
      prov,
      dise,
      supe,
      sold,
      ccost
    });
  } catch (error) {
    console.error('Error guardando orden de trabajo:', error);

    try {
      // Si hay error, recupera datos para renderizar la vista con mensaje de error
      const [
        [otrabajo],
        [prov],
        [dise],
        [supe],
        [sold],
        [ccost]
      ] = await Promise.all([
        conn.execute(`
          SELECT a.*, b.funcionario as clienteN
          FROM tbl_otrabajo a
          LEFT JOIN tbl_efuncional b ON a.proveedor = b.identificador;
        `),
        conn.execute('SELECT * FROM tbl_efuncional WHERE perfil = 1'),
        conn.execute('SELECT * FROM tbl_efuncional WHERE perfil = 2'),
        conn.execute('SELECT * FROM tbl_efuncional WHERE perfil = 3'),
        conn.execute('SELECT * FROM tbl_efuncional WHERE perfil = 4'),
        conn.execute('SELECT * FROM tbl_ccosto')
      ]);

      res.status(500).render('otrabajo', {
        mensaje: {
          tipo: 'danger',
          texto: 'Error al procesar la solicitud.'
        },
        otrabajo,
        prov,
        dise,
        supe,
        sold,
        ccost
      });
    } catch (innerError) {
      console.error('Error recuperando datos tras fallo:', innerError);
      res.status(500).send('Error crítico en la aplicación.');
    }
  } finally {
    conn.release();
  }
});

app.get('/otrabajo/delete/:idot', async (req, res) => {
    const idot = req.params.idot;
    try {
        await pool.execute('DELETE FROM tbl_otrabajo WHERE idot = ?', [idot]);
        req.session.mensaje = {
            tipo: 'success',
            texto: `Eliminado exitosamente - ID: ${idot}`
        };
    } catch (err) {
        console.error('Error al eliminar Orden de Trabajo:', err);
        let texto = `Error al eliminar Orden de Trabajo - ID: ${idot}`;
        if (err.message && err.message.includes('foreign key constraint fails')) {
            texto = 'No se puede eliminar la Orden de Trabajo porque tiene elementos asociados (restricción de clave foránea).';
        }
        req.session.mensaje = {
            tipo: 'danger',
            texto
        };
    }
    res.redirect('/otrabajo');
});

/* MODAL PANTALLA CCOSTO*/  

app.get('/modalot', async (req, res) => {
    try {
        if (!req.session.loggedin) return res.redirect('/?expired=1');
        
        const id = req.query.idot;
        const [rows] = await pool.execute(`
            SELECT a.*, b.funcionario AS prov, c.funcionario AS dise, d.funcionario AS supe, e.funcionario AS sold
            FROM tbl_otrabajo a
            LEFT JOIN tbl_efuncional b ON a.proveedor = b.identificador
            LEFT JOIN tbl_efuncional c ON a.disenador = c.identificador
            LEFT JOIN tbl_efuncional d ON a.supervisor = d.identificador
            LEFT JOIN tbl_efuncional e ON a.soldador = e.identificador
            WHERE idot = ?
        `, [id]);

        if (!rows.length) {
            return res.status(404).send('Orden de trabajo no encontrada');
        }

        const row = rows[0];
        const data = {
            ot: row.idot,
            descripcion: row.descripcion,
            prov: row.proveedor,
            dise: row.disenador,
            supe: row.supervisor,
            sold: row.soldador,
            nprov: row.prov,
            ndise: row.dise,
            nsupe: row.supe,
            nsold: row.sold,
            comentarios: row.observacion ? row.observacion.replace(/(\r\n|\n|\r)/g, '<br>') : '',
        };

        res.render('modalot', { datos: data });

    } catch (error) {
        console.error('Error obteniendo otrabajo:', error);
        res.status(500).send('Error al obtener orden de trabajo');
    }
});

//  Complementar
 
app.get('/complementar', (req, res) => {
    const idot = req.query.idot;
    res.render('complementar', { idot })
});

app.get('/inspeccioncfg', (req, res) => {
    const idot = req.query.idot;
    const mensaje = req.session.mensaje;
    delete req.session.mensaje;
    res.render('inspeccioncfg', {
      mensaje,
      idot
    });
});

app.get('/inspeccioncfg/mover', async (req, res) => {
  try {
    //console.log('actualizar cfg');
//      await pool.execute('DELETE FROM tbl_dss WHERE idot = ?', [idot]);
    req.session.mensaje = {
      tipo: 'success',
      texto: `Historia Actualizada exitosamente`
    };
  } catch (err) {
    let texto = `Error al Actualizar Equipo`;

    if (err.message && err.message.includes('foreign key constraint fails')) {
      texto = 'No se puede Actualizar porque tiene elementos asociados (restricción de clave foránea).';
    }

    req.session.mensaje = {
      tipo: 'danger',
      texto
    };
  }

  // 🔁 Redireccionas a /inspeccioncfg
  res.redirect('/inspeccioncfg');
});

app.get('/inspeccioncfg/eliminar', async (req, res) => {
  try {
    //console.log('eliminar cfg');
//      await pool.execute('DELETE FROM tbl_dss WHERE idot = ?', [idot]);
    req.session.mensaje = {
      tipo: 'success',
      texto: `Semana Eliminada exitosamente`
    };
  } catch (err) {
    let texto = `Error al eliminar Equipo`;

    if (err.message && err.message.includes('foreign key constraint fails')) {
      texto = 'No se puede eliminar porque tiene elementos asociados (restricción de clave foránea).';
    }

    req.session.mensaje = {
      tipo: 'danger',
      texto
    };
  }
  // 🔁 Redireccionas a /inspeccioncfg
  res.redirect('/inspeccioncfg');
});

app.get('/inspeccioncfg/generar', async (req, res) => {
  try {
    //console.log('genera cfg');
//      await pool.execute('DELETE FROM tbl_dss WHERE idot = ?', [idot]);
    req.session.mensaje = {
      tipo: 'success',
      texto: `Semana Generada exitosamente`
    };
  } catch (err) {
    let texto = `Error al Generar Inspeccion`;

    if (err.message && err.message.includes('foreign key constraint fails')) {
      texto = 'No se puede Genearar porque tiene elementos asociados (restricción de clave foránea).';
    }

    req.session.mensaje = {
      tipo: 'danger',
      texto
    };
  }

  // 🔁 Redireccionas a /inspeccioncfg
  res.redirect('/inspeccioncfg');
});


//  Gestionar -  AQUI

app.get('/gestionar', async (req, res) => {
  const idot = req.query.idot;
    try {
        if (req.session.loggedin) {
        
            const userUser = req.session.user;
            const userName = req.session.name;
            const fechaHoraBogota = getBogotaDateTime();
            const [[oequipo], [prov]] = await Promise.all([
            pool.execute(` 
                Select
                    a.idot, 
                    a.identificador, 
                    b.funcionario, 
                    c.perfil AS perfil
                FROM tbl_dss a
                INNER JOIN tbl_efuncional b ON a.identificador = b.identificador
                INNER JOIN tbl_perfil c ON b.perfil = c.id
                where a.idot = ?;
            `, [idot]),
            pool.execute(`
                select a.tipo_id, a.identificador, a.funcionario, a.perfil, a.estado, b.perfil as desp from tbl_efuncional a
                INNER JOIN tbl_perfil b ON a.perfil = b.id
                where a.perfil <> 1
                order by b.id;
            `)
            ]);


            //  Recuperar mensaje de sesión  idots
            const mensaje = req.session.mensaje;
            delete req.session.mensaje;
            res.render('gestionar', { idot, oequipo, prov, user: userUser, name: userName, mensaje });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error obteniendo otrabajo:', error);
        res.status(500).send('Error al obtener gestionar');
    }
});

app.post('/gestionar', async (req, res) => {
    const idot = req.body.idot;
    try {
        const { idot, descripcion, proveedor, disenador, supervisor, soldador, observacion, editando } = req.body;
        let mensaje;
        let texto;
        
        if (editando === "true") {
            // Actualizar Ciudad
            const { idot, proveedor: identificador } = req.body;
            await pool.execute(
                `UPDATE tbl_dss SET identificador= ?  WHERE idot = ?`,
                [identificador, idot]
            );
            mensaje = {
                tipo: 'success',
                texto: 'Equipo actualizado exitosamente.'
            };
        } else {
            const { idot, proveedor: identificador } = req.body;
            const [rows] = await pool.execute(
                'SELECT COUNT(*) AS count FROM tbl_dss WHERE idot = ? AND identificador = ?',
                [idot, identificador]
            );

            if (rows[0].count > 0) {
                mensaje = {
                    tipo: 'danger',
                    texto: 'Ya existe'
                };
            } else {
                const comentarios = req.body.comentarios?.trim();
                const fechaHoraBogota = getBogotaDateTime();
                await pool.execute(
                    `INSERT INTO tbl_dss (idot, identificador) VALUES (?, ?)`,
                    [idot, identificador]
                );
                mensaje = {
                    tipo: 'success',
                    texto: `Equipo de Trabajo guardado exitosamente. : ${idot}` 
                };
            }
        }
        // Obtener clientes
            const fechaHoraBogota = getBogotaDateTime();
            const [[oequipo], [prov]] = await Promise.all([
            pool.execute(` 
                Select
                    a.idot, 
                    a.identificador, 
                    b.funcionario, 
                    c.perfil AS perfil
                FROM tbl_dss a
                INNER JOIN tbl_efuncional b ON a.identificador = b.identificador
                INNER JOIN tbl_perfil c ON b.perfil = c.id
                where a.idot = ?;
            `, [idot]),
            pool.execute(`
                select a.tipo_id, a.identificador, a.funcionario, a.perfil, a.estado, b.perfil as desp from tbl_efuncional a
                INNER JOIN tbl_perfil b ON a.perfil = b.id
                where a.perfil <> 1
                order by b.id;
            `)
            ]);

    
        // Renderizar la vista con el mensaje y la lista de proveedores
        res.render('gestionar', {
            idot,
            mensaje,
            oequipo,
            prov
        });
    } catch (error) {
        console.error('Error guardando ciudad:', error);
        const [[oequipo], [prov]] = await Promise.all([
        pool.execute(` 
            Select
                a.idot, 
                a.identificador, 
                b.funcionario, 
                c.perfil AS perfil
            FROM tbl_dss a
            INNER JOIN tbl_efuncional b ON a.identificador = b.identificador
            INNER JOIN tbl_perfil c ON b.perfil = c.id
            where a.idot = ?;
        `, [idot]),
        pool.execute(`
            select a.tipo_id, a.identificador, a.funcionario, a.perfil, a.estado, b.perfil as desp from tbl_efuncional a
            INNER JOIN tbl_perfil b ON a.perfil = b.id
            where a.perfil <> 1
            order by b.id;
        `)
        ]);

        res.status(500).render('gestionar', {
            mensaje: {
                tipo: 'danger',
                texto: 'Error al procesar la solicitud.'
            },
            idot,
            oequipo,
            prov,
        });
    }
}); 


app.get('/gestionar/delete/:idot', async (req, res) => {
    const idot = req.params.idot;
    try {
      await pool.execute('DELETE FROM tbl_dss WHERE idot = ?', [idot]);
      req.session.mensaje = {
        tipo: 'success',
        texto: `Eliminado exitosamente - ID: ${idot}`
      };
    } catch (err) {
            let texto = `Error al eliminar Equipo - ID: ${idot}`;

            // Manejo específico de error por clave foránea
            if (err.message && err.message.includes('foreign key constraint fails')) {
                texto = 'No se puede eliminar porque tiene elementos asociados (restricción de clave foránea).';
            }
            req.session.mensaje = {
                tipo: 'danger',
                texto
            };
            }
    res.redirect(`/gestionar?idot=${idot}`);
  });

 /***  PIEZAS ***************************************************************************************************/

app.get('/piezas', async (req, res) => {
    const idot = req.query.idot;
    try {
        if (!req.session.loggedin) {
            return res.redirect('/?expired=1');
        }

        const userUser = req.session.user;
        const userName = req.session.name;

        const [piezas] = await pool.execute(` 
            Select *
            FROM tbl_piezas
            where idpz = ?
            order by id;
            `, [idot]);
        // ✅ Manejo seguro del mensaje de sesión
        const mensaje = req.session.mensaje || null;
        delete req.session.mensaje; // Limpieza después de usar
        res.render('piezas', {
            idot,
            piezas,
            user: userUser,
            name: userName,
            mensaje

        });
    } catch (error) {
        console.error('Error al obtener los datos:', error);
        res.status(500).send('Error al obtener los datos');
    }
});

app.post('/piezas', async (req, res) => {
    try {
        const idpz = req.body.codigo;
        const id = req.body.id;
        const { nombre, descripcion, cantidad, editando } = req.body;
        let mensaje;
       
        if (editando === "true") {
            // Actualizar 
            await pool.execute(
                `UPDATE tbl_piezas SET nombre = ?, descripcion = ?, cantidad = ? WHERE id = ?`,	
                [nombre, descripcion, cantidad, id]
            );

            mensaje = {
                tipo: 'success',
                texto: 'Cambio Actualizado exitosamente.'
            };
        } else {
            await pool.execute(
                `INSERT INTO tbl_piezas (idpz, nombre, descripcion, cantidad) VALUES (?, ?, ?, ?)`,
                [idpz, nombre, descripcion, cantidad]
            );

            mensaje = {
                tipo: 'success',
                texto: 'Guardado exitosamente.'
            };
    }

        // Obtener actualizados
        const idot = req.body.codigo;
        const [piezas] = await pool.execute(`SELECT * FROM tbl_piezas order by id`);
        res.render('piezas', {
            idot,
            mensaje,
            piezas
        });
    } catch (error) {

        console.error('Error guardando: ', error);
        const idot = req.body.codigo;
        const [piezas] = await pool.execute(`SELECT * FROM tbl_piezas order by id`);
        res.status(500).render('piezas', {
            idot,
            mensaje: {
                tipo: 'danger',
                texto: 'Error al procesar la solicitud.'
            },
            piezas
        });
    }
}); 

app.post('/piezas/delete/:id', async (req, res) => {
    const idpz = req.params.id;
    const idot = req.query.idot;
  try {
    await pool.execute('DELETE FROM tbl_piezas WHERE id = ?', [idpz]);

    req.session.mensaje = {
      tipo: 'success',
      texto: 'Eliminado exitosamente.'
    };
  } catch (err) {
    let texto = 'Error al eliminar.';
    if (err.message.includes('foreign key constraint fails')) {
      texto = 'No se puede eliminar, tiene elementos asociados.';
    }

    req.session.mensaje = {
      tipo: 'danger',
      texto
    };
  }

  res.redirect(`/piezas?idot=${idot}`);
});


/***  ACABADOS ***************************************************************************************************/

app.get('/dacabados', async (req, res) => {
    const idot = req.query.idot;
    try {
        if (!req.session.loggedin) {
            return res.redirect('/?expired=1');
        }

        const userUser = req.session.user;
        const userName = req.session.name;
        const [acabados] = await pool.execute(` 
            Select *
            FROM tbl_acabados
            where idpz = ?
            order by id;
            `, [idot]);

        // ✅ Manejo seguro del mensaje de sesión
        const mensaje = req.session.mensaje || null;
        delete req.session.mensaje; // Limpieza después de usar
        res.render('dacabados', {
            idot,
            acabados,
            user: userUser,
            name: userName,
            mensaje

        });
    } catch (error) {
        console.error('Error al obtener los datos:', error);
        res.status(500).send('Error al obtener los datos');
    }
});

app.post('/dacabados', async (req, res) => {
    try {
        const idpz = req.body.codigo;
        const id = req.body.id;
        const { nombre, descripcion, cantidad, editando } = req.body;
        let mensaje;
       
        if (editando === "true") {
            // Actualizar 
            const nombre = req.body.nombre.toUpperCase();
            await pool.execute(
                `UPDATE tbl_acabados SET nombre = ?, descripcion = ? WHERE id = ?`,	
                [nombre, descripcion, id]
            );

            mensaje = {
                tipo: 'success',
                texto: 'Cambio Actualizado exitosamente.'
            };
        } else {
            const nombre = req.body.nombre.toUpperCase();
            await pool.execute(
                `INSERT INTO tbl_acabados (idpz, nombre, descripcion) VALUES (?, ?, ?)`,
                [idpz, nombre, descripcion]
            );
            mensaje = {
                tipo: 'success',
                texto: 'Guardado exitosamente.'
            };
    }

        // Obtener actualizados
        const idot = req.body.codigo;
        const [acabados] = await pool.execute(`SELECT * FROM tbl_acabados order by id`);
        res.render('dacabados', {
            idot,
            mensaje,
            acabados
        });
    } catch (error) {

        console.error('Error guardando: ', error);
        const idot = req.body.codigo;
        const [acabados] = await pool.execute(`SELECT * FROM tbl_acabados order by id`);
        res.status(500).render('dacabados', {
            idot,
            mensaje: {
                tipo: 'danger',
                texto: 'Error al procesar la solicitud.'
            },
            acabados
        });
    }
}); 

app.post('/dacabados/delete/:id', async (req, res) => {
    const idpz = req.params.id;
    const idot = req.query.idot;
  try {
    await pool.execute('DELETE FROM tbl_acabados WHERE id = ?', [idpz]);

    req.session.mensaje = {
      tipo: 'success',
      texto: 'Eliminado exitosamente.'
    };
  } catch (err) {
    let texto = 'Error al eliminar.';
    if (err.message.includes('foreign key constraint fails')) {
      texto = 'No se puede eliminar, tiene elementos asociados.';
    }
    req.session.mensaje = {
      tipo: 'danger',
      texto
    };
  }

  res.redirect(`/dacabados?idot=${idot}`);
});
 
/* ACTIVIDADES /***************************************************************************/

app.get('/actividades', async (req, res) => {
  try {
    if (!req.session.loggedin) return res.redirect('/?expired=1');

    const userUser = req.session.user;
    const userName = req.session.name;

    // Ejecutar todas las consultas en paralelo con Promise.all
    const [
      [otrabajo],
      [prov],
      [dise],
      [supe],
      [sold]
    ] = await Promise.all([
      pool.execute(`
        SELECT a.*, b.funcionario AS clienteN
        FROM tbl_otrabajo a
        LEFT JOIN tbl_efuncional b ON a.proveedor = b.identificador
      `),
      pool.execute('SELECT * FROM tbl_efuncional WHERE perfil = 1'),
      pool.execute('SELECT * FROM tbl_efuncional WHERE perfil = 2'),
      pool.execute('SELECT * FROM tbl_efuncional WHERE perfil = 3'),
      pool.execute('SELECT * FROM tbl_efuncional WHERE perfil = 4')
    ]);

    const mensaje = req.session.mensaje;
    delete req.session.mensaje;

    res.render('actividades', { otrabajo, prov, dise, supe, sold, user: userUser, name: userName, mensaje });

  } catch (error) {
    console.error('Error obteniendo actividades:', error);

    if (error.code === 'ECONNRESET') {
      res.status(503).send('Servicio de base de datos no disponible. Intenta nuevamente en unos segundos.');
    } else {
      res.status(500).send('Error interno al obtener datos.');
    }
  }
});

/* RESPUESTA **********************************************************/

app.get('/respuesta', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;
            // Recuperar datos de la URL
            const otrabajo = req.query.idot;
            const descripcion = req.query.descripcion;
            const [rows] = await pool.execute("select * from users");
            res.render('respuesta', { otrabajo, descripcion, preguntas: rows, user: userUser, name: userName });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error real:', error);
        res.status(500).send('Error conectando a la base de datos.');
    }
});

app.post('/respuesta', async (req, res) => {
  try {
    let { idot, taskname, taskStartDate, taskDuration, descripcion } = req.body;

    if (!idot || (typeof idot !== 'string' && typeof idot !== 'number')) {
      return res.status(400).send('IDOT inválido');
    }

    idot = String(idot).trim();

    // Ejecutar las dos consultas de max en paralelo
    const [[rowsTask], [rowsId]] = await Promise.all([
      pool.execute(
        `SELECT COALESCE(MAX(task), 0) + 1 AS siguiente_task FROM tbl_actividad WHERE idot = ?`,
        [idot]
      ),
      pool.execute(
        `SELECT COALESCE(MAX(id), 0) + 1 AS siguiente_id FROM tbl_actividad WHERE idot = ?`,
        [idot]
      )
    ]);

    const ultid = rowsId[0].siguiente_id;
    const ulttask = rowsTask[0].siguiente_task;

    // Ejecutar las dos inserciones en paralelo
    await Promise.all([
      pool.execute(
        'INSERT INTO tbl_actividad (id, task, idot, text, start_date, duration, progress, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [ultid, ulttask, idot, `${taskname} (Planificada)`, taskStartDate, taskDuration, 1, 'Principal']
      ),
      pool.execute(
        'INSERT INTO tbl_actividad (id, task, idot, text, start_date, duration, progress, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [ultid + 1, ulttask, idot, taskname, taskStartDate, taskDuration, 0, 'Real']
      )
    ]);

    res.redirect(`/respuesta?idot=${idot}&descripcion=${encodeURIComponent(descripcion || '')}`);
  } catch (error) {
    console.error('Error al guardar actividad:', error);
    res.status(500).send('Error al guardar actividad');
  }
});

/* Opciones **********************************************************************/
    
app.get('/opciones', (req, res) => {
    res.render('opciones');
  });


/*** C COSTO CONSULTAR ********/ 

app.get('/ccostocc', async (req, res) => {
  if (!req.session.loggedin) return res.redirect('/?expired=1');

  const conn = await pool.getConnection();
  try {
    const userUser = req.session.user;
    const userName = req.session.name;

    const [ccosto] = await conn.execute(`
      SELECT a.*, b.cliente as clienteN
      FROM tbl_ccosto a
      JOIN tbl_cliente b ON a.cliente = b.nit;
    `);

    const [unidadT] = await conn.execute('SELECT * FROM tbl_unidad');
    const [clienteT] = await conn.execute('SELECT * FROM tbl_cliente ORDER BY cliente');

    const mensaje = req.session.mensaje;
    delete req.session.mensaje;

    res.render('ccostocc', { ccosto, unidadT, clienteT, user: userUser, name: userName, mensaje });
  } catch (error) {
    console.error('Error obteniendo ccosto:', error);
    res.status(500).send('Error al obtener ccosto');
  } finally {
    conn.release();
  }
});

/* modalcc */

app.get('/modalcc', async (req, res) => {
  if (!req.session.loggedin) return res.redirect('/?expired=1');

  const conn = await pool.getConnection();
  try {
    const id = req.query.idcc;

    const [rows] = await conn.execute(`
      SELECT a.*, b.cliente as client, c.unidad as nund
      FROM tbl_ccosto a
      LEFT JOIN tbl_cliente b ON a.cliente = b.nit
      LEFT JOIN tbl_unidad c ON a.unidad = c.id_unidad
      WHERE idcc = ?
    `, [id]);

    const row = rows[0];
    const data = {
      cc: row.idcc,
      descripcion: row.descripcion,
      oc: row.ocompra,
      cliente: row.cliente,
      ncliente: row.client,
      cantidad: row.cantidad,
      peso: row.peso,
      unidad: row.unidad,
      nunidad: row.nund,
      comentarios: row.comentarios?.replace(/(\r\n|\n|\r)/g, '<br>') || '',
      FechaOrden: row.fecha_orden?.toISOString().split('T')[0],
      FechaEntrega: row.fecha_entrega?.toISOString().split('T')[0]
    };

    res.render('modalcc', { datos: data });
  } catch (error) {
    console.error('Error obteniendo ccosto:', error);
    res.status(500).send('Error al obtener modalcc');
  } finally {
    conn.release();
  }
});

/*** C COSTO ACTUALIZAR FECHAS */  

app.get('/ccostofch', async (req, res) => {
  if (!req.session.loggedin) return res.redirect('/?expired=1');

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
    const [clienteT] = await conn.execute('SELECT * FROM tbl_cliente ORDER BY cliente');
    const [paisesl] = await conn.execute('SELECT * FROM tbl_paises');

    const mensaje = req.session.mensaje;
    delete req.session.mensaje;

    res.render('ccostofch', {
      ccosto, unidadT, clienteT, paisesl, user: userUser, name: userName, mensaje
    });

  } catch (error) {
    console.error('Error obteniendo ccosto:', error);
    res.status(500).send('Error al obtener ccostofch');
  } finally {
    conn.release();
  }
});

 
// POST

app.post('/ccostofch', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { idcc, fecha_inicio, fecha_fin, editando } = req.body;
    const fechaInicioFinal = fecha_inicio === '' ? null : fecha_inicio;
    const fechaFinFinal = fecha_fin === '' ? null : fecha_fin;
    let mensaje;

    if (editando === "true") {
      const campos = [];
      const valores = [];

      if ('fecha_inicio' in req.body) {
        campos.push('fecha_inicio = ?');
        valores.push(fechaInicioFinal);
      }
      if ('fecha_fin' in req.body) {
        campos.push('fecha_fin = ?');
        valores.push(fechaFinFinal);
      }

      if (campos.length > 0) {
        const sql = `UPDATE tbl_ccosto SET ${campos.join(', ')} WHERE idcc = ?`;
        valores.push(idcc);
        await conn.execute(sql, valores);

        mensaje = { tipo: 'success', texto: 'Actualizado exitosamente.' };
      } else {
        mensaje = { tipo: 'info', texto: 'No se enviaron campos para actualizar.' };
      }
    }

    const [ccosto] = await conn.execute(`
      SELECT a.*, b.cliente as clienteN
      FROM tbl_ccosto a
      JOIN tbl_cliente b ON a.cliente = b.nit;
    `);
    const [unidadT] = await conn.execute('SELECT * FROM tbl_unidad');
    const [clienteT] = await conn.execute('SELECT * FROM tbl_cliente ORDER BY cliente');
    const [paisesl] = await conn.execute('SELECT * FROM tbl_paises');

    res.render('ccostofch', {
      mensaje, ccosto, unidadT, clienteT, paisesl
    });

  } catch (error) {
    console.error('Error guardando fechas:', error);

    const [ccosto] = await conn.execute(`
      SELECT a.*, b.cliente as clienteN
      FROM tbl_ccosto a
      JOIN tbl_cliente b ON a.cliente = b.nit;
    `);
    const [unidadT] = await conn.execute('SELECT * FROM tbl_unidad');
    const [clienteT] = await conn.execute('SELECT * FROM tbl_cliente ORDER BY cliente');
    const [paisesl] = await conn.execute('SELECT * FROM tbl_paises');

    res.status(500).render('ccostofch', {
      mensaje: { tipo: 'danger', texto: 'Error al procesar la solicitud.' },
      ccosto, unidadT, clienteT, paisesl
    });
  } finally {
    conn.release(); // ✅ Cierra la conexión
  }
});

/*consulta usuarios*/

app.get('/users_consulta', async (req, res) => {
    try {
        if (!req.session.loggedin) {
            return res.redirect('/?expired=1');
        }

        const userUser = req.session.user;
        const userName = req.session.name;

        const [estados] = await pool.execute('SELECT * FROM tbl_estados');
        const [roles] = await pool.execute('SELECT * FROM tbl_rol');
        const [users] = await pool.execute(`SELECT * FROM users ORDER BY DATE_FORMAT(fecha_nac, '%m-%d')`);


        // ✅ Manejo seguro del mensaje de sesión
        const mensaje = req.session.mensaje || null;
        delete req.session.mensaje; // Limpieza después de usar
        res.render('users_consulta', {
        users,
        estados,
        roles,
        user: userUser,
        name: userName,
        mensaje,
        formatFecha: function (fechaStr) {
            if (!fechaStr) return '';
            const fecha = new Date(fechaStr);
            if (isNaN(fecha)) return '';
            const dia = String(fecha.getDate()).padStart(2, '0');
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const anio = fecha.getFullYear();
            return `${dia}/${mes}/${anio}`;
        },
        formatDiaMes: function (fechaStr) {
            if (!fechaStr) return '';
            const fecha = new Date(fechaStr);
            if (isNaN(fecha)) return '';
            const dia = String(fecha.getDate()).padStart(2, '0');
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            return `${dia}/${mes}`;
        }
        });
    } catch (error) {
        console.error('Error al obtener users_consulta:', error);
        res.status(500).send('Error al obtener users_consulta');
    }
});

/* BarraProgreso **********************************************************/

app.get('/progresogral', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;
            const [rows] = await pool.execute(`
                SELECT a.*, b.cliente as client,c.unidad as nund
                FROM tbl_ccosto a
                LEFT JOIN tbl_cliente b ON a.cliente = b.nit
                LEFT JOIN tbl_unidad c ON a.unidad = c.id_unidad 
            `);
            //  Recuperar mensaje de sesión
            const mensaje = req.session.mensaje;
            delete req.session.mensaje;
            res.render('progresogral', { user: userUser, name: userName, datosBD: rows });

        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error real:', error);
        res.status(500).send('Error conectando a la base de datos.');
    }
});

/* PROGRESO  BARRA LINEAL **********************************************************/

app.get('/progresogralT', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;

            const [otrabajo] = await pool.execute(` 
                SELECT * FROM tbl_ccosto order by idcc desc
            `);

            const [efuncionales] = await pool.execute('SELECT * FROM tbl_efuncional WHERE perfil IN (1, 2, 3, 4)');
            const prov = efuncionales.filter(e => e.perfil === 1);
            const dise = efuncionales.filter(e => e.perfil === 2);
            const supe = efuncionales.filter(e => e.perfil === 3);
            const sold = efuncionales.filter(e => e.perfil === 4);            
            
            //  Recuperar mensaje de sesión
            const mensaje = req.session.mensaje;
            delete req.session.mensaje;
            res.render('progresogralT', { otrabajo, prov, dise, supe, sold, user: userUser, name: userName, mensaje });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error obteniendo otrabajo:', error);
        res.status(500).send('Error al obtener progresogralT');
    }
});

/*  tareas */

app.post('/tareas', async (req, res) => {
    try {
      // Realizamos la consulta a la base de datos
      const idot = req.body.idot;  // <-- Obtener idot del body
      const [rows] = await pool.execute("SELECT * FROM tbl_actividad WHERE idot = ?", [idot]);
      // Crear un array de tareas basadas en la respuesta de la base de datos
      const tasks = {
        tasks: rows.map((row, index) => {
        // Asignamos un color basado en el tipo (row.type)
        let color = "#32CD32"; // Valor predeterminado 
        if (row.type === "Principal") {
          color = "#0000FF";  // Verde para tareas planificadas  0000FF
        } else if (row.type === "in-progress") {
          color = "#FFD700";  // Amarillo para tareas en progreso
        } else if (row.type === "completed") {
          color = "#4CAF50";  // Verde oscuro para tareas completadas
        } else if (row.type === "delayed") {
          color = "#FF6347";  // Rojo para tareas retrasadas
        }
        return {  
          id: index + 1, // Asignamos un id único basado en el índice
          task: row.task || 1, // Ajusta esto según el nombre de la columna en tu base de datos
          text: row.text || "Tarea sin descripción", // Ajusta según el nombre de la columna
          start_date: row.start_date || "2025-02-12", // Ajusta según el nombre de la columna
          duration: row.duration || 6, // Ajusta según el nombre de la columna
          progress: row.progress || 0, // Ajusta según el nombre de la columna
          type: row.type, // O ajusta según lo que corresponda en tu base de datos
          color: color
          //color: row.color || "#32CD32" // Ajusta según el nombre de la columna, si tienes uno
        };  
        }),
        links: []
      };
      res.json(tasks); // Enviamos la respuesta al cliente
    } catch (error) {
      console.error('Error en el servidor:', error);
      res.status(500).json({ message: 'Error al procesar la solicitud' });
    }
  });


/* TAREAS G*/

app.post('/tareasg', async (req, res) => {
  try {
    // Consulta para obtener las tareas
    const [rows] = await pool.execute("SELECT * FROM tbl_ccosto order by idcc desc");

    // Consultas para obtener fechas mínima y máxima
    const [[{ min_fecha_orden }]] = await pool.execute(
      "SELECT MIN(fecha_orden) AS min_fecha_orden FROM tbl_ccosto"
    );
    const [[{ max_fecha_entrega }]] = await pool.execute(
      "SELECT MAX(fecha_entrega) AS max_fecha_entrega FROM tbl_ccosto"
    );

    // Función para formatear fecha como YYYY/MM/DD
    function formatDate(date) {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    }

    // Construcción del array de tareas
    const tasks = rows.map(row => {
      const start = new Date(row.fecha_orden);
      const end = new Date(row.fecha_entrega);
      let duration = 1;

      if (!isNaN(start) && !isNaN(end) && end >= start) {
        duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      }

      let progress = 0;
      if (row.estado === 1) progress = 1;
      else if (row.estado === 2) progress = 0.5;
      else if (row.estado === 3) progress = 0.25;

      let color = "#008080";
      switch (row.estado) {
        case 4: color = "#A9A9A9"; break;
        case 2: color = "#1E90FF"; break;
        case 3: color = "#FF6347"; break;
        case 1: color = "#90EE90"; break;
      }

      //  fechas           

    // Función para extraer solo fecha (sin horas)
    function getDateOnly(dateString) {
    const date = new Date(dateString);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    // Ejemplo de un objeto row con las 4 fechas


    // Normalizamos las fechas
    const fechaOrden = getDateOnly(row.fecha_orden);
    const fechaEntrega = getDateOnly(row.fecha_entrega);
    let fechaFin = null;
    if (row.fecha_fin !== null && row.fecha_fin !== undefined) {
        fechaFin = getDateOnly(row.fecha_fin);
    }

    let fechaInicio = null;
    if (row.fecha_inicio !== null && row.fecha_inicio !== undefined) {
        fechaInicio = getDateOnly(row.fecha_inicio);
    }

    color = "#808080"; // color por defecto
    const hoy = getDateOnly(new Date());
    if (fechaFin !== null) {
        if (fechaFin <= fechaEntrega) {
            color = "#1E90FF"; // Azul - terminó antes
        } else if (fechaFin.getTime() === fechaEntrega.getTime()) {
            color = "#90EE90"; // Verde - terminó a tiempo
        } else if (fechaFin > fechaEntrega) {
            color = "#FF6347"; // Rojo - terminó después
        }
    } else {
        if (fechaInicio > fechaOrden) {
            color = "#FFD700"; // Dorado - inició tarde
        } else if (hoy >= fechaOrden && hoy <= fechaEntrega) {
            color = "#90EE90"; // Verde - en curso a tiempo
        } else if (hoy > fechaEntrega) {
            color = "#FF6347"; // Rojo - aún no finaliza y está vencida
        }
    }
      return {
        task: row.idcc,
        text: row.descripcion || "Tarea sin descripción",
        start_date: row.fecha_orden,
        end_date: row.fecha_entrega,
        fin_date: row.fecha_fin,
        duration,
        progress,
        color
      };
    });

    // Enviar la respuesta al cliente  start_date

    res.json({
      tasks,
      links: [],
      min_fecha_orden: formatDate(min_fecha_orden),
      max_fecha_entrega: formatDate(max_fecha_entrega)
    });

  } catch (error) {
    console.error('Error en el servidor:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
});



//  ccosto excel

app.get('/ccostoexp', async (req, res) => {
  try {
    if (req.session.loggedin) {
      const userUser = req.session.user;
      const userName = req.session.name;

      // Consulta con formato de fecha dd/mm/aaaa
        const [[ccosto], [unidadT], [clienteT]] = await Promise.all([
        pool.execute(`
            SELECT 
            a.*, 
            DATE_FORMAT(a.fecha_orden, '%d/%m/%Y') AS fecha_orden_formateada,
            DATE_FORMAT(a.fecha_entrega, '%d/%m/%Y') AS fecha_entrega_formateada,
            b.cliente AS clienteN, c.nombre as nompais, d.nombre as nomciu
            FROM tbl_ccosto a
            LEFT JOIN tbl_cliente b ON a.cliente = b.nit 
            LEFT JOIN tbl_paises c ON a.pais = c.iso_pais
            LEFT JOIN tbl_ciudad d ON a.ciudad = d.iso_ciudad 
        `),
        pool.execute('SELECT * FROM tbl_unidad'),
        pool.execute('SELECT * FROM tbl_cliente ORDER BY cliente')
        ]);


      const mensaje = req.session.mensaje;
      delete req.session.mensaje;

      const fechaHoraBogota = getBogotaDateTime();
      await pool.execute(
        `INSERT INTO logs_mjr (user, proceso, fecha_proceso) 
          VALUES (?, ?, ?)`,
        [userUser, 3, fechaHoraBogota]
      );

      res.render('ccostoexp', {
        ccosto,
        unidadT,
        clienteT,
        user: userUser,
        name: userName,
        mensaje
      });
    } else {
      res.redirect('/');
    }
  } catch (error) {
    console.error('Error obteniendo ccostoexp:', error);
    res.status(500).send('Error al obtener ccostoexp');
  }
});

/***  USER *****************************************************************************************************/

app.get('/users', async (req, res) => {
    try {
        if (!req.session.loggedin) {
            return res.redirect('/?expired=1');
        }

        const userUser = req.session.user;
        const userName = req.session.name;

        const [estados] = await pool.execute('SELECT * FROM tbl_estados');
        const [roles] = await pool.execute('SELECT * FROM tbl_rol');
        const [users] = await pool.execute(`SELECT * FROM users ORDER BY user`);

        // ✅ Manejo seguro del mensaje de sesión
        const mensaje = req.session.mensaje || null;
        delete req.session.mensaje; // Limpieza después de usar

        const fechaHoraBogota = getBogotaDateTime();
        
        await pool.execute(
          `INSERT INTO logs_mjr (user, proceso, fecha_proceso) 
            VALUES (?, ?, ?)`,
          [userUser, 6, fechaHoraBogota]
        );

        res.render('users', {
            users,
            estados,
            roles,
            user: userUser,
            name: userName,
            mensaje
        });
    } catch (error) {
        console.error('Error al obtener users', error);
        res.status(500).send('Error al obtener users');
    }
});

app.post('/users', async (req, res) => {
  try {
    const { user, name, email, rol, telefono, estado, fecha_nac, editando } = req.body;
    let mensaje;

    if (editando === "true") {
      // Actualizar
      const fechaHoraBogota = getBogotaDateTime();
      await pool.execute(
        `UPDATE users SET name = ?, email = ?, rol = ?, telefono = ?, estado = ?, fecha_nac = ?, fecha_act = ?  WHERE user = ?`,
        [name, email, rol, telefono, estado, fecha_nac, fechaHoraBogota, user]
      );

      mensaje = {
        tipo: 'success',
        texto: 'Cambio actualizado exitosamente.'
      };
    } else {
      // Verificar si ya existe
      const [rows] = await pool.execute('SELECT COUNT(*) AS count FROM users WHERE user = ?', [user]);

      if (rows[0].count > 0) {
        mensaje = {
          tipo: 'danger',
          texto: 'Ya existe el código.'
        };
      } else {
        // Insertar nuevo usuario
        const passwordHash = await bcryptjs.hash(user, 8);
        const fechaHoraBogota = getBogotaDateTime();

        await pool.execute(
          `INSERT INTO users (user, name, email, pass, rol, telefono, estado, fecha_nac, fecha_cre, fecha_act)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [user, name, email, passwordHash, rol, telefono, estado, fecha_nac, fechaHoraBogota, fechaHoraBogota]
        );

        mensaje = {
          tipo: 'success',
          texto: 'Guardado exitosamente.'
        };
      }
    }

    // Obtener lista actualizada
    const [estados] = await pool.execute('SELECT * FROM tbl_estados');
    const [roles] = await pool.execute('SELECT * FROM tbl_rol');
    const [users] = await pool.execute(`SELECT * FROM users ORDER BY user`);
    res.render('users', {
      mensaje,
      users,
      estados,
      roles
    });

  } catch (error) {
    console.error('Error guardando: ', error);
    const [roles] = await pool.execute('SELECT * FROM tbl_rol');
    const [estados] = await pool.execute('SELECT * FROM tbl_estados');
    const [users] = await pool.execute(`SELECT * FROM users ORDER BY user`);

    res.status(500).render('users', {
      mensaje: {
        tipo: 'danger',
        texto: 'Error al procesar la solicitud.'
      },
      users,
      roles,
      estados
    });
  }
});

// pass

app.post('/users/delete/:id', async (req, res) => {
  const id = req.params.id;

  try {
    await pool.execute('DELETE FROM users WHERE user = ?', [id]);

    req.session.mensaje = {
      tipo: 'success',
      texto: 'Eliminado exitosamente.'
    };
  } catch (err) {
    let texto = 'Error al eliminar.';
    if (err.message.includes('foreign key constraint fails')) {
      texto = 'No se puede eliminar, tiene elementos asociados.';
    }

    req.session.mensaje = {
      tipo: 'danger',
      texto
    };
  }

  const mensaje = req.session.mensaje;
  delete req.session.mensaje;

  const [estados] = await pool.execute('SELECT * FROM tbl_estados');
  const [roles] = await pool.execute('SELECT * FROM tbl_rol');
  const [users] = await pool.execute('SELECT * FROM users ORDER BY user');

  res.render('users', {
    users,
    estados,
    roles,
    user: req.session.user,
    name: req.session.name,
    mensaje
  });
});

/* PAISES *************************************************************************************************/

app.get('/paises', async (req, res) => {
    try {
      if (req.session.loggedin) {
        const userUser = req.session.user;
        const userName = req.session.name;
  
        const [paises] = await pool.execute('SELECT * FROM tbl_paises');
        const mensaje = req.session.mensaje;
        delete req.session.mensaje;
  
        res.render('paises', { paises, user: userUser, name: userName, mensaje });
      } else {
        res.redirect('/');
      }
    } catch (error) {
      console.error('Error obteniendo países:', error);
      res.status(500).send('Error al obtener los países');
    }
  });
  
app.post('/paises', async (req, res) => {
    try {
        const { iso_pais, nombre, iso_alpha2, iso_alpha3, editando } = req.body;

        let mensaje;

        if (editando === "true") {
            // Actualizar el pais
            await pool.execute(
                `UPDATE tbl_paises SET nombre = ?, iso_alpha2 = ?, iso_alpha3 = ? WHERE iso_pais = ?`,
                [nombre, iso_alpha2, iso_alpha3, iso_pais]
            );

            mensaje = {
                tipo: 'success',
                texto: 'Pais actualizado exitosamente.'
            };
        } else {
            // Verificar si el pais ya existe
            const [rows] = await pool.execute(
                'SELECT COUNT(*) AS count FROM tbl_paises WHERE iso_pais = ?',
                [iso_pais]
            );

            if (rows[0].count > 0) {
                mensaje = {
                    tipo: 'danger',
                    texto: 'Ya existe un pais con este Codigo.'
                };
            } else {
                // Insertar nuevo proveedor
                await pool.execute(
                    `INSERT INTO tbl_paises (iso_pais, nombre, iso_alpha2, iso_alpha3) VALUES (?, ?, ?, ?)`,
                    [iso_pais, nombre, iso_alpha2, iso_alpha3]
                );

                mensaje = {
                    tipo: 'success',
                    texto: 'Pais guardado exitosamente.'
                };
            }
        }

        // Obtener los proveedores actualizados
        const [paises] = await pool.execute('SELECT * FROM tbl_paises');

        // Renderizar la vista con el mensaje y la lista de proveedores
        res.render('paises', {
            mensaje,
            paises
        });
        
    } catch (error) {
        console.error('Error guardando país:', error);
        const [paises] = await pool.execute('SELECT * FROM tbl_paises');
        res.status(500).render('paises', {
            mensaje: {
                tipo: 'danger',
                texto: 'Error al procesar la solicitud.'
            },
            paises
        });
    }
});

app.get('/paises/delete/:id', async (req, res) => {
    try {
      const id = req.params.id;
      await pool.execute('DELETE FROM tbl_paises WHERE iso_pais = ?', [id]);
      req.session.mensaje = { tipo: 'warning', texto: 'País eliminado exitosamente.' };
    } catch (error) {
      let texto = 'Error al eliminar país.';
      if (error.message.includes('foreign key constraint fails')) {
        texto = 'No se puede eliminar el país porque tiene ciudades asociadas.';
      }
      req.session.mensaje = { tipo: 'danger', texto };
    }
    res.redirect('/paises');
});

app.get('/ciudades/:paisId', async (req, res) => {
  const { paisId } = req.params;
  try {
    const [ciudades] = await pool.execute('SELECT iso_ciudad, nombre FROM tbl_ciudad WHERE pais_codigo = ?', [paisId]);
    res.json(ciudades);
  } catch (err) {
    console.error('Error al obtener /ciudades/:paisId:', err);
    res.status(500).json({ error: 'Error interno del /ciudades/:paisId' });
  }
});

/* CIUDADES *************************************************************************************************/

app.get('/ciudades', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;

            const [[ciudades], [paises]] = await Promise.all([
                pool.execute(`
                    SELECT c.*, p.nombre AS pais_nombre
                    FROM tbl_ciudad c
                    JOIN tbl_paises p ON c.pais_codigo = p.iso_pais
                `),
                pool.execute('SELECT * FROM tbl_paises')
            ]);

            //  Recuperar mensaje de sesión
            const mensaje = req.session.mensaje;
            delete req.session.mensaje;

            res.render('ciudades', { ciudades, paises, user: userUser, name: userName, mensaje });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error obteniendo ciudades:', error);
        res.status(500).send('Error al obtener las ciudades');
    }
});
  
// Crear o actualizar ciudad
app.post('/ciudades', async (req, res) => {
    try {
        const { iso_ciudad, nombre, pais_codigo, editando } = req.body;

        let mensaje;
        
        if (editando === "true") {
            // Actualizar Ciudad
            await pool.execute(
                `UPDATE tbl_ciudad SET nombre = ?, pais_codigo = ? WHERE iso_ciudad = ?`,
                [nombre, pais_codigo, iso_ciudad]
            );

            mensaje = {
                tipo: 'success',
                texto: 'Ciudad actualizado exitosamente.'
            };
        } else {
            // Verificar si Ciudad ya existe
            const [rows] = await pool.execute(
                'SELECT COUNT(*) AS count FROM tbl_ciudad WHERE iso_ciudad = ?',
                [iso_ciudad]
            );

            if (rows[0].count > 0) {
                mensaje = {
                    tipo: 'danger',
                    texto: 'Ya existe un pais con este Codigo.'
                };
            } else {
                // Insertar nuevo proveedor
                await pool.execute(
                    `INSERT INTO tbl_ciudad (iso_ciudad, nombre, pais_codigo) VALUES (?, ?, ?)`,
                    [iso_ciudad, nombre, pais_codigo]
                );

                mensaje = {
                    tipo: 'success',
                    texto: 'Ciudad guardada exitosamente.'
                };
            }
        }

        const [[ciudades], [paises]] = await Promise.all([
        pool.execute(`
            SELECT c.*, p.nombre AS pais_nombre
            FROM tbl_ciudad c
            JOIN tbl_paises p ON c.pais_codigo = p.iso_pais
        `),
        pool.execute('SELECT * FROM tbl_paises')
        ]);

        // Renderizar la vista con el mensaje y la lista de proveedores
        res.render('ciudades', {
            mensaje,
            ciudades,
            paises
        });

    } catch (error) {
        console.error('Error guardando ciudad:', error);
        const [ciudades] = await pool.execute(`
            SELECT c.*, p.nombre AS pais_nombre
            FROM tbl_ciudad c
            JOIN tbl_paises p ON c.pais_codigo = p.iso_pais
        `);
        const [paises] = await pool.execute('SELECT * FROM tbl_paises');
        res.status(500).render('ciudades', {
            mensaje: {
                tipo: 'danger',
                texto: 'Error al procesar la solicitud.'
            },
            ciudades,
            paises
        });
    }
});

app.get('/ciudades/delete/:id', async (req, res) => {
    try {
      const id = req.params.id;
      await pool.execute('DELETE FROM tbl_ciudad WHERE iso_ciudad = ?', [id]);
      req.session.mensaje = { tipo: 'success', texto: 'Ciudad eliminada exitosamente.' };
    } catch (err) {
      let texto = 'Error al eliminar Ciudad.';
      if (err.message.includes('foreign key constraint fails')) {
        texto = 'No se puede eliminar Ciudad porque tiene elementos asociados.'; // Ajusta si hace falta
      }
      req.session.mensaje = { tipo: 'danger', texto };
    }
    res.redirect('/ciudades');
  });

/***     CLIENTES    */

app.get('/clientes', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;

            const [[ciudades], [paisesl]] = await Promise.all([
            pool.execute(`
                SELECT c.*, p.nombre AS pais_nombre
                FROM tbl_cliente c
                LEFT JOIN tbl_paises p ON c.pais = p.iso_pais
                ORDER BY pais, nit
            `),
            pool.execute('SELECT * FROM tbl_paises')
            ]);

            //  Recuperar mensaje de sesión
            const mensaje = req.session.mensaje;
            delete req.session.mensaje;

            res.render('clientes', { ciudades, paisesl, user: userUser, name: userName, mensaje });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error obteniendo clientes:', error);
        res.status(500).send('Error al obtener las clientes');
    }
});

app.post('/clientes', async (req, res) => {
    try {
        const { nit, dv, cliente, telefono, celular1, celular2, correo, direccion, pais, ciudad, contacto, editando } = req.body;
        const id = nit;
        let mensaje;
        
        if (editando === "true") {
            // Actualizar Ciudad
            await pool.execute(
                `UPDATE tbl_cliente SET cliente= ?, telefono= ?, celular1= ?, celular2= ?, correo= ?, direccion= ?, pais= ?, ciudad= ?, contacto= ?  WHERE nit = ?`,
                [cliente, telefono, celular1, celular2, correo, direccion, pais, ciudad, contacto, nit]
            );
            mensaje = {
                tipo: 'success',
                texto: 'Cliente actualizado exitosamente.'
            };
        } else {
            // Verificar si Ciudad ya existe
            const [rows] = await pool.execute(
                'SELECT COUNT(*) AS count FROM tbl_cliente WHERE nit = ?',
                [nit]
            );

            if (rows[0].count > 0) {
                mensaje = {
                    tipo: 'danger',
                    texto: 'Ya existe un CLIENTE con este Nit.'
                };
            } else {
                // Insertar nuevo proveedor
                await pool.execute(
                    `INSERT INTO tbl_cliente (nit, dv, cliente, telefono, celular1, celular2, correo, direccion, pais, ciudad, contacto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [nit, dv, cliente, telefono, celular1, celular2, correo, direccion, pais, ciudad, contacto]
                );
                mensaje = {
                    tipo: 'success',
                    texto: `Cliente guardado exitosamente. Nit: ${id}` 
                    //texto = `Ciudad guardada exitosamente - NIT: ${id}`;
                };
            }
        }

        // Obtener clientes

        const [[ciudades], [paisesl], [ciudadl]] = await Promise.all([
        pool.execute(`
            SELECT c.*, p.nombre AS pais_nombre
            FROM tbl_cliente c
            JOIN tbl_paises p ON c.pais = p.iso_pais
        `),
        pool.execute('SELECT * FROM tbl_paises'),
        pool.execute('SELECT * FROM tbl_ciudad')
        ]);

        // Renderizar la vista con el mensaje y la lista de proveedores
        res.render('clientes', {
            mensaje,
            ciudades,
            paisesl,
            ciudadl
        });

    } catch (error) {

        console.error('Error guardando ciudad:', error);

        const [[ciudades], [paisesl], [ciudadl]] = await Promise.all([
        pool.execute(`
            SELECT c.*, p.nombre AS pais_nombre
            FROM tbl_cliente c
            JOIN tbl_paises p ON c.pais = p.iso_pais
        `),
        pool.execute('SELECT * FROM tbl_paises'),
        pool.execute('SELECT * FROM tbl_ciudad')
        ]);        
        
        res.status(500).render('clientes', {
            mensaje: {
                tipo: 'danger',
                texto: 'Error al procesar la solicitud.'
            },
            ciudades,
            paisesl,
            ciudadl
        });
    }
});

app.get('/clientes/delete/:id', async (req, res) => {
    try {
      const id = req.params.id;
      await pool.execute('DELETE FROM tbl_cliente WHERE nit = ?', [id]);
      let texto = `Cliente eliminado exitosamente - NIT: ${id}`;
      req.session.mensaje = { tipo: 'success', texto, id };
    } catch (err) {
      const id = req.params.id;  
      let texto = `Error al eliminar Cliente - NIT: ${id}`;
      if (err.message.includes('foreign key constraint fails')) {
        texto = 'No se puede eliminar porque tiene elementos asociados.'; // Ajusta si hace falta
      }
      req.session.mensaje = { tipo: 'danger', texto, id };
    }
    res.redirect('/clientes');
  });

/* EQUIPO FUNCIONAL */

app.get('/efuncional', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;

            const [[efuncional], [tipodocl], [estados], [perfilf]] = await Promise.all([
            pool.execute(` 
                SELECT a.tipo_id,a.identificador, a.funcionario, a.perfil, a.fechaini, a.estado, a.fechaest, 
                        b.id as idp, b.perfil as perfilp, c.estado as destado
                FROM tbl_efuncional a
                JOIN tbl_perfil b ON a.perfil = b.id
                JOIN tbl_estados c ON a.estado = c.id
                ORDER BY a.perfil, a.estado;
            `),
            pool.execute('SELECT * FROM tbl_tipodoc'),
            pool.execute('SELECT * FROM tbl_estados'),
            pool.execute('SELECT * FROM tbl_perfil')
            ]);
            
            //  Recuperar mensaje de sesión
            const mensaje = req.session.mensaje;
            delete req.session.mensaje;

            res.render('efuncional', { efuncional, tipodocl, estados, perfilf, user: userUser, name: userName, mensaje });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error obteniendo funcional:', error);
        res.status(500).send('Error al obtener efuncional');
    }
});
  
// Crear o actualizar ciudad
app.post('/efuncional', async (req, res) => {
    try {
        const { tipo_id, documento, funcionario, perfil, fechaini, estado, fechaest, editando } = req.body;
        let mensaje;
        let texto;
        
        if (editando === "true") {
            // Actualizar Ciudad
            await pool.execute(
                `UPDATE tbl_efuncional SET funcionario= ?, perfil= ?, estado= ? WHERE tipo_id = ? AND identificador = ?`,
                [funcionario, perfil, estado, tipo_id, documento]
            );
            mensaje = {
                tipo: 'success',
                texto: 'Funcional actualizado exitosamente.'
            };
        } else {

            // Verificar si Ciudad ya existe
            const [rows] = await pool.execute(
                'SELECT COUNT(*) AS count FROM tbl_efuncional WHERE tipo_id = ? AND identificador = ?',
                [tipo_id, documento]
            );

            if (rows[0].count > 0) {
                mensaje = {
                    tipo: 'danger',
                    texto: 'Ya existe un CLIENTE con este Nit.'
                };
            } else {

                // Insertar nuevo proveedor
                await pool.execute(
                    `INSERT INTO tbl_efuncional (tipo_id, identificador, funcionario, perfil, estado) VALUES (?, ?, ?, ?, ?)`,
                    [tipo_id, documento, funcionario, perfil, estado]
                );
                mensaje = {
                    tipo: 'success',
                    texto: `Funcional guardado exitosamente. : ${funcionario}` 
                };
            }
        }
        // Obtener clientes

        const [[efuncional], [tipodocl], [estados], [perfilf]] = await Promise.all([
        pool.execute(` 
            SELECT a.tipo_id,a.identificador, a.funcionario, a.perfil, a.fechaini, a.estado, a.fechaest, 
                    b.id as idp, b.perfil as perfilp, c.estado as destado
            FROM tbl_efuncional a
            JOIN tbl_perfil b ON a.perfil = b.id
            JOIN tbl_estados c ON a.estado = c.id
            ORDER BY a.perfil, a.estado;
        `),
        pool.execute('SELECT * FROM tbl_tipodoc'),
        pool.execute('SELECT * FROM tbl_estados'),
        pool.execute('SELECT * FROM tbl_perfil')
        ]);
        
        // Renderizar la vista con el mensaje y la lista de proveedores
        res.render('efuncional', {
            mensaje,
            efuncional,
            tipodocl,
            estados,
            perfilf
        });

    } catch (error) {

        console.error('Error guardando ciudad:', error);
        const [[efuncional], [tipodocl], [estados], [perfilf]] = await Promise.all([
        pool.execute(` 
            SELECT a.tipo_id,a.identificador, a.funcionario, a.perfil, a.fechaini, a.estado, a.fechaest, 
                    b.id as idp, b.perfil as perfilp, c.estado as destado
            FROM tbl_efuncional a
            JOIN tbl_perfil b ON a.perfil = b.id
            JOIN tbl_estados c ON a.estado = c.id
            ORDER BY a.perfil, a.estado;
        `),
        pool.execute('SELECT * FROM tbl_tipodoc'),
        pool.execute('SELECT * FROM tbl_estados'),
        pool.execute('SELECT * FROM tbl_perfil')
        ]);        
        res.status(500).render('efuncional', {
            mensaje: {
                tipo: 'danger',
                texto: 'Error al procesar la solicitud.'
            },
            efuncional,
            tipodocl,
            estados,
            perfilf
        });
    }
});


app.get('/efuncional/delete/:id/:nombre', async (req, res) => {
    const id = req.params.id;
    const nombre = req.params.nombre;
    try {
      await pool.execute('DELETE FROM tbl_efuncional WHERE tipo_id = ? AND identificador = ?', [id, nombre]);
      req.session.mensaje = {
        tipo: 'success',
        texto: `Eliminado exitosamente - ID: ${id}, Documento: ${nombre}`
      };
    } catch (err) {
      let texto = `Error al eliminar Funcional - ID: ${id}, Documento: ${nombre}`;
      if (err.message.includes('foreign key constraint fails')) {
        texto = 'No se puede eliminar porque tiene elementos asociados.';
      }
      req.session.mensaje = { tipo: 'danger', texto };
    }
      res.redirect('/efuncional');
  });

  /***   CODIGOS *****************************************************************************************************/

app.get('/codigos', async (req, res) => {
    try {
        if (!req.session.loggedin) {
            return res.redirect('/?expired=1');
        }

        const userUser = req.session.user;
        const userName = req.session.name;

        const [codigos] = await pool.execute(`SELECT * FROM tbl_ccoestado ORDER BY codigo`);

        // ✅ Manejo seguro del mensaje de sesión
        const mensaje = req.session.mensaje || null;
        delete req.session.mensaje; // Limpieza después de usar
        res.render('codigos', {
            codigos,
            user: userUser,
            name: userName,
            mensaje
        });
    } catch (error) {
        console.error('Error al obtener codigos', error);
        res.status(500).send('Error al obtener codigos');
    }
});

app.post('/codigos', async (req, res) => {								// cambia	app.post('/codigos'
    try {
        const { codigo, descripcion, editando } = req.body;
        let mensaje;
       
        if (editando === "true") {
            // Actualizar 
            await pool.execute(
                `UPDATE tbl_ccoestado SET descripcion = ? WHERE codigo = ?`,	
                [descripcion, codigo]
            );

            mensaje = {
                tipo: 'success',
                texto: 'Cambio Actualizado exitosamente.'
            };
        } else {
            // Verificar si ya existe
            const [rows] = await pool.execute('SELECT COUNT(*) AS count FROM tbl_ccoestado WHERE codigo = ?',
                [codigo]
            );

            if (rows[0].count > 0) {
                mensaje = {
                    tipo: 'danger',
                    texto: 'Ya existe Codigo.'
                };
            } else {
                // Insertar nuevo proveedor
                await pool.execute(
                    `INSERT INTO tbl_ccoestado (codigo, descripcion) VALUES (?, ?)`,
                    [codigo, descripcion]
                );

                mensaje = {
                    tipo: 'success',
                    texto: 'Guardado exitosamente.'
                };
            }
        }

        // Obtener actualizados

        const [codigos] = await pool.execute(`SELECT * FROM tbl_ccoestado order by codigo`);
        res.render('codigos', {
            mensaje,
            codigos
        });

    } catch (error) {

        console.error('Error guardando: ', error);
        const [codigos] = await pool.execute(`SELECT * FROM tbl_ccoestado order by codigo`);

	// Cambia tabla diferente
        res.status(500).render('codigos', {
            mensaje: {
                tipo: 'danger',
                texto: 'Error al procesar la solicitud.'
            },
            codigos
        });
    }
});

app.post('/codigos/delete/:id', async (req, res) => {
  const id = req.params.id;

  try {
    await pool.execute('DELETE FROM tbl_ccoestado WHERE codigo = ?', [id]);

    req.session.mensaje = {
      tipo: 'success',
      texto: 'Eliminado exitosamente.'
    };
  } catch (err) {
    let texto = 'Error al eliminar.';
    if (err.message.includes('foreign key constraint fails')) {
      texto = 'No se puede eliminar, tiene elementos asociados.';
    }

    req.session.mensaje = {
      tipo: 'danger',
      texto
    };
  }

  const mensaje = req.session.mensaje;
  delete req.session.mensaje;

  const [codigos] = await pool.execute('SELECT * FROM tbl_ccoestado ORDER BY codigo');

  res.render('codigos', {
    codigos,
    user: req.session.user,
    name: req.session.name,
    mensaje
  });
});

/***     INDICES    */

app.get('/indices', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;

            const [indices] = await pool.execute(`SELECT * FROM tbl_insp_indices order by tb_indice`);

            //  Recuperar mensaje de sesión
            const mensaje = req.session.mensaje;
            delete req.session.mensaje;
            res.render('indices', { indices, user: userUser, name: userName, mensaje });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error obteniendo ciudades:', error);
        res.status(500).send('Error al obtener las ciudades');
    }
});


app.post('/indices', async (req, res) => {
    try {
        const { nit, editando } = req.body;
        const id = nit;
        let mensaje;
        let texto;
        
        // Verificar si ya existe
        const [rows] = await pool.execute(
            'SELECT COUNT(*) AS count FROM tbl_insp_indices WHERE tb_indice = ?',
            [nit]
        );

        if (rows[0].count > 0) {
            mensaje = {
                tipo: 'danger',
                texto: 'Ya existe'
            };
        } else {
            // Insertar nuevo proveedor
            await pool.execute(
                `INSERT INTO tbl_insp_indices (tb_indice) VALUES (?)`,
                [nit]
            );

            mensaje = {
                tipo: 'success',
                texto: `Guardada exitosamente. Indice: ${id}` 
                //texto = `Ciudad guardada exitosamente - NIT: ${id}`;
            };
        }

        const [indices] = await pool.execute(`SELECT * FROM tbl_insp_indices order by tb_indice`);
        res.render('indices', { indices, mensaje });

    } catch (error) {

        console.error('Error guardando ciudad:', error);
        const [indices] = await pool.execute(`SELECT * FROM tbl_insp_indices order by tb_indice`);
        res.status(500).render('indices', {
            mensaje: {
                tipo: 'danger',
                texto: 'Error al procesar la solicitud.'
            },
            indices
        });
    }
});

app.get('/indices/delete/:id', async (req, res) => {
    try {
      const id = req.params.id;
      await pool.execute('DELETE FROM tbl_insp_indices WHERE tb_indice = ?', [id]);
      let texto = `Eliminado exitosamente - Indice: ${id}`;
      req.session.mensaje = { tipo: 'success', texto, id };
    } catch (err) {
      const id = req.params.id;  
      let texto = `Error al eliminar: ${id}`;
      if (err.message.includes('foreign key constraint fails')) {
        texto = 'No se puede eliminar porque tiene elementos asociados.'; // Ajusta si hace falta
      }
      req.session.mensaje = { tipo: 'danger', texto, id };
    }
    res.redirect('/indices');
  });

// inspeccion

function getBogotaDateObject() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const bogotaOffsetHours = -5;
  return new Date(utc + bogotaOffsetHours * 3600000);
}

function getWeekDates() {
  // Obtiene el lunes de la semana actual en Bogotá y luego lunes a viernes
  const today = getBogotaDateObject();
  const day = today.getDay(); // domingo=0, lunes=1, ...
  const diffToMonday = day === 0 ? -6 : 1 - day; // Ajuste para lunes (domingo -6 días, otros días offset)
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0); // poner inicio de día para evitar problemas con horas
  monday.setDate(today.getDate() + diffToMonday);

  const abreviaciones = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dates = [];

  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const fechaStr = `${yyyy}-${mm}-${dd}`;

    const nombreCorto = abreviaciones[d.getDay()];

    dates.push({ fecha: fechaStr, nombre: nombreCorto });
  }
  return dates;
}

import { DateTime } from 'luxon';
import { Console } from 'console';

app.get('/inspeccion', async (req, res) => {
  const { tip_func, doc_id } = req.query;
  const conn = await pool.getConnection();
  try {
    const userUser = req.session.user;
    const userName = req.session.name;
    
    // Obtener todos los datos sin filtrar por semana
    const [inspecc] = await conn.execute(`
      SELECT 
        b.id_bloque,
        b.titulo,
        i.no,
        i.aspecto,
        i.fecha_inspeccion,
        i.si,
        i.no_ ,
        i.na,
        i.observacion,
        i.firma
      FROM bloques b
      JOIN items i ON b.id_bloque = i.id_bloque
      where func_doc = ? and ocompra = ?
      ORDER BY b.id_bloque, i.no, i.fecha_inspeccion;
    `, [doc_id, tip_func] );  

    // Extraer fechas únicas reales desde los resultados SQL
    const fechasUnicas = [...new Set(inspecc.map(row =>
      new Date(row.fecha_inspeccion).toISOString().slice(0, 10)
    ))].sort(); // ordena por fecha ascendente

    // Crear array de días en formato { fecha, nombre }
    const abreviaciones = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const dias = fechasUnicas.map(fecha => {
      const diaBogota = DateTime.fromISO(fecha, { zone: 'America/Bogota' });
      const nombre = diaBogota.setLocale('es').toFormat('ccc'); // 'Vie', 'Lun', etc.
      return {
        fecha,
        nombre
      };
    });
    
    // Agrupar por bloques
    const bloquesAgrupados = [];

    inspecc.forEach(row => {
      let bloque = bloquesAgrupados.find(b => b.id_bloque === row.id_bloque);
      if (!bloque) {
        bloque = {
          id_bloque: row.id_bloque,
          titulo: row.titulo,
          items: []
        };
        bloquesAgrupados.push(bloque);
      }

      let item = bloque.items.find(i => i.no === row.no);
      if (!item) {
        item = {
          no: row.no,
          aspecto: row.aspecto,
          valores: {}
        };
        bloque.items.push(item);
      }

      const fechaStr = new Date(row.fecha_inspeccion).toISOString().slice(0, 10);
      item.valores[fechaStr] = {
        si: (row.si || '').trim().toUpperCase(),
        no_: (row.no_ || '').trim().toUpperCase(),
        na: (row.na || '').trim().toUpperCase(),
        observacion: row.observacion || '',
        firma: row.firma || ''
      };
    });

    const mensaje = req.session.mensaje;
    delete req.session.mensaje;

    res.render('inspeccion', {
      inspecc: bloquesAgrupados,
      dias,
      tip_func,
      doc_id,
      user: userUser,
      name: userName,
      mensaje
    });

  } catch (error) {
    console.error('Error obteniendo inspeccion:', error);
    res.status(500).send('Error al obtener inspeccion');
  } finally {
    conn.release();
  }
});

// Endpoint para actualizar
app.post('/api/items/update', (req, res) => {
  const { fecha_inspeccion, no, si, no_, na, observacion } = req.body;
  const item = items.find(i => i.fecha_inspeccion === fecha_inspeccion && i.no === no);
  if (!item) return res.status(404).json({ error: 'Item no encontrado' });

  item.si = si;
  item.no_ = no_;
  item.na = na;
  item.observacion = observacion;

  // Aquí harías la actualización real en la base de datos

  res.json({ success: true });
});


// Inspecciones

app.get('/inspecciones', async (req, res) => {
  if (!req.session.loggedin) return res.redirect('/?expired=1');
  const conn = await pool.getConnection();
  try {
    const userUser = req.session.user;
    const userName = req.session.name;
    const fechaHoraBogota = getBogotaDateTime();

    // Ejecutar consulta
    const [inspecc] = await conn.execute(` 
      SELECT 
        b.id_bloque,
        b.titulo,
        i.no,
        i.aspecto,
        i.si,
        i.no_ ,
        i.na,
        i.firma,
        i.observacion
      FROM bloques b
      JOIN items i ON b.id_bloque = i.id_bloque
      ORDER BY b.id_bloque, i.no;
    `);

    // Agrupar resultados por bloque
    const bloquesAgrupados = [];
    inspecc.forEach(row => {
      let bloque = bloquesAgrupados.find(b => b.id_bloque === row.id_bloque);
      if (!bloque) {
        bloque = {
          id_bloque: row.id_bloque,
          titulo: row.titulo,
          items: []
        };
        bloquesAgrupados.push(bloque);
      }
      bloque.items.push({
        no: row.no,
        aspecto: row.aspecto,
        si: row.si,
        no_: row.no_,
        na: row.na,
        firma: row.firma,
        observacion: row.observacion
      });
    });

    const mensaje = req.session.mensaje;
    delete req.session.mensaje;

    res.render('inspecciones', { inspecc: bloquesAgrupados, user: userUser, name: userName, mensaje });

  } catch (error) {
    console.error('Error obteniendo inspecciones:', error);
    res.status(500).send('Error al obtener inspecciones');
  } finally {
    conn.release(); // Siempre libera la conexión
  }
});
 
// POST CCOSTO

app.post('/inspecciones', async (req, res) => {
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

    res.render('inspecciones', { mensaje, ccosto, unidadT, clienteT, paisesl });

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

    res.status(500).render('inspecciones', {
      mensaje: { tipo: 'danger', texto: 'Error al procesar la solicitud.' },
      ccosto, unidadT, clienteT, paisesl
    });
  } finally {
    conn.release(); // 🔴 Muy importante
  }
});

app.get('/inspecciones/delete/:idcc', async (req, res) => {
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
    res.redirect('/inspecciones');
  });

/* INDICE DESCRIPCIONES /***************************************************************************/

app.get('/indicesbody', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;
            const fechaHoraBogota = getBogotaDateTime();
            const [otrabajo] = await pool.execute(`select a.*,b.descripcion from tbl_insp_body a inner join tbl_insp_opc b on a.indice=b.indice order by indice`);
            const [otrb] = await pool.execute('select * from tbl_otrabajo;');
            const [dise] = await pool.execute('select * from tbl_insp_opc;');

            //  Recuperar mensaje de sesión  idots
            const mensaje = req.session.mensaje;
            delete req.session.mensaje;

            res.render('indicesbody', { otrabajo, otrb, dise, user: userUser, name: userName, mensaje });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error obteniendo otrabajo:', error);
        res.status(500).send('Error al obtener indicesbody');
    }
});

app.get('/valida', (req, res) => {
  const userUser = req.session.unidad;
  res.render('valida', { userUser });
});

app.post('/valreg', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        // Llamada al procedimiento almacenado
        await connection.execute('CALL SP_Validar()'); // Reemplaza 'SP_Validar' con tu nombre real de SP

        // Recuperamos los datos de la tabla tbl_valida
        const [rows] = await connection.execute('SELECT * FROM tbl_valida order by id_activo_numerico desc');

        await connection.commit();

        // Enviar el resultado de la tabla junto con el mensaje de éxito
        res.json({
            status: 'success',
            title: 'Registro Exitoso',
            message: '¡Registrado correctamente!',
            data: rows // Enviamos los datos de la tabla
        });
    } catch (error) {
        console.error('Error saving data:', error);
        await connection.rollback();
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
});


//const { DateTime } = require('luxon'); // si ya usas Luxon

app.get('/detalle-dia', async (req, res) => {
  if (!req.session.loggedin) return res.redirect('/?expired=1');
  const { fecha, tip_func, doc_id } = req.query;
  const conn = await pool.getConnection();
  try {
    if (!fecha) {
      return res.status(400).send('Falta la fecha en la URL');
    }

    // Consulta los datos filtrados por la fecha
    const [items] = await conn.execute(`
      SELECT 
        b.titulo,
        i.no,
        i.aspecto,
        i.si,
        i.no_ ,
        i.na,
        i.observacion
      FROM bloques b
      JOIN items i ON b.id_bloque = i.id_bloque
      WHERE DATE(i.fecha_inspeccion) = ? and func_doc = ? and ocompra = ?
      ORDER BY b.id_bloque, i.no
    `, [fecha, doc_id, tip_func]);

    // Agrupar los datos como lo haces en la principal
    const inspeccion = [];
    items.forEach(row => {
      let bloque = inspeccion.find(b => b.titulo === row.titulo);
      if (!bloque) {
        bloque = {
          titulo: row.titulo,
          items: []
        };
        inspeccion.push(bloque);
      }

      bloque.items.push({
        no: row.no,
        aspecto: row.aspecto,
        si: (row.si || '').toUpperCase(),
        no_: (row.no_ || '').toUpperCase(),
        na: (row.na || '').toUpperCase(),
        observacion: row.observacion || ''
      });
    });

    // Formatear nombre del día
    const diaFormateado = DateTime.fromISO(fecha, { zone: 'America/Bogota' }).setLocale('es').toFormat('cccc dd/MM/yyyy');

    const mensaje = req.session.mensaje;
    delete req.session.mensaje;
    const diaFormateadoRaw = fecha;
    res.render('detalle-dia', {
      diaFormateado,
      diaFormateadoRaw,
      tip_func,
      doc_id,
      inspeccion,
      user: req.session.user,
      name: req.session.name,
      mensaje
    });

  } catch (error) {
    console.error('Error obteniendo detalle del día:', error);
    res.status(500).send('Error al obtener detalle del día');
  } finally {
    if (conn) conn.release(); 
  }
});

// Ejecuta promesas por lotes
async function runInBatches(tasks, batchSize = 20) {
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    await Promise.all(batch.map(task => task()));
  }
}

app.post('/detalle-dia', async (req, res) => {
  const { fecha, datos, tip_func, doc_id } = req.body;

  if (!fecha || !datos) {
    return res.status(400).send('Datos incompletos');
  }

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  console.time('actualizacion-items');

  try {
    const cambios = [];
    const updateTasks = [];

    for (const bloqueIndex in datos) {
      const items = datos[bloqueIndex];

      for (const itemIndex in items) {
        const item = items[itemIndex];
        const { no, opcion, observacion } = item;

        cambios.push(no);

        // En lugar de ejecutar ahora, creamos una función que se ejecutará luego por lotes AQUI
        updateTasks.push(() =>
          conn.execute(
            `
            UPDATE items 
            SET si = ?, no_ = ?, na = ?, observacion = ?
            WHERE no = ? AND DATE(fecha_inspeccion) = ? AND func_doc = ? AND ocompra = ?
            `,
            [
              opcion === 'SI' ? 'x' : '',
              opcion === 'NO' ? 'x' : '',
              opcion === 'NA' ? 'x' : '',
              observacion,
              no,
              fecha,
              doc_id,
              tip_func
            ]
          )
        );
      }
    }

    // Ejecutar los updates por lotes de máximo 20
    await runInBatches(updateTasks, 20);

    await conn.commit();
    console.timeEnd('actualizacion-items');

    req.session.mensaje = 'Cambios guardados correctamente';
    res.redirect(
      `/detalle-dia?fecha=${encodeURIComponent(fecha)}&tip_func=${encodeURIComponent(
        tip_func
      )}&doc_id=${encodeURIComponent(doc_id)}`
    );
  } catch (err) {
    await conn.rollback();
    console.error('Error actualizando:', err);
    res.status(500).send('Error al guardar los cambios');
  } finally {
    conn.release();
  }
});


/* equipo inspeccion */

app.get('/inspasig', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;
            const [[efuncional], [tipodocl], [estados], [perfilf]] = await Promise.all([
            pool.execute(` 
                SELECT a.tipo_id,a.identificador, a.funcionario, a.perfil, a.fechaini, a.estado, a.fechaest, 
                        b.id as idp, b.perfil as perfilp, c.estado as destado
                FROM tbl_efuncional a
                JOIN tbl_perfil b ON a.perfil = b.id
                JOIN tbl_estados c ON a.estado = c.id
                where a.perfil=14
                ORDER BY a.perfil, a.estado;
            `),
            pool.execute('SELECT * FROM tbl_tipodoc'),
            pool.execute('SELECT * FROM tbl_estados'),
            pool.execute('SELECT * FROM tbl_perfil')
            ]);

            //  Recuperar mensaje de sesión
            const mensaje = req.session.mensaje;
            delete req.session.mensaje;
            res.render('inspasig', { efuncional, tipodocl, estados, perfilf, user: userUser, name: userName, mensaje });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error obteniendo funcional:', error);
        res.status(500).send('Error al obtener las funcional');
    }
});

app.get('/respmod', async (req, res) => {
  const idot = req.query.idot;
  const descripcion = req.query.descripcion;

  const [acti] = await pool.execute(
    `SELECT id, task, text, duration, start_date FROM tbl_actividad WHERE type = 'Principal' AND idot = ?`,
    [idot]
  );
  const mensaje = req.session.mensaje;
  res.render('respmod', { idot, descripcion, acti, mensaje });
});

app.post('/modificar-actividad', async(req, res) => {
  const { id, task, text, start_date, duration, idot, descripcion } = req.body;  
  try {
    // actualiza una actividad específica
    await pool.execute(
      `UPDATE tbl_actividad SET text = ?, start_date = ?, duration = ? WHERE idot = ? and task = ?`,
      [text, start_date, duration, idot, task]
    );

    req.session.mensaje = {
      tipo: 'success',
      texto: `Actualizado exitosamente - Actividad: ${task}`,
    };
  } catch (err) {
    console.error('Error al eliminar actividad:', err);
    req.session.mensaje = {
      tipo: 'danger',
      texto: 'No se puede modificar actividad',
    };
  }
  res.redirect(`/respmod?idot=${idot}&descripcion=${encodeURIComponent(descripcion)}`);
});

app.get('/reseli', async (req, res) => {
  const idot = req.query.idot;
  const descripcion = req.query.descripcion;
  const [acti] = await pool.execute(`SELECT task, text FROM tbl_actividad WHERE type = 'Principal' AND idot = ?`,
    [idot]
    );
  res.render('reseli', { idot, descripcion, acti });
});

app.post('/reseli/delete/:task', async (req, res) => {
  const task = req.params.task;
  const { idot, descripcion } = req.body;

  try {
    // Elimina una actividad específica
    await pool.execute('DELETE FROM tbl_actividad WHERE idot = ? AND task = ?', [idot, task]);

    req.session.mensaje = {
      tipo: 'success',
      texto: `Eliminado exitosamente - Actividad: ${task}`,
    };
  } catch (err) {
    console.error('Error al eliminar actividad:', err);
    req.session.mensaje = {
      tipo: 'danger',
      texto: 'No se puede eliminar porque tiene elementos asociados.',
    };
  }
  res.redirect(`/reseli?idot=${idot}&descripcion=${encodeURIComponent(descripcion)}`);
});


// informe 1

app.get('/informe', async (req, res) => {
  if (!req.session.loggedin) return res.redirect('/?expired=1');

  const userCode = req.params.userCode || null;
  try {
    const [usuarios] = await pool.query('SELECT * FROM users');
    const [rows] = await pool.query
      (` 
SELECT a.func_doc,b.funcionario,a.ocompra, a.fecha_inspeccion, a.no, a.aspecto, a.no_, a.observacion 
FROM items a left join tbl_efuncional b
on b.identificador=a.func_doc
WHERE no_ = 'x' OR (observacion IS NOT NULL AND TRIM(observacion) <> '')
      `);
    res.render('informe', {rows});

  } catch (err) {
    console.error('Error cargando ', err);
    res.status(500).send('Error interno del servidor');
  }
});

// xlsx

import ExcelJS from 'exceljs';

app.get('/informe.xlsx', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.func_doc, b.funcionario, a.ocompra, a.fecha_inspeccion, 
             a.no, a.aspecto, a.no_, a.observacion 
      FROM items a 
      LEFT JOIN tbl_efuncional b ON b.identificador = a.func_doc
      WHERE no_ = 'x' OR (observacion IS NOT NULL AND TRIM(observacion) <> '')
      ORDER BY b.funcionario, a.ocompra, a.fecha_inspeccion, a.no
    `);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Informe');

    let lastFuncionario = '';
    let lastFecha = '';

    for (const row of rows) {
      const funcionarioKey = `${row.func_doc}|${row.ocompra}`;
      const fechaKey = new Date(row.fecha_inspeccion).toISOString().slice(0, 10); // 'YYYY-MM-DD'

      // Si cambia el funcionario o centro de costo
      if (funcionarioKey !== lastFuncionario) {
        worksheet.addRow([`Funcionario: ${row.funcionario} (${row.func_doc})`]).font = { bold: true };
        worksheet.addRow([`Centro de Costo: ${row.ocompra}`]);
        worksheet.addRow([]); // espacio

        lastFuncionario = funcionarioKey;
        lastFecha = ''; // resetear la fecha
      }

      // Si cambia la fecha de inspección
      if (fechaKey !== lastFecha) {
        const fechaRow = worksheet.addRow([`Fecha inspección: ${new Date(row.fecha_inspeccion).toLocaleDateString('es-CO')}`]);
        fechaRow.font = { bold: true };
        worksheet.addRow([]);

        const headerRow = worksheet.addRow(['No', 'Aspecto', 'No', 'Observación']);
        headerRow.eachCell(cell => {
          cell.font = { bold: true };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        lastFecha = fechaKey;
      }

      // Agregar fila de datos
      const dataRow = worksheet.addRow([
        row.no,
        row.aspecto,
        row.no_,
        row.observacion
      ]);

      dataRow.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    }

    // Ajustar columnas
    worksheet.columns = [
      { width: 10, alignment: { wrapText: false, vertical: 'top' } },  // No
      { width: 80, alignment: { wrapText: true, vertical: 'top' } },   // Aspecto
      { width: 12, alignment: { wrapText: true, vertical: 'top', horizontal: 'center' } },   // No_
      { width: 50, alignment: { wrapText: true, vertical: 'top' } }    // Observación
    ];

    // Descargar archivo
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=informe.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Error al generar Excel:', err);
    res.status(500).send('Error generando archivo');
  }
});

// pdf

import PdfPrinter from 'pdfmake';

app.get('/informe.pdf', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.func_doc, b.funcionario, a.ocompra, a.fecha_inspeccion, 
             a.no, a.aspecto, a.no_, a.observacion 
      FROM items a 
      LEFT JOIN tbl_efuncional b ON b.identificador = a.func_doc
      WHERE no_ = 'x' OR (observacion IS NOT NULL AND TRIM(observacion) <> '')
      ORDER BY b.funcionario, a.ocompra, a.fecha_inspeccion, a.no
    `);

    const fonts = {
      Roboto: {
        normal: path.join(__dirname, 'fonts', 'Roboto-Regular.ttf'),
        bold: path.join(__dirname, 'fonts', 'Roboto-Bold.ttf'),
        italics: path.join(__dirname, 'fonts', 'Roboto-Italic.ttf'),
        bolditalics: path.join(__dirname, 'fonts', 'Roboto-BoldItalic.ttf'),
      }
    };

    const printer = new PdfPrinter(fonts);
    const content = [];

    let lastFuncionario = '';
    let lastFecha = '';
    let currentTableBody = null;

    for (const row of rows) {
      const funcionarioKey = `${row.func_doc}|${row.ocompra}`;
      const fechaKey = new Date(row.fecha_inspeccion).toISOString().slice(0, 10); // formato 'YYYY-MM-DD'

      // Nuevo grupo de funcionario y centro de costo
      if (funcionarioKey !== lastFuncionario) {
        content.push({ text: `Funcionario: ${row.funcionario} (${row.func_doc})`, style: 'header' });
        content.push({ text: `Centro de Costo: ${row.ocompra}` });
        content.push({ text: '\n' });
        lastFuncionario = funcionarioKey;
        lastFecha = ''; // Reinicia fecha al cambiar de grupo
      }

      // Nueva fecha de inspección
      if (fechaKey !== lastFecha) {
        content.push({
          text: `Fecha inspección: ${new Date(row.fecha_inspeccion).toLocaleDateString('es-CO')}`,
          style: 'fecha'
        });

        currentTableBody = [
          [
            { text: 'No', style: 'tableHeader' },
            { text: 'Aspecto', style: 'tableHeader' },
            { text: 'No', style: 'tableHeader' },
            { text: 'Observación', style: 'tableHeader' }
          ]
        ];

        content.push({
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', '*'],
            body: currentTableBody
          },
          layout: 'lightHorizontalLines'
        });

        lastFecha = fechaKey;
      }

      // Fila de datos
      currentTableBody.push([
        row.no,
        row.aspecto,
        row.no_,
        row.observacion
      ]);
    }

    const docDefinition = {
      content,
      styles: {
        header: {
          bold: true,
          fontSize: 12,
          margin: [0, 10, 0, 5]
        },
        fecha: {
          bold: true,
          fontSize: 11,
          margin: [0, 10, 0, 5]
        },
        tableHeader: {
          bold: true,
          fontSize: 11,
          color: 'black'
        }
      },
      defaultStyle: {
        fontSize: 10
      },
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [40, 60, 40, 40]
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=informe.pdf');

    pdfDoc.pipe(res);
    pdfDoc.end();
    
  } catch (err) {
    console.error('Error generando PDF:', err);
    res.status(500).send('Error al generar PDF');
  }
});

/* ORDEN DE TRABAJO inspeccion /***************************************************************************/

app.get('/inspecotr', async (req, res) => {
  if (!req.session.loggedin) return res.redirect('/?expired=1');
  const { tip_func, doc_id } = req.query;
  const conn = await pool.getConnection();
  try {

    const userUser = req.session.user;
    const userName = req.session.name;
    const fechaHoraBogota = getBogotaDateTime();
    const [
      [otrabajo],
      [prov],
      [dise],
      [supe],
      [sold],
      [ccost]
    ] = await Promise.all([
      conn.execute(`
        SELECT 
          a.idot, 
          a.descripcion, 
          b.identificador, 
          a.proveedor, 
          c.funcionario  
        FROM tbl_otrabajo AS a
        INNER JOIN tbl_dss AS b ON a.idot = b.idot
        INNER JOIN tbl_efuncional AS c ON c.identificador = b.identificador
        WHERE c.identificador = ?
        ORDER BY a.idot;
      `, [doc_id]),
      conn.execute('SELECT * FROM tbl_efuncional WHERE perfil = 1'),
      conn.execute('SELECT * FROM tbl_efuncional WHERE perfil = 2'),
      conn.execute('SELECT * FROM tbl_efuncional WHERE perfil = 3'),
      conn.execute('SELECT * FROM tbl_efuncional WHERE perfil = 4'),
      conn.execute('SELECT * FROM tbl_ccosto')
    ]); 
    const mensaje = req.session.mensaje;
    delete req.session.mensaje;
    res.render('inspecotr', { otrabajo, prov, dise, supe, sold, ccost, user: userUser, name: userName, mensaje });

  } catch (error) {
    console.error('Error obteniendo otrabajo:', error);
    res.status(500).send('Error al obtener inspecotr');
  } finally {
    conn.release();
  }
});

app.get('/vive', (req, res) => {
  res.render('vive'); // Sin la extensión .ejs
});

/************************* */

app.get('/camara', (req, res) => res.render('camara'));
app.get('/visor', (req, res) => res.render('visor'));

// Señalización WebRTC con Socket.IO
io.on('connection', socket => {
  socket.on('offer', data => socket.broadcast.emit('offer', data));
  socket.on('answer', data => socket.broadcast.emit('answer', data));
  socket.on('candidate', data => socket.broadcast.emit('candidate', data));
});


// Puerto de escucha
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running at http://0.0.0.0:${PORT}`);
});




