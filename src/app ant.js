 // LOCAL

import express, { Router } from 'express';		
import session from 'express-session';		
import mysql from 'mysql2/promise'; // Cambiado para usar mysql2 con promesas		
import dotenv from 'dotenv';
import multer from 'multer';
import bodyParser from 'body-parser';		
import fastcsv from 'fast-csv';
import csv from 'csv-parser'; // CARGAR		
import bcryptjs from 'bcryptjs';		
import Swal from 'sweetalert2';
import fs from 'fs'; // Importación del módulo fs
import crypto from 'crypto';
import { pool } from './db.js';		
import { PORT } from './config.js';
import path from 'path';		
import { fileURLToPath } from 'url';	
import mammoth from 'mammoth'; // docx a pdf
import { componentsToColor, PDFDocument } from 'pdf-lib'; // docx a pdf

// Configuración de rutas y variables		
const app = express();
const __filename = fileURLToPath(import.meta.url);		
const __dirname = path.dirname(__filename);		

// Ruta absoluta al directorio raíz del proyecto
const rootDir = path.join(__dirname, '..');

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, '../views'));

// [cargapoder] - Configuración de Multer - Para Cargar Archivos 

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { empresaId } = req.body; // Obtener el ID de la empresa del formulario
        const uploadDir = path.join('uploads', empresaId); // Crear ruta de la carpeta

        // Crear la carpeta si no existe
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir); // Establecer el destino
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Usar el nombre original del archivo
    }
});

const upload = multer({ storage }); // Crear el middleware de Multer

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        res.send(`Archivo cargado y guardado en ======= ${req.file.path}`);
    } catch (error) {
        console.error('Error al cargar el archivo:', error);
        res.status(500).send('Error al cargar el archivo.');
    }
});


// menus 
 
import { toggleSubmenu } from './menu.js';
import { Console, log } from 'console';
import { identityMatrix } from 'pdf-lib/cjs/types/matrix.js';

// Configuración de sesiones	

app.use(session({
  secret: 'tu-secreto-aqui',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 30 // 30 minutos
  }
}));

/*
app.use((req, res, next) => {
  res.locals.mensaje = req.session.mensaje;
  delete req.session.mensaje;
  next();
});
*/
		
// Middleware		
app.use(express.urlencoded({ extended: true })); // Para procesar formularios con datos codificados en URL
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../src')));
app.use(express.json()); // Para procesar cuerpos JSON, si se envían datos JSON

// Función de alerta		
function showAlert() {		
    Swal.fire({		
        title: 'Conexión Exitosa',		
        text: '!LOGIN Correcto',		
        icon: 'success',		
        showConfirmButton: false,		
        timer: 1500 // Duración en milisegundos (1500 ms = 1.5 segundos)		
    });		
}		


// Rutas 		
//console.log('DB_HOST:', process.env.DB_HOST);  // Debería mostrar la IP o hostname
//console.log('DB_USER:', process.env.DB_USER);  // Debería mostrar 'josema'
//console.log('DB_PASSWORD:', process.env.DB_PASSWORD);  // Debería mostrar la contraseña

app.get('/', async (req, res) => {		
    try {		
        res.render('login');		
    } catch (error) {		
        console.error('Error al renderizar la plantilla:', error);		
        res.status(500).json({ error: 'Error interno del servidor' });		
    }		
});		

// Ruta para descargar archivos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/static', express.static(path.join(__dirname, '../public')));

app.get('/origen/:folder/:filename', (req, res) => {
    const folder = req.params.folder;
    const filename = req.params.filename;
    const filePath = path.join(__dirname, `../uploads/${folder}/`, filename); // ruta de donde toma el archivo

    // Usar express para enviar el archivo
    res.download(filePath, (err) => {
        if (err) {
            console.error('Error al descargar el archivo:', err);
            res.status(500).send('Error al descargar el archivo.');
        }
    });
});

/*** VIEWS ****************************************************************************************/

// Rutas para manejar el login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    return res.status(401).json({ message: 'Credenciales incorrectas' });
});

app.get('/menuprc', (req, res) => {
    if (req.session.loggedin) {
        const { user, name, rol } = req.session;
        const userUser = req.session.unidad;
        res.render('menuprc', { user, name, rol, userUser });
    } else {
        res.redirect('/');
    }
});

/* CCOSTO */  /*************************************************************************************/

app.get('/ccosto', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;


            const [ccosto] = await pool.execute(` 
                SELECT a.*, b.cliente as clienteN






                FROM tbl_ccosto a
                JOIN tbl_cliente b ON a.cliente = b.nit;
            `);

            const [unidadT] = await pool.execute('SELECT * FROM tbl_unidad');
            const [clienteT] = await pool.execute('SELECT * FROM tbl_cliente order by cliente');

            
            //  Recuperar mensaje de sesión
            const mensaje = req.session.mensaje;
            delete req.session.mensaje;

            res.render('ccosto', { ccosto, unidadT, clienteT, user: userUser, name: userName, mensaje });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error obteniendo ccosto:', error);
        res.status(500).send('Error al obtener ccosto');
    }
});

