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

 /* BarraProgreso **********************************************************/

app.get('/barraprogreso', async (req, res) => {
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
  if (!req.session.loggedin) return res.redirect('/');

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

    res.render('otrabajo', { otrabajo, prov, dise, supe, sold, ccost, user: userUser, name: userName, mensaje });
  } catch (error) {
    console.error('Error obteniendo otrabajo:', error);
    res.status(500).send('Error al obtener otrabajo');
  } finally {
    conn.release();
  }
});


app.post('/otrabajo', async (req, res) => {
  if (!req.session.loggedin) return res.redirect('/');

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
        if (!req.session.loggedin) return res.redirect('/');
        
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
        res.status(500).send('Error al obtener otrabajo');
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
            return res.redirect('/');
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
            return res.redirect('/');
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
    if (!req.session.loggedin) return res.redirect('/');

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
    console.error('Error obteniendo otrabajo:', error);
    res.status(500).send('Error al obtener orden de trabajo');
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
  if (!req.session.loggedin) return res.redirect('/');

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
  if (!req.session.loggedin) return res.redirect('/');

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
    res.status(500).send('Error al obtener ccosto');
  } finally {
    conn.release();
  }
});



// Puerto de escucha
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running at http://0.0.0.0:${PORT}`);
});