// Crear o actualizar ciudad
app.post('/ccosto', async (req, res) => {
    try {
        const { idcc, descripcion, ocompra, cliente, fecha_orden, fecha_entrega, cantidad, unidad, peso, comentarios, editando } = req.body;
        let mensaje;
        let texto;
        
        if (editando === "true") {
            // Actualizar Ciudad
            await pool.execute(
                `UPDATE tbl_ccosto SET descripcion= ?, ocompra= ?, cliente= ?, fecha_orden= ?, fecha_entrega= ?, cantidad= ?, unidad= ?, peso= ?, comentarios= ? WHERE idcc = ?`,
                [descripcion, ocompra, cliente, fecha_orden, fecha_entrega, cantidad, unidad, peso, comentarios, idcc]
            );
            mensaje = {
                tipo: 'success',
                texto: 'Centro de costo actualizado exitosamente.'
            };
        } else {

            // Verificar si Ciudad ya existe
            const [rows] = await pool.execute(
                'SELECT COUNT(*) AS count FROM tbl_ccosto WHERE idcc = ?',
                [idcc]
            );

            if (rows[0].count > 0) {
                mensaje = {
                    tipo: 'danger',
                    texto: 'Ya existe Centro de Costo'
                };
            } else {

                // Insertar nuevo proveedor
                const comentarios = req.body.comentarios?.trim();
                await pool.execute(
                    `INSERT INTO tbl_ccosto (idcc, descripcion, ocompra, cliente, fecha_orden, fecha_entrega, cantidad, unidad, peso, comentarios) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [idcc, descripcion, ocompra, cliente, fecha_orden, fecha_entrega, cantidad, unidad, peso, comentarios]
                );
                mensaje = {
                    tipo: 'success',
                    texto: `Centro de Costo guardado exitosamente. : ${idcc}` 
                };
            }
        }

        // Obtener clientes

        const [ccosto] = await pool.execute(`
                SELECT a.*, b.cliente as clienteN
                FROM tbl_ccosto a
                JOIN tbl_cliente b ON a.cliente = b.nit;
            `);

        const [unidadT] = await pool.execute('SELECT * FROM tbl_unidad'); /* paisesl */
        const [clienteT] = await pool.execute('SELECT * FROM tbl_cliente order by cliente');
    
        // Renderizar la vista con el mensaje y la lista de proveedores
        res.render('ccosto', {
            mensaje,
            ccosto,
            unidadT,
            clienteT
        });

    } catch (error) {

        console.error('Error guardando ciudad:', error);
        const [ccosto] = await pool.execute(`
                SELECT a.*, b.cliente as clienteN
                FROM tbl_ccosto a
                JOIN tbl_cliente b ON a.cliente = b.nit;
        `);
        const [unidadT] = await pool.execute('SELECT * FROM tbl_unidad'); /* paisesl */
        const [clienteT] = await pool.execute('SELECT * FROM tbl_cliente order by cliente');


        res.status(500).render('ccosto', {
            mensaje: {
                tipo: 'danger',
                texto: 'Error al procesar la solicitud.'
            },
            ccosto,
            unidadT,
            clienteT

        });
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

app.get('/modal', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;

            //const id = req.params.id;
            const id = req.query.idcc;

            //const id = 1792;
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
                comentarios: row.comentarios.replace(/(\r\n|\n|\r)/g, '<br>'),
                FechaOrden: row.fecha_orden.toISOString().split('T')[0],
                FechaEntrega: row.fecha_entrega.toISOString().split('T')[0]
            };
           
            //  Recuperar mensaje de sesión
            const mensaje = req.session.mensaje;
            delete req.session.mensaje;

            res.render('modal', { datos: data });

        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error obteniendo ccosto:', error);
        res.status(500).send('Error al obtener ccosto');
    }
});



/* ORDEN DE TRABAJO /***************************************************************************/

app.get('/otrabajo', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;

            /* ciudades */
            const [otrabajo] = await pool.execute(` 
                SELECT a.*, b.funcionario as clienteN
                FROM tbl_otrabajo a
                LEFT JOIN tbl_efuncional b ON a.proveedor = b.identificador;
            `);










            const [prov] = await pool.execute('select * from tbl_efuncional where perfil=1;');
            const [dise] = await pool.execute('select * from tbl_efuncional where perfil=2;');
            const [supe] = await pool.execute('select * from tbl_efuncional where perfil=3;');
            const [sold] = await pool.execute('select * from tbl_efuncional where perfil=4;');
            

            //  Recuperar mensaje de sesión
            const mensaje = req.session.mensaje;
            delete req.session.mensaje;

            res.render('otrabajo', { otrabajo, prov, dise, supe, sold, user: userUser, name: userName, mensaje });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error obteniendo otrabajo:', error);
        res.status(500).send('Error al obtener otrabajo');
    }
});
  
// Crear o actualizar ciudad
app.post('/otrabajo', async (req, res) => {
    try {
        const { idot, descripcion, proveedor, disenador, supervisor, soldador, observacion, editando } = req.body;
        let mensaje;
        let texto;
        
        if (editando === "true") {
            // Actualizar Ciudad
            await pool.execute(
                `UPDATE tbl_otrabajo SET descripcion= ?, proveedor= ?, disenador= ?, supervisor= ?, soldador= ?, observacion= ? WHERE idot = ?`,
                [descripcion, proveedor, disenador, supervisor, soldador, observacion, idot]
            );
            mensaje = {
                tipo: 'success',
                texto: 'Centro de costo actualizado exitosamente.'
            };
        } else {
            // Verificar si Ciudad ya existe
            const [rows] = await pool.execute(
                'SELECT COUNT(*) AS count FROM tbl_otrabajo WHERE idot = ?',
                [idot]
            );

            if (rows[0].count > 0) {
                mensaje = {
                    tipo: 'danger',
                    texto: 'Ya existe Orden de Trabajo'
                };
            } else {

                // Insertar nuevo proveedor
                const comentarios = req.body.comentarios?.trim();
                const fechaHoraBogota = getBogotaDateTime();
                await pool.execute(
                    `INSERT INTO tbl_otrabajo (idot, descripcion, proveedor, disenador, supervisor, soldador, observacion, fecharg) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [idot, descripcion, proveedor, disenador, supervisor, soldador, observacion, fechaHoraBogota]
                );
                mensaje = {
                    tipo: 'success',
                    texto: `Orden de Trabajo guardado exitosamente. : ${idot}` 
                };
            }
        }
        // Obtener clientes

        const [otrabajo] = await pool.execute(`
                SELECT a.*, b.funcionario as clienteN
                FROM tbl_otrabajo a
                LEFT JOIN tbl_efuncional b ON a.proveedor = b.identificador;
            `);












            const [prov] = await pool.execute('select * from tbl_efuncional where perfil=1;');
            const [dise] = await pool.execute('select * from tbl_efuncional where perfil=2;');
            const [supe] = await pool.execute('select * from tbl_efuncional where perfil=3;');
            const [sold] = await pool.execute('select * from tbl_efuncional where perfil=4;');

    
        // Renderizar la vista con el mensaje y la lista de proveedores
        res.render('otrabajo', {
            mensaje,
            otrabajo,
            prov,
            dise,
            supe,
            sold
        });

    } catch (error) {

        console.error('Error guardando ciudad:', error);
        const [otrabajo] = await pool.execute(`
                SELECT a.*, b.funcionario as clienteN
                FROM tbl_otrabajo a
                LEFT JOIN tbl_efuncional b ON a.proveedor = b.identificador;
        `);
        const [prov] = await pool.execute('select * from tbl_efuncional where perfil=1;');
        const [dise] = await pool.execute('select * from tbl_efuncional where perfil=2;');
        const [supe] = await pool.execute('select * from tbl_efuncional where perfil=3;');
        const [sold] = await pool.execute('select * from tbl_efuncional where perfil=4;');

        res.status(500).render('otrabajo', {
            mensaje: {
                tipo: 'danger',
                texto: 'Error al procesar la solicitud.'
            },
            otrabajo,
            prov,
            dise,
            supe,
            sold
        });
    }
});

function getBogotaDateTime() {
    const now = new Date();
  
    // Convertir a tiempo UTC
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  
    // Bogotá está en UTC-5
    const bogotaOffset = -5; // en horas
    const bogotaTime = new Date(utc + 3600000 * bogotaOffset);
  
    // Formatear a 'YYYY-MM-DD HH:mm:ss'
    const yyyy = bogotaTime.getFullYear();
    const mm = String(bogotaTime.getMonth() + 1).padStart(2, '0');
    const dd = String(bogotaTime.getDate()).padStart(2, '0');
    const hh = String(bogotaTime.getHours()).padStart(2, '0');
    const min = String(bogotaTime.getMinutes()).padStart(2, '0');
    const ss = String(bogotaTime.getSeconds()).padStart(2, '0');
  
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  }
  

app.get('/otrabajo/delete/:idot', async (req, res) => {
    const idot = req.params.idot;
    try {
      await pool.execute('DELETE FROM tbl_otrabajo WHERE idots = ?', [idot]);
      req.session.mensaje = {
        tipo: 'success',
        texto: `Eliminado exitosamente - ID: ${idot}`
      };
    } catch (err) {

      let texto = `Error al eliminar C. Costo - ID: ${idot}`;
      if (err.message.includes('foreign key constraint fails')) {
        texto = 'No se puede eliminar porque tiene elementos asociados.';
      }
      req.session.mensaje = { tipo: 'danger', texto };
    }



    res.redirect('/otrabajo');
  });


/* MODAL PANTALLA CCOSTO*/  

app.get('/modalot', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;
            const id = req.query.idot;
            const [rows] = await pool.execute(`
                SELECT a.*, b.funcionario as prov, c.funcionario as dise, d.funcionario as supe, e.funcionario as sold
                FROM tbl_otrabajo a
                LEFT JOIN tbl_efuncional b ON a.proveedor = b.identificador
                LEFT JOIN tbl_efuncional c ON a.disenador = c.identificador
                LEFT JOIN tbl_efuncional d ON a.supervisor = d.identificador
                LEFT JOIN tbl_efuncional e ON a.soldador = e.identificador
                WHERE idot = ?
            `, [id]);

            const row = rows[0]; // obtenemos la primera fila
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
                comentarios: row.observacion.replace(/(\r\n|\n|\r)/g, '<br>'),
            };
           
            //  Recuperar mensaje de sesión
            const mensaje = req.session.mensaje;
            delete req.session.mensaje;

            res.render('modalot', { datos: data });

        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error obteniendo otrabajo:', error);
        res.status(500).send('Error al obtener otrabajo');
    }
});

app.get('/modalotcc', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;
            const id = req.query.idot;
            const [rows] = await pool.execute(`SELECT * FROM tbl_otrabajo WHERE idot = ?`, [id]);
            const row = rows[0]; // obtenemos la primera fila
            const data = {
                cc: row.idot,
                descripcion: row.descripcion,
                oc: row.proveedor,
                cliente: row.disenador,
                cantidad: row.supervisor,
                comentarios: row.observacion.replace(/(\r\n|\n|\r)/g, '<br>'),
            };
           
            //  Recuperar mensaje de sesión
            const mensaje = req.session.mensaje;
            delete req.session.mensaje;

            res.render('modalotcc', { datos: data });

        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error obteniendo otrabajo:', error);
        res.status(500).send('Error al obtener otrabajo');
    }
});

/* ACTIVIDADES /***************************************************************************/

app.get('/actividades', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;

            /* ciudades */
            const [otrabajo] = await pool.execute(` 
                SELECT a.*, b.funcionario as clienteN
                FROM tbl_otrabajo a
                LEFT JOIN tbl_efuncional b ON a.proveedor = b.identificador;
            `);

            const [prov] = await pool.execute('select * from tbl_efuncional where perfil=1;');
            const [dise] = await pool.execute('select * from tbl_efuncional where perfil=2;');
            const [supe] = await pool.execute('select * from tbl_efuncional where perfil=3;');
            const [sold] = await pool.execute('select * from tbl_efuncional where perfil=4;');
            
            //  Recuperar mensaje de sesión
            const mensaje = req.session.mensaje;
            delete req.session.mensaje;

            res.render('actividades', { otrabajo, prov, dise, supe, sold, user: userUser, name: userName, mensaje });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error obteniendo otrabajo:', error);
        res.status(500).send('Error al obtener otrabajo');
    }
});

/* ACTIVIDADES **********************************************************/

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
    const { idot, taskname, taskStartDate, taskDuration } = req.body;
    let safeIdot = idot;
    if (typeof idot !== 'string' && typeof idot !== 'number') {
        console.error("IDOT no es un string ni un número válido:", idot);
        return res.status(400).send('IDOT inválido');
    }
    safeIdot = String(idot).trim();
    const [rowsTask] = await pool.execute(
        `SELECT COALESCE(MAX(task), 0) + 1 AS siguiente_task FROM tbl_actividad WHERE idot = ?`,
        [safeIdot]
    );
    const [rowsId] = await pool.execute(
        `SELECT COALESCE(MAX(id), 0) + 1 AS siguiente_id FROM tbl_actividad  WHERE idot = ?`,
        [safeIdot]
    );
    const ultid = rowsId[0].siguiente_id;
    const ulttask = rowsTask[0].siguiente_task;
    await pool.execute(
    'INSERT INTO tbl_actividad (id, task, idot, text, start_date, duration, progress, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [ultid, ulttask, idot, taskname + ' (Planificada)', taskStartDate, taskDuration, 1, 'Principal']
    );
    await pool.execute(
    'INSERT INTO tbl_actividad (id, task, idot, text, start_date, duration, progress, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [ultid + 1, ulttask,idot, taskname, taskStartDate, taskDuration, 0, 'Real']
    );
    const descripcion = req.body.descripcion; // si es que viene del formulario
    res.redirect(`/respuesta?idot=${idot}&descripcion=${encodeURIComponent(descripcion)}`);
  } catch (error) {
    console.error('Error al guardar actividad:', error);
    res.status(500).send('Error al guardar actividad');
  }
});

// TAREAS -------------------------------- AQUI

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


//  Complementar
app.get('/complementar', async (req, res) => {
  const idot = req.query.idot;
  const descripcion = req.query.descripcion;

  const [acti] = await pool.execute(
    `SELECT id, task, text, duration, start_date FROM tbl_actividad WHERE type = 'Principal' AND idot = ?`,
    [idot]
  );
  res.render('complementar', { idot, descripcion, acti });
});

/** respmod ******************************************************************/

app.get('/respmod', async (req, res) => {
  const idot = req.query.idot;
  const descripcion = req.query.descripcion;

  const [acti] = await pool.execute(
    `SELECT id, task, text, duration, start_date FROM tbl_actividad WHERE type = 'Principal' AND idot = ?`,
    [idot]
  );
  res.render('respmod', { idot, descripcion, acti });
});

/** reseli ******************************************************************/

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

// Ruta POST para modificar actividad  -  AQUI -
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
  

/* CIUDADES *************************************************************************************************/

app.get('/ciudades', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;

            const [ciudades] = await pool.execute(`
                SELECT c.*, p.nombre AS pais_nombre
                FROM tbl_ciudad c
                JOIN tbl_paises p ON c.pais_codigo = p.iso_pais
            `);
            const [paises] = await pool.execute('SELECT * FROM tbl_paises');

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

        // Obtener los proveedores actualizados
        const [ciudades] = await pool.execute(`
            SELECT c.*, p.nombre AS pais_nombre
            FROM tbl_ciudad c
            JOIN tbl_paises p ON c.pais_codigo = p.iso_pais
        `);
        const [paises] = await pool.execute('SELECT * FROM tbl_paises');

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
  
/* proveedores */

app.get('/proveedor', async (req, res) => {
    try {
      if (req.session.loggedin) {
        const userUser = req.session.user;
        const userName = req.session.name;
  
        const [proveedor] = await pool.execute('SELECT * FROM tbl_proveedor');
        const mensaje = req.session.mensaje;
        delete req.session.mensaje;
  
        res.render('proveedor', { proveedor, user: userUser, name: userName, mensaje });
      } else {
        res.redirect('/');
      }
    } catch (error) {
      console.error('Error obteniendo proveedor:', error);
      res.status(500).send('Error al obtener los proveedores');
    }
  });
  
  
// Crear   proveedor (solo si no existe)
app.post('/proveedor', async (req, res) => {
    try {
        const { nit, nombre, editando } = req.body;

        let mensaje;

        if (editando === "true") {
            // Actualizar el proveedor
            await pool.execute(
                `UPDATE tbl_proveedor SET nombre = ? WHERE nit = ?`,
                [nombre, nit]
            );

            mensaje = {
                tipo: 'success',
                texto: 'Proveedor actualizado exitosamente.'
            };
        } else {
            // Verificar si el proveedor ya existe
            const [rows] = await pool.execute(
                'SELECT COUNT(*) AS count FROM tbl_proveedor WHERE nit = ?',
                [nit]
            );

            if (rows[0].count > 0) {
                mensaje = {
                    tipo: 'danger',
                    texto: 'Ya existe un proveedor con este NIT.'
                };
            } else {
                // Insertar nuevo proveedor
                await pool.execute(
                    `INSERT INTO tbl_proveedor (nit, nombre) VALUES (?, ?)`,
                    [nit, nombre]
                );

                mensaje = {
                    tipo: 'success',
                    texto: 'Proveedor guardado exitosamente.'
                };
            }
        }

        // Obtener los proveedores actualizados
        const [proveedor] = await pool.execute('SELECT * FROM tbl_proveedor');

        // Renderizar la vista con el mensaje y la lista de proveedores
        res.render('proveedor', {
            mensaje,
            proveedor
        });

    } catch (error) {
        console.error('Error procesando la solicitud:', error);

        const [proveedor] = await pool.execute('SELECT * FROM tbl_proveedor');

        res.status(500).render('proveedor', {
            mensaje: {
                tipo: 'danger',
                texto: 'Error al procesar la solicitud.'
            },
            proveedor
        });
    }
});

app.get('/proveedor/delete/:id', async (req, res) => {
    try {
      const id = req.params.id;
      await pool.execute('DELETE FROM tbl_proveedor WHERE nit = ?', [id]);
      req.session.mensaje = { tipo: 'warning', texto: 'Proveedor eliminado exitosamente.' };
    } catch (error) {
      let texto = 'Error al eliminar proveedor.';
      if (error.message.includes('foreign key constraint fails')) {
        texto = 'No se puede eliminar el proveedor porque tiene registros asociados.';
      }
      req.session.mensaje = { tipo: 'danger', texto };
    }
    res.redirect('/proveedor');
});

/***     CLIENTES    */

app.get('/clientes', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;

            const [ciudades] = await pool.execute(`
                SELECT c.*, p.nombre AS pais_nombre
                FROM tbl_cliente c
                JOIN tbl_paises p ON c.pais = p.iso_pais
                order by pais, nit 
            `);

            const [paisesl] = await pool.execute('SELECT * FROM tbl_paises');
            const [ciudadl] = await pool.execute('SELECT * FROM tbl_ciudad');
            
            //  Recuperar mensaje de sesión
            const mensaje = req.session.mensaje;
            delete req.session.mensaje;

            res.render('clientes', { ciudades, paisesl, ciudadl, user: userUser, name: userName, mensaje });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error obteniendo ciudades:', error);
        res.status(500).send('Error al obtener las ciudades');
    }
});

/***   CODIGOS ***/

app.get('/codigos', async (req, res) => {
    try {
        if (!req.session.loggedin) {
            return res.redirect('/');
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
        console.error('Error al obtener los datos:', error);
        res.status(500).send('Error al obtener los datos');
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


/* CLIENTES *************************************************************************************************/

app.post('/clientes', async (req, res) => {
    try {
        const { nit, cliente, telefono, celular1, celular2, correo, direccion, pais, ciudad, contacto, editando } = req.body;
        const id = nit;
        let mensaje;
        let texto;
        
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
                    `INSERT INTO tbl_cliente (nit, cliente, telefono, celular1, celular2, correo, direccion, pais, ciudad, contacto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [nit, cliente, telefono, celular1, celular2, correo, direccion, pais, ciudad, contacto]
                );
                mensaje = {
                    tipo: 'success',
                    texto: `Ciudad guardada exitosamente. Nit: ${id}` 
                    //texto = `Ciudad guardada exitosamente - NIT: ${id}`;
                };
            }
        }

        // Obtener clientes

        const [ciudades] = await pool.execute(`
            SELECT c.*, p.nombre AS pais_nombre
            FROM tbl_cliente c
            JOIN tbl_paises p ON c.pais = p.iso_pais
        `);

        const [paisesl] = await pool.execute('SELECT * FROM tbl_paises');
        const [ciudadl] = await pool.execute('SELECT * FROM tbl_ciudad');

        // Renderizar la vista con el mensaje y la lista de proveedores
        res.render('clientes', {
            mensaje,
            ciudades,
            paisesl,
            ciudadl
        });

    } catch (error) {

        console.error('Error guardando ciudad:', error);
        const [ciudades] = await pool.execute(`
            SELECT c.*, p.nombre AS pais_nombre
            FROM tbl_ciudad c
            JOIN tbl_paises p ON c.pais_codigo = p.iso_pais
        `);
        const [paisesl] = await pool.execute('SELECT * FROM tbl_paises');
        const [ciudadl] = await pool.execute('SELECT * FROM tbl_ciudad');
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

// Supongamos que estás usando Node.js con Express
app.get('/ciudades/:paisCodigo', async (req, res) => {
    const paisCodigo = req.params.paisCodigo;
    
    // Aquí haces la lógica para obtener las ciudades filtradas
    //const ciudades = ciudadl.filter(c => c.iso_pais === paisCodigo);
    const [ciudades] = await pool.execute("SELECT * FROM tbl_ciudad where pais_codigo = ?", [paisCodigo]);
    res.json(ciudades);
  });
  
/**************************************************************** */

/* EQUIPO FUNCIONAL */

app.get('/efuncional', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;

            /* ciudades */
            const [efuncional] = await pool.execute(` 
                SELECT a.tipo_id,a.identificador, a.funcionario, a.perfil, a.fechaini, a.estado, a.fechaest, b.id as idp, b.perfil as perfilp, c.estado as destado
                FROM tbl_efuncional a
                JOIN tbl_perfil b ON a.perfil = b.id
                JOIN tbl_estados c ON a.estado = c.id
                order by a.perfil, a.estado;
            `);

            const [tipodocl] = await pool.execute('SELECT * FROM tbl_tipodoc'); /* paisesl */
            const [estados] = await pool.execute('SELECT * FROM tbl_estados'); /* paisesl */
            const [perfilf] = await pool.execute('SELECT * FROM tbl_perfil');  /* ciudadl */
            
            //  Recuperar mensaje de sesión
            const mensaje = req.session.mensaje;
            delete req.session.mensaje;

            res.render('efuncional', { efuncional, tipodocl, estados, perfilf, user: userUser, name: userName, mensaje });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error obteniendo funcional:', error);
        res.status(500).send('Error al obtener las funcional');
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

        const [efuncional] = await pool.execute(`
                SELECT a.tipo_id,a.identificador, a.funcionario, a.perfil, a.fechaini, a.estado, a.fechaest, b.id as idp, b.perfil as perfilp, c.estado as destado
                FROM tbl_efuncional a
                JOIN tbl_perfil b ON a.perfil = b.id
                JOIN tbl_estados c ON a.estado = c.id
                order by a.perfil, a.estado;
            `);

        const [tipodocl] = await pool.execute('SELECT * FROM tbl_tipodoc');
        const [estados] = await pool.execute('SELECT * FROM tbl_estados');
        const [perfilf] = await pool.execute('SELECT * FROM tbl_perfil');
        
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
        const [efuncional] = await pool.execute(`
                SELECT a.tipo_id,a.identificador, a.funcionario, a.perfil, a.fechaini, a.estado, a.fechaest, b.id as idp, b.perfil as perfilp, c.estado as destado
                FROM tbl_efuncional a
                JOIN tbl_perfil b ON a.perfil = b.id
                JOIN tbl_estados c ON a.estado = c.id
                order by a.perfil, a.estado;
        `);
        const [tipodocl] = await pool.execute('SELECT * FROM tbl_tipodoc');
        const [estados] = await pool.execute('SELECT * FROM tbl_estados');
        const [perfilf] = await pool.execute('SELECT * FROM tbl_perfil');
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


/*** C COSTO CONSULTAR ********/ 

app.get('/otrabajocc', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;
            const [otrabajo] = await pool.execute(` 
                SELECT a.*, b.cliente as clienteN
                FROM tbl_otrabajo a
                JOIN tbl_cliente b ON a.cliente = b.nit;
            `);
            const [unidadT] = await pool.execute('SELECT * FROM tbl_unidad');
            const [clienteT] = await pool.execute('SELECT * FROM tbl_cliente order by cliente');
            
            //  Recuperar mensaje de sesión
            const mensaje = req.session.mensaje;
            delete req.session.mensaje;
            res.render('otrabajocc', { otrabajo, unidadT, clienteT, user: userUser, name: userName, mensaje });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error obteniendo otrabajo:', error);
        res.status(500).send('Error al obtener otrabajo');
    }
});



app.get('/usuarios', async (req, res) => {
    try {
        const tableName = "users";
        const [rows] = await pool.execute(`select * from ${tableName}`);
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;
            res.render('usuarios', { data: rows, user: userUser, name: userName });

        } else {
            res.redirect('/');
        }
    } catch (error) {
                console.error('Error conectando a la base de datos....????:', error);
                res.status(500).send('Error conectando a la base de datos.?????');
            }
    });

// Consulta Usuarios

app.get('/consultausr', (req, res) => {
    if (req.session.loggedin) {
        res.render('consultausr');
    } else {
        res.redirect('/');
    }
});

app.post('/consultausr', async (req, res) => {
    try {
        const { UsuarioNew } = req.body;
        if (!UsuarioNew) {
            return res.status(400).json({ status: 'error', message: 'Todos los campos son obligatorios' });
        }

        const [rows] = await pool.execute('SELECT * FROM users WHERE numprop = ?', [UsuarioNew]);
        if (rows.length > 0) {
            // Usuario encontrado, enviar los datos
            return res.json({
                status: 'success',
                message: 'Usuario encontrado',
                user: rows[0] // Puedes enviar el primer resultado (o todos si es necesario)
            });            

        }
        res.json({ status: 'success', message: '¡Usuario no existe!' });
    } catch (error) {

        console.error('Error en consulta de usuario:', error);
        res.status(500).json({ status: 'error', message: 'Error en el servidor' });
    }
});

// Usuarios -Resetear CONTRASEÑAS

app.get('/usuariosreset', async (req, res) => {
    try {
        const tableName = "users";
        const [rows] = await pool.execute(`select * from ${tableName}`);
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;
            res.render('usuariosreset', { data: rows, user: userUser, name: userName });

        } else {
            res.redirect('/');
        }
    } catch (error) {
                console.error('Error conectando a la base de datos....????:', error);
                res.status(500).send('Error conectando a la base de datos.?????');
            }
    });


   
app.get('/opciones', (req, res) => {
    res.render('opciones');
  });
// [login] - Autenticacion

app.post('/auth', async (req, res) => {
    // variables de ejs
    const { unidad, user, pass } = req.body;
    
    // Valida Usuario
    const tableName = 'users';
    const [rows] = await pool.execute(`SELECT * FROM ${tableName} WHERE user = ?`, [user]);
    
    if (rows.length === 0) {
        return res.json({ status: 'error', message: 'Usuario no encontrado' });
    }
    const userRecord = rows[0];
    const passwordMatch = await bcryptjs.compare(pass, userRecord.pass);
    
    if (!passwordMatch) {
        return res.json({ status: 'error', message: 'Contraseña incorrecta' });
    }

    req.session.loggedin = true;
    req.session.user = userRecord.user; // mantener la información del usuario entre diferentes solicitudes durante su sesión (COMPARTIR).
    req.session.name = userRecord.name; // mantener la información del usuario entre diferentes solicitudes durante su sesión (COMPARTIR).
    req.session.rol = userRecord.rol;
    req.session.pass = userRecord.pass;
    req.session.numprop = userRecord.numprop;

    // Verifica si ya hay una sesión activa
    //if (req.session.username) {
    //    return res.status(400).json({ message: 'Ya estás logueado' });
    //}

    // Si no, guarda la sesión
    req.session.username = user;
    return res.json({ status: 'success', message: '!LOGIN Correcto!' });
});

// End - [login]

export const storagepdf = multer.diskStorage({
    destination: (req, file, cb) => {
        const { empresaId } = req.body; // Obtener el ID de la empresa del formulario
        const uploadDir = path.join('uploads', empresaId); // Crear ruta de la carpeta
        // Crear la carpeta si no existe
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir); // Establecer el destino
    },
    filename: (req, file, cb) => {
        const numprop = req.body.Inumprop; // Usar el valor del formulario
        const Anumprop = req.body.Ipropoder; // Usar el valor del formulario
        const newFileName = `PODER_${Anumprop}_${numprop}${path.extname(file.originalname)}`;
        cb(null, newFileName); // Establecer el nombre del archivo
    }
});

const uploadpdf = multer({ storage: storagepdf }); // Usar el almacenamiento configurado


// [register] - Adicionar Usuario
app.post('/register', async (req, res) => {
    try {
        const rz = '1';
        const id_rz = 'Propiedad';
        const { UsuarioNew, UsuarioNom, rol, PassNew, numpropNew, coeficiente } = req.body;
        if (!UsuarioNew || !UsuarioNom || !rol || !PassNew) {
            return res.status(400).json({ status: 'error', message: 'Todos los campos son obligatorios' });
        }

        const [rows] = await pool.execute('SELECT * FROM users WHERE user = ?', [UsuarioNew]);
        if (rows.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Usuario ya Existe' });
        }

        // Insertar nuevo usuario
        const passwordHash = await bcryptjs.hash(PassNew, 8);
        await pool.execute('INSERT INTO users (rz, id_rz, user, name, pass, rol, estado, numprop, coeficiente ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [rz, id_rz, UsuarioNew, UsuarioNom, passwordHash, rol, null, numpropNew, coeficiente]);
        res.json({ status: 'success', message: '¡Usuario registrado correctamente!' });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ status: 'error', message: 'Error en el servidor' });
    }
});

// End - [register]

//  Acabados

app.get('/acabados', (req, res) => {
    res.render('acabados');
});
 


/*** C COSTO CONSULTAR ********/ 

app.get('/ccostocc', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;

            const [ccosto] = await pool.execute(` 
                SELECT a.*, b.cliente as clienteN
                FROM tbl_ccosto a
                JOIN tbl_cliente b ON a.cliente = b.nit;
            `);

            const [unidadT] = await pool.execute('SELECT * FROM tbl_unidad');
            const [clienteT] = await pool.execute('SELECT * FROM tbl_cliente order by cliente');
            
            //  Recuperar mensaje de sesión
            const mensaje = req.session.mensaje;
            delete req.session.mensaje;

            res.render('ccostocc', { ccosto, unidadT, clienteT, user: userUser, name: userName, mensaje });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error obteniendo ccosto:', error);
        res.status(500).send('Error al obtener ccosto');
    }
});

// *************************************** //

/***   CCOSTO  ESTADO  */

app.get('/ccoest', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;
            const [ccoest] = await pool.execute(`SELECT * FROM tbl_estcco order by cco_idest`);
    
            //  Recuperar mensaje de sesión
            const mensaje = req.session.mensaje;
            delete req.session.mensaje;

            res.render('ccoest', { ccoest, user: userUser, name: userName, mensaje });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error obteniendo ciudades:', error);
        res.status(500).send('Error al obtener los Estado');
    }
});

// *************************************** //
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

/// CERRAR CONEXIONES :  connection.release(); //


