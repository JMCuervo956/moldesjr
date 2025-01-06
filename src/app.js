 // Importaciones de módulos de terceros		
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
//import fs from 'fs/promises';
import fs from 'fs'; // Importación del módulo fs
import crypto from 'crypto';
//import * as pdfjsLib from 'pdfjs-dist/webpack';

// Importaciones de archivos locales		
import { pool } from './db.js';		
import { PORT } from './config.js';		
import path from 'path';		
import { fileURLToPath } from 'url';	
import mammoth from 'mammoth'; // docx a pdf
import { PDFDocument } from 'pdf-lib'; // docx a pdf
//import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'; // Importación correcta para ESM

// Función para cargar y leer un archivo PDF
/*
async function cargarPdf(rutaArchivo) {
    // Lee el archivo PDF
    const pdfBytes = fs.readFileSync(rutaArchivo);
  
    // Crea un documento PDF con los bytes leídos
    const pdfDoc = await PDFDocument.load(pdfBytes);
  
    // Obtiene el número de páginas en el documento
    const totalPaginas = pdfDoc.getPageCount();
  
    console.log(`Este PDF tiene ${totalPaginas} página(s).`);
  
    // Opcional: Puedes hacer modificaciones en el PDF aquí (añadir texto, imágenes, etc.)
  
    // Guarda el documento modificado en un nuevo archivo
    const pdfModificado = await pdfDoc.save();
  
    // Escribe el PDF modificado a un nuevo archivo
    fs.writeFileSync('output.pdf', pdfModificado);
  }

 // Llama a la función con la ruta del archivo PDF que deseas cargar
cargarPdf('uploads/poder.pdf').catch(console.error); 
*/

// Configuración de rutas y variables		
const __filename = fileURLToPath(import.meta.url);		
const __dirname = path.dirname(__filename);		
const app = express();		


// [cargapoder] - Configuración de Multer - Para Cargar Archivos 

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { empresaId } = req.body; // Obtener el ID de la empresa del formulario
        const uploadDir = path.join('uploads', empresaId); // Crear ruta de la carpeta
    //    console.log('poder');
    //    console.log(uploadDir)

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

//*********************************** */

const storagepdf = multer.diskStorage({
    destination: (req, file, cb) => {
        const { empresaId } = req.body; // Obtener el ID de la empresa del formulario
        const uploadDir = path.join('uploads', empresaId); // Crear ruta de la carpeta
    //    console.log('pdf');
    //    console.log(uploadDir)
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

//const uploadpdf = multer({ storagepdf }); // Crear el middleware de Multer
const uploadpdf = multer({ storage: storagepdf }); 

// Ruta para manejar la carga del archivo PDF
app.post('/uploadpdf', uploadpdf.single('file'), async (req, res) => {
    try {
 //       console.log(req.file); // Aquí puedes ver qué se ha cargado
        res.send(`Archivo cargado y guardado en ======= ${req.file.path}`);
    } catch (error) {

        console.error('Error al cargar el archivo:', error);
        res.status(500).send('Error al cargar el archivo.');
    }
});
  

// End - [cargapoder] - Configuración de Multer - Para Cargar Archivos 

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, '../views'));

//console.log('Hello, world!');

// menus 
 
// src/app.js
import { toggleSubmenu } from './menu.js';
import { Console, log } from 'console';

// Configuración de sesiones		
app.use(session({		
    secret: 'tu_secreto_aqui', // Cambia esto por una cadena secreta		
    resave: false, // No volver a guardar la sesión si no ha habido cambios		
    saveUninitialized: true, // Guarda una sesión incluso si no ha sido inicializada		
    cookie: { secure: false } // Cambia a true si usas HTTPS		
}));		
		
app.use((req, res, next) => {		
    if (!req.session.loggedin) {		
        req.session.loggedin = false;		
    }		
    next();		
});		
		
// Middleware		
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());		
app.use(express.urlencoded({ extended: true }));		

// Middleware para servir archivos estáticos - docx
//app.use(express.static('public')); 

// Configuración de vistas		
app.use(express.static(path.join(__dirname, 'src')));	

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
        res.render('loginv');		
    } catch (error) {		
        console.error('Error al renderizar la plantilla:', error);		
        res.status(500).json({ error: 'Error interno del servidor' });		
    }		
});		

// Ruta para descargar archivos
//console.log('aqui ');
//console.log(__dirname);
app.use('uploads', express.static(path.join(__dirname, '../uploads')));
app.get('/origen/:folder/:filename', (req, res) => {
    const folder = req.params.folder;
    const filename = req.params.filename;
//    console.log(`Carpeta: ${folder}, Archivo: ${filename}`);
    const filePath = path.join(__dirname, `../uploads/${folder}/`, filename); // ruta de donde toma el archivo

    // Usar express para enviar el archivo
//    console.log(filePath);
    res.download(filePath, (err) => {
        if (err) {
            console.error('Error al descargar el archivo:', err);
            res.status(500).send('Error al descargar el archivo.');
        }
    });
});

// INVENTARIOS

app.get('/inventarios', (req, res)=>{
    if (req.session.loggedin) {
        const userUser = req.session.unidad;
        res.render('inventarios', { userUser });
    } else {
        res.send('Por favor, inicia sesión primero.');
    }
})

app.post('/inventarios', async (req, res) => {
    try {
        console.log('DB_HOST:', process.env.DB_HOST);
        console.log('DB_USER:', process.env.DB_USER);
        console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
        console.log('Conectando a la base de datos con estos valores:');
 
        const { CodActivo, DesGen, DesAct, observ, Estado, Propio } = req.body;

        // Verificar si el activo ya existe
        const [rows] = await pool.execute('SELECT * FROM tbl_inventarios WHERE id_activo = ?', [CodActivo]);

        if (rows.length > 0) {
            // Si el registro ya existe, devolver mensaje y opciones
            return res.json({ 
                status: 'exists', 
                message: 'El registro ya existe.',
                codActivo: CodActivo ,
                options: {
                    delete: true,  // Opción para eliminar
                    keep: true     // Opción para mantener
                }
            });
        }

        // Si el registro no existe, insertarlo en la base de datos
        await pool.execute('INSERT INTO tbl_inventarios (id_activo, desgen, desact, desobs, estado, propio) VALUES (?, ?, ?, ?, ?, ?)', [CodActivo, DesGen, DesAct, observ, Estado, Propio ]);
        res.json({ status: 'success', message: '¡Activo registrado correctamente!' });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ status: 'error', message: 'Error en el servidor' });
    }
});

// inventarios ELIMINAR

app.post('/inventeli', async (req, res) => {
    try {
        const ids = req.body.CodActivo;

        // Log para depuración

        const [rows] =  await pool.execute('delete from tbl_inventarios WHERE id_activo = ?', [ids]);
        return res.json({
            status: 'success',
            title: 'Borrado Exitoso.',
            message: '¡Registro Exitoso! BD'
        });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED') {
            return res.json({
                status: 'error',
                title: 'Borrado No Exitoso',
                message: 'No se puede eliminar la pregunta porque tiene dependencia de OPCIONES.'
            });
        }
        // Para cualquier otro tipo de error
        return res.json({
            status: 'error',
            title: 'Error de Borrado',
            message: `Error: ${error.code}`
        });
    }
});

// INVENTARIOS

app.get('/inventario', (req, res) => {
    if (req.session.loggedin) {
        res.render('inventario');
    } else {
        res.send('Por favor, inicia sesión primero.');
    }
});

// Rutas de autenticación y registro
//app.get('/login', (req, res) => res.render('login'));

app.get('/login', (req, res)=>{
//    console.log(req.session.unidad);
//    if (req.session.loggedin) {
        const userUser = req.session.unidad;
        res.render('login', { userUser });
//    } else {
//        res.send('Por favor, inicia sesión primero.');
//    }
})

// [video]
app.get('/video', (req, res) => {
    res.render('video', { meetingLink: null });
});

app.post('/join-meet', (req, res) => {
    const meetId = req.body.meetId;
    const meetingLink = `https://meet.google.com/${meetId}`;
    res.render('video', { meetingLink });
});
// End - [video]

app.get('/menuprc', (req, res) => {
    if (req.session.loggedin) {
        const { user, name, rol } = req.session;
        const userUser = req.session.unidad;
        res.render('menuprc', { user, name, rol, userUser });
    } else {
        res.send('Por favor, inicia sesión primero.');
    }
});

app.get('/register', (req, res) => {
    if (req.session.loggedin) {
        res.render('register');
    } else {
        res.send('Por favor, inicia sesión primero.');
    }
});

app.get('/menuDropdown', (req, res) => {
    if (req.session.loggedin) {
        const { user, name } = req.session;
        res.render('menuDropdown', { user, name });
    } else {
        res.send('Por favor, inicia sesión primero.');
    }
});

// ajuste const

app.get('/preguntas', (req, res)=>{
    if (req.session.loggedin) {
        const userUser = req.session.user;
        const userName = req.session.name;
        res.render('preguntas', { user: userUser, name: userName });
    } else {
        res.send('Por favor, inicia sesión primero.');
    }
})



app.get('/cargas', (req, res)=>{
    if (req.session.loggedin) {
        const userUser = req.session.user;
        const userName = req.session.name;
        res.render('cargas', { user: userUser, name: userName });
    } else {
        res.send('Por favor, inicia sesión primero.');
    }
})

app.get('/cargascol', (req, res)=>{
    if (req.session.loggedin) {
        const userUser = req.session.user;
        const userName = req.session.name;
        res.render('cargascol', { user: userUser, name: userName });
    } else {
        res.send('Por favor, inicia sesión primero.');
    }
})

app.get('/modificar', (req, res) => {
    const id = req.query.id;
    const texto = req.query.texto;
    res.render('modificar', { id, texto });
});

app.get('/eliminar', (req, res) => {
    const id = req.query.id;
    const texto = req.query.texto;
    res.render('eliminar', { id, texto });
});

app.get('/moduser', (req, res) => {
    const user = req.query.user;
    const name = req.query.name;
    const rol = req.query.rol;
    const estado = req.query.estado;
    res.render('moduser', { user, name, rol, estado });
});

app.get('/moduserpass', (req, res) => {
    const user = req.session.user;
    const name = req.session.name;
    const pass = req.session.pass 
    res.render('moduserpass', { user, name, pass });
});

app.get('/eliuser', (req, res) => {
    const user = req.query.user;
    const name = req.query.name;
    res.render('eliuser', { user, name });
});

app.get('/preguntasopc', (req, res) => {
    if (req.session.loggedin) {
        const userUser = req.session.user;
        const userName = req.session.name;
        const id = req.query.id; // Obtén el id
        const respuesta = req.query.respuesta; // Obtén la respuesta
        res.render('preguntasopc', { id:id, respuesta:respuesta,user: userUser, name: userName });
    } else {
        res.send('Por favor, inicia sesión primero.');
    }
});

app.get('/modopc', (req, res) => {
    const idvlrprg = req.query.idvlrprg; // variable ej> idvlrprg, que se debe usar en modopc idprg
    const respuesta = req.query.respuesta;
    res.render('modopc', { idvlrprg, respuesta});

});

app.get('/eliopc', (req, res) => {
    const idvlrprg = req.query.idvlrprg; // variable ej> idvlrprg, que se debe usar en modopc idprg
    const respuesta = req.query.respuesta;
    res.render('eliopc', { idvlrprg, respuesta});
});

// Rutas para selección y opciones

app.get('/seleccion', async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM preguntas");
        res.render('opc1', { data: rows });
    } catch (error) {
        res.status(500).send('Error conectando a la base de datos.');
    }
});

app.get('/opcbtn', async (req, res) => {
    try {
        const [rows] = await pool.execute("select * from preguntas");
        // Verifica si se están obteniendo los datos correctamente
        res.render('opcbtn', { data: rows });
    } catch (error) {
        console.error('Error conectando a la base de datos:', error);
        res.status(500).send('Error conectando a la base de datos.');
    }
});

app.get('/opc1', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;
            const [rows] = await pool.execute("select a.id as idp,a.texto,a.estado,a.activo as prgact,b.id,b.respuesta,b.estado from preguntas a inner join pgtaresp b on a.id=b.idprg where a.estado=1");
            res.render('opc1', { preguntas: rows, user: userUser, name: userName });
        } else {
            res.send('Por favor, inicia sesión primero.');
        }
    } catch (error) {
        res.status(500).send('Error conectando a la base de datos.');
    }
});

app.get('/opc2', async (req, res) => {
    try {
        const [rows] = await pool.execute("select * from preguntas");
        res.render('opc2', { data: rows });
    } catch (error) {
        res.status(500).send('Error conectando a la base de datos.');
    }
});

app.get('/ingpreguntas', async (req, res) => {
    try {
        const tableName = "preguntas";
        const [rows] = await pool.execute(`select * from ${tableName}`);
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;
            res.render('ingpreguntas', { data: rows, user: userUser, name: userName });

        } else {
            res.send('Por favor, inicia sesión primero.');
        }
    } catch (error) {
                console.error('Error conectando a la base de datos....????:', error);
                res.status(500).send('Error conectando a la base de datos.?????');
            }
    });

// Usuarios

app.get('/usuarios', async (req, res) => {
    try {
        const tableName = "users";
        const [rows] = await pool.execute(`select * from ${tableName}`);
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;
            res.render('usuarios', { data: rows, user: userUser, name: userName });

        } else {
            res.send('Por favor, inicia sesión primero.');
        }
    } catch (error) {
                console.error('Error conectando a la base de datos....????:', error);
                res.status(500).send('Error conectando a la base de datos.?????');
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
            res.send('Por favor, inicia sesión primero.');
        }
    } catch (error) {
                console.error('Error conectando a la base de datos....????:', error);
                res.status(500).send('Error conectando a la base de datos.?????');
            }
    });

// resetuser - eliuser

app.get('/resetuser', (req, res) => {
    const user = req.query.user;
    const name = req.query.name;
    res.render('resetuser', { user, name });
});

// resetuser - eliuser

app.get('/maeprop', async (req, res) => {
    try {
        const tableName = "tipropiedad";
        const [rows] = await pool.execute(`select * from ${tableName}`);
        if (req.session.loggedin) {
            res.render('maeprop', { data: rows });
        } else {
            res.send('Por favor, inicia sesión primero.');
        }
    } catch (error) {
                console.error('Error conectando a la base de datos....????:', error);
                res.status(500).send('Error conectando a la base de datos.?????');
            }
});

//  adicionar tipo propiedad

app.get('/maepropadi', (req, res) => {
    if (req.session.loggedin) {
        const { user, name } = req.session;
        res.render('maepropadi', { user, name });
    } else {
        res.send('Por favor, inicia sesión primero.');
    }
});

app.get('/maepropmod', (req, res) => {
    const id = req.query.id;
    const descripcion = req.query.descripcion;
    res.render('maepropmod', { id, descripcion });
});

app.get('/maepropeli', (req, res) => {
    const id = req.query.id;
    const descripcion = req.query.descripcion;
    res.render('maepropeli', { id, descripcion });
});

// POSTS --------------------------------

 // [inicio] 
 app.post('/your-action-url', async (req, res) => {
    const identificador = req.body.Identi; // Obtener el valor de "Identi"
    if (!identificador) {
        return res.status(400).json({ status: 'error', message: 'Todos los campos son obligatorios' });
    }
    // Valida Unidad
    const [rows] = await pool.execute('SELECT * FROM tbl_propiedad WHERE id_rz = ?', [identificador]);
    if (rows.length == 0) {
        return res.status(400).json({ status: 'error', message: 'Unidad No Existe' });
    }
    const UdaRecord = rows[0];
    req.session.unidad = UdaRecord.razonsocial; // mantener la información del usuario entre diferentes solicitudes durante su sesión (COMPARTIR).
    // Aquí puedes realizar la evaluación necesaria
    if (identificador) {
        return res.json({ status: 'success', message: '¡Tipo Propiedad ok!' });
    } else {
        console.log('error')
        return res.json({ status: 'error', message: '¡Codigo Unidad Incorrecta!' });
    }
});
// End - [inicio] 

// [maepropadi]
app.post('/maepropadi', async (req, res) => {
    try {
        const { descripcion } = req.body;

        if (!descripcion ) {
            return res.status(400).json({ status: 'error', message: 'Todos los campos son obligatorios' });
        }

        const [rows] = await pool.execute('SELECT * FROM tipropiedad WHERE descripcion = ?', [descripcion]);
        if (rows.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Descripcion ya Existe' });
        }

        // Insertar nuevo usuario
        await pool.execute('INSERT INTO tipropiedad (descripcion) VALUES (?)', [descripcion]);
        res.json({ status: 'success', message: '¡Tipo Propiedad registrada correctamente!' });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ status: 'error', message: 'Error en el servidor' });
    }
});
// End - [maepropadi] 

// [maepropmod] - modifica usuarios

app.post('/maepropmod', async (req, res) => {
    try {
        const tableName = "tipropiedad";
        const id = req.body.id;
        const descripcion = req.body.descripcion;
        await pool.execute(`UPDATE ${tableName} SET descripcion = ? WHERE id = ?`, [descripcion, id]);
        return res.json({
            status: 'success',
            title: 'Actualizacion Exitosa',
            message: '¡Registrado correctamente!'
        });
    } catch (error) {
        res.json({
            status: 'error',
            title: 'Actualizacion Tipo Propiedad NO Exitoso...',
            message: '¡Error en el servidor! BD'
        });
    }
});

// End - [maepropmod]

// [maepropeli] - Eliminar usuarios
           
app.post('/maepropeli', async (req, res) => {
    try {
        const tableName = "tipropiedad";
        const id = req.body.id;
        // Log para depuración delete
        const [result] = await pool.execute(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
        if (result.affectedRows > 0) {
            // El registro fue eliminado con éxito
            return res.json({
                status: 'success',
                title: 'Eliminado',
                message: 'ha sido eliminado correctamente.'
            });
        }
    } catch (error) {
        res.json({
            status: 'error',
            title: 'Borrado de Usuario NO Exitoso',
            message: `Error: ${error.message}`
        });
    }
});

// End - [maepropeli]

// PODERES 

app.get('/poderes', async (req, res) => {
    try {
        const tableName = "tbl_poderes";
        const [rows] = await pool.execute(`select * from ${tableName}`);
        if (req.session.loggedin) {
            res.render('poderes', { data: rows });
        } else {
            res.send('Por favor, inicia sesión primero.');
        }
    } catch (error) {
                console.error('Error conectando a la base de datos....????:', error);
                res.status(500).send('Error conectando a la base de datos.?????');
            }
});

//  adicionar poderes

app.get('/poderadi', (req, res) => {
    if (req.session.loggedin) {
        const { user, name } = req.session;                 // revisar
        res.render('poderadi', { user, name });
    } else {
        res.send('Por favor, inicia sesión primero.');
    }
});

app.get('/podermod', (req, res) => {
    const id = req.query.Id;
    const numprop = req.query.numprop;
    const name = req.query.name;
    const propoder = req.query.propoder;
    const proname = req.query.proname;
    res.render('podermod', { id, numprop, name, propoder, proname });
});

app.get('/podereli', (req, res) => {
    const id = req.query.Id;
    const numprop = req.query.numprop;
    const name = req.query.name;
    const propoder = req.query.propoder;
    const proname = req.query.proname;
    res.render('podereli', { id, numprop, name, propoder, proname });
});

// [poderadi] - adicionar

app.post('/poderadi', async (req, res) => {
    try {
        const tableName = "tbl_poderes";
        const date = new Date();
        const numprop = req.body.numprop;
        const name = req.body.name;
        const propoder = req.body.propoder;
        const proname = req.body.proname;
        if (!numprop) {
            return res.status(400).json({ status: 'error', message: 'Todos los campos son obligatorios' });
        }
        if (numprop==propoder) {
            return res.status(400).json({ status: 'error', message: 'Quien Otorga no puede recibir' });
        }
        const [rows] = await pool.execute('SELECT * FROM tbl_poderes WHERE numprop = ?', [numprop]);
        if (rows.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Poder ya Existe' });
        }
        const [rows2] = await pool.execute('SELECT * FROM tbl_poderes WHERE numprop = ?', [propoder]);
        if (rows2.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Quien recibe ya otorgo poder' });
        }
        const [rows3] = await pool.execute('SELECT * FROM tbl_poderes WHERE propoder = ?', [numprop]);
        if (rows3.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Quien Otorga ya tiene poderes recibidos' });
        }

        await pool.execute(`INSERT INTO ${tableName} (numprop,name,propoder,proname,fecha) VALUES (?,?,?,?,?)`, [numprop, name, propoder, proname, date]);
        res.json({ status: 'success', message: '¡Registrado Correctamente!' });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ status: 'error', message: 'Error en el servidor' });
    }
});

// End - [poderadi]

// [podermod] - modifica poder

app.post('/podermod', async (req, res) => {
    try {
        const tableName = "tbl_poderes";
        const date = new Date();
        const id = req.body.id;
        const numprop = req.body.numprop;
        const name = req.body.name;
        const propoder = req.body.propoder;
        const proname = req.body.proname;
        //console.log(id);
        await pool.execute(`UPDATE ${tableName} SET numprop = ?, name = ?, propoder = ?, proname = ?, Fecha = ? WHERE id = ?`, [numprop, name, propoder, proname, date, id]);
        return res.json({
            status: 'success',
            title: 'Actualizacion Exitosa',
            message: '¡Registrado correctamente!'
        });
    } catch (error) {
        res.json({
            status: 'error',
            title: 'Actualizacion NO Exitosa...',
            message: '¡Error en el servidor! BD'
        });
    }
});

// End - [podermod]

// [podereli] - Eliminar poder
           
app.post('/podereli', async (req, res) => {
    try {
        const tableName = "tbl_poderes";
        const id = req.body.id;
        const numprop = req.body.numprop;
        const name = req.body.name;
        const propoder = req.body.propoder;
        const proname = req.body.proname;
        // Log para depuración delete
        const [result] = await pool.execute(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
        if (result.affectedRows > 0) {
            // El registro fue eliminado con éxito
            return res.json({
                status: 'success',
                title: 'Eliminado',
                message: 'ha sido eliminado correctamente.'
            });
        }
    } catch (error) {
        res.json({
            status: 'error',
            title: 'Borrado NO Exitoso.....PODER',
            message: `Error: ${error.message}`
        });
    }
});

// End - [podereli]

// Graficos

app.get('/bar', async (req, res) => {
    try {
        if (req.session.loggedin) {
            // Ejecuta la consulta SQL
            const [datos] = await pool.execute("SELECT respuesta, COUNT(*) AS total FROM respusers GROUP BY respuesta order by total desc");

            // Procesa los resultados para obtener las etiquetas y valores
            const labels = [];
            const dataValues = [];

            // Cambié 'results' por 'datos' porque 'datos' es el resultado de la consulta
            datos.forEach(row => {
                labels.push(row.respuesta);  // Añade la respuesta como una etiqueta
                dataValues.push(row.total);  // Añade el conteo de respuestas como un valor
            });

            // Pasa estos datos a la vista
            res.render('bar', {
                labels: labels, // No es necesario usar JSON.stringify aquí
                dataValues: dataValues, // No es necesario usar JSON.stringify aquí
            });
        } else {
            res.send('Por favor, inicia sesión primero.');
        }
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);  // Imprime el error en la consola
        res.status(500).send('Error conectando a la base de datos.');
    }
});


app.get('/pie', async (req, res)=>{
    try {
        if (req.session.loggedin) {
            // Ejecuta la consulta SQL
            const [datos] = await pool.execute("SELECT respuesta, COUNT(*) AS total FROM respusers GROUP BY respuesta order by total desc");

            // Procesa los resultados para obtener las etiquetas y valores
            const labels = [];
            const dataValues = [];

            // Cambié 'results' por 'datos' porque 'datos' es el resultado de la consulta
            datos.forEach(row => {
                labels.push(row.respuesta);  // Añade la respuesta como una etiqueta
                dataValues.push(row.total);  // Añade el conteo de respuestas como un valor
            });

            // Pasa estos datos a la vista
            res.render('pie', {
                labels: labels, // No es necesario usar JSON.stringify aquí
                dataValues: dataValues, // No es necesario usar JSON.stringify aquí
            });
        } else {
            res.send('Por favor, inicia sesión primero.');
        }
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);  // Imprime el error en la consola
        res.status(500).send('Error conectando a la base de datos.');
    }
})

// Opciones
    
app.get('/opciones', async(req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;
            const id = req.query.id;
            const texto = req.query.texto;
            const [rows] = await pool.execute("select * from pgtaresp where idprg = ?", [id]);
            res.render('opciones', { id, texto, data: rows, user: userUser, name: userName });
        } else {
            res.send('Por favor, inicia sesión primero.');
        }
    } catch (error) {
        console.error('Error conectando a la base de datos....????:', error);
        res.status(500).send('Error conectando a la base de datos.?????');
        }
    });

// crgas CSV

app.get('/cargascsv', (req, res) => {
    const id = req.query.id;
    const texto = req.query.texto;
    res.render('cargascsv', { id, texto });
});

// loginv

app.post('/loginv', async (req, res) => {
    // variables de ejs
    const { user, pass } = req.body;
  
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
  
    return res.json({ status: 'success', message: '!LOGIN Correcto!' });
  });
  

// [login] - Autenticacion

app.post('/auth', async (req, res) => {
    // variables de ejs
    const { unidad, user, pass } = req.body;

    // Valida Unidad
    const tableProp = 'tbl_propiedad';
    if (!unidad) {
        return res.status(400).json({ status: 'error', message: 'Todos los campos son obligatorios...AUTH' });
    }
    
    // Hashear el nit ingresado
    const nitInputHash = crypto.createHash('sha256').update(unidad).digest('hex'); // Usa crypto de Node.js
    // Ahora, busca el registro en la base de datos usando el hash del nit
    const [rowsud] = await pool.execute(`SELECT * FROM ${tableProp} WHERE nit = ?`, [nitInputHash]);
    
    if (rowsud.length === 0) {
        return res.json({ status: 'error', message: 'Unidad no encontrada' });
    }
    const UdaRecord = rowsud[0];
    req.session.unidad = UdaRecord.razonsocial; // mantener la información del usuario entre diferentes solicitudes durante su sesión (COMPARTIR).
    //console.log(req.session.unidad);
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

    return res.json({ status: 'success', message: '!LOGIN Correcto!' });
});

// End - [login]

// [preguntas] 

app.post('/preguntasreg', async (req, res) => {
    try {
        const { pgtas } = req.body;
        const tableName = "preguntas";
        const [rows] = await pool.execute(`SELECT * FROM ${tableName} WHERE texto = ?`, [pgtas]);
        if (rows.length > 0) {
            return res.json({ status: 'error', message: 'Pregunta ya Existe' });
        }
        const date = new Date();
        await pool.execute(`INSERT INTO ${tableName} (texto, estado, activo, fechacreacion) VALUES (?, ?, ?, ?)`, [pgtas, 0, 0, date]);
        res.json({ status: 'success', message: '¡Registrado correctamente!' });
    } catch (error) {
        res.json({ status: 'success', message: '¡Registro de Preguta NO Exitoso!' });
    }
});

// End - [preguntas]

// [modificar]

app.post('/preguntasmod', async (req, res) => {
    try {
        const ids = req.body.ids;
        const pgtas = req.body.pgtas;
        const tableName = "preguntas";
        // validar si existe
        const [rows] = await pool.execute(`SELECT * FROM ${tableName} WHERE texto = ? `, [pgtas]);
        if (rows.length > 0) {
            return res.json({
                status: 'error',
                message: 'Opción ya existe'
            });
        }

        // Insertar nuevo usuario
        await pool.execute(`UPDATE ${tableName} SET texto = ? WHERE id = ?`, [pgtas, ids]);

        res.json({
            status: 'success',
            title: 'Actualizacion Exitosa',
            message: '¡Registrado correctamente!'
        });
    } catch (error) {
        res.json({
            status: 'success',
            title: 'Registro de Preguta NO Exitoso',
            message: '¡Error en el servidor! BD'
        });
    }
});

// End - [modificar]

// [modopc] - modificacion opciones
app.post('/preguntasmodopc', async (req, res) => {
    try {
        const idp = req.body.idp;
        const id = req.body.id;
        const pgtas = req.body.pgtas;
        const tableName = "pgtaresp";
        //
        const [rows] = await pool.execute(`SELECT * FROM ${tableName} WHERE respuesta = ? AND idprg = ?`, [pgtas, idp]);
        if (rows.length > 0) {
            return res.json({
                status: 'error',
                message: 'Opción ya existe'
            });
        }
        
        // Insertar nuevo registro
        await pool.execute(`UPDATE ${tableName} SET respuesta = ? WHERE id = ?`, [pgtas, id]);
        res.json({
            status: 'success',
            title: 'Actualizacion Exitosa',
            message: '¡Registrado correctamente!'
        });
    } catch (error) {
        res.json({
            status: 'success',
            title: 'Registro de Preguta NO Exitoso',
            message: '¡Error en el servidor! BD'
        });
    }
});

// End - [modopc]

// [eliopc] - Eliminar opciones pregunta 

app.post('/preguntaseliopc', async (req, res) => {
    try {
        const id = req.body.idvlrprg;
        const pgtas = req.body.pgtas;
        // Log para depuración

        const [rows] =  await pool.execute('delete from pgtaresp WHERE id = ?', [id]);
        return res.json({
            status: 'success',
            title: 'Borrado Exitoso.',
            message: '¡Registro Exitoso! BD'
        });
    } catch (error) {
        res.json({
            status: 'error',
            title: 'Borrado de Preguta NO Exitoso',
            message: `Error: ${error.message}`
        });
    }
});

// End - [eliopc]

// [register] - Adicionar Usuario

app.post('/register', async (req, res) => {
    try {
        const rz = '1';
        const id_rz = 'Propiedad';
        const { UsuarioNew, UsuarioNom, rol, PassNew } = req.body;
        if (!UsuarioNew || !UsuarioNom || !rol || !PassNew) {
            return res.status(400).json({ status: 'error', message: 'Todos los campos son obligatorios' });
        }

        const [rows] = await pool.execute('SELECT * FROM users WHERE user = ?', [UsuarioNew]);
        if (rows.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Usuario ya Existe' });
        }

        // Insertar nuevo usuario
        const passwordHash = await bcryptjs.hash(PassNew, 8);
        await pool.execute('INSERT INTO users (rz, id_rz, user, name, pass, rol, estado ) VALUES (?, ?, ?, ?, ?, ?, ?)', [rz, id_rz, UsuarioNew, UsuarioNom, passwordHash, rol, null ]);
        res.json({ status: 'success', message: '¡Usuario registrado correctamente!' });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ status: 'error', message: 'Error en el servidor' });
    }
});

// End - [register]

// [eliminar] - Eliminar preguntas

app.post('/preguntaseli', async (req, res) => {
    try {
        const ids = req.body.ids;
        const pgtas = req.body.pgtas;

        // Log para depuración

        const [rows] =  await pool.execute('delete from preguntas WHERE id = ?', [ids]);
        return res.json({
            status: 'success',
            title: 'Borrado Exitoso.',
            message: '¡Registro Exitoso! BD'
        });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED') {
            return res.json({
                status: 'error',
                title: 'Borrado No Exitoso',
                message: 'No se puede eliminar la pregunta porque tiene dependencia de OPCIONES.'
            });
        }
        // Para cualquier otro tipo de error
        return res.json({
            status: 'error',
            title: 'Error de Borrado',
            message: `Error: ${error.code}`
        });
    }
});

// End - [eliminar]

// [opc1] voto   

app.post('/procesarseleccion', async (req, res) => {
    try {
        const userUser = req.session.user;
        const userName = req.session.name;
        const selectedValue = req.body.preguntas; // Obtén el valor seleccionado
        const [id, texto, idp, respuesta] = selectedValue.split('|');

        // EVALUA SI YA VOTO
        const pgtas = req.body.pgtas;
        // Log para depuración

        // SELECT      
        const tablePtas = "respusers";
        const [rows] = await pool.execute(`SELECT respuesta FROM ${tablePtas} WHERE user = ? and idprg = ?`, [userUser, id]);
        
        if (rows.length > 0) {
            const respuesta = rows[0].respuesta;  // Obtenemos la primera fila y el campo "pregunta"
            return res.json({
                status: 'info',
                title: `ya No puede votar`,
                message: `Su Voto Registrado es : [ ${respuesta} ]`
            });
        } else {
            // insert de respuesta
            const tableName = "respusers";
            const date = new Date();
            const estado = 0; // Ejemplo de estado
            await pool.execute(`INSERT INTO ${tableName} (user, idprg, pregunta, idpres, respuesta) VALUES (?, ?, ?, ?, ?)`, [userUser, id, texto, idp, respuesta]);
            return res.json({
                status: 'success',
                title: 'Voto Exitoso.',
                message: '¡Registro Exitoso! BD'
            });
        }
    } catch (error) {
        res.json({
            status: 'error',
            title: 'Grabar Respuesta NO Exitoso',
            message: `Error: ${error.message}`
        });
    }
});

// End - [opc1] 

// [opc2] activar voto   

app.post('/procesar-seleccion', async (req, res) => {
        try {
            const userUser = req.session.user;
            const userName = req.session.name;
            const selectedValue = req.body.pregunta; // Obtén el valor seleccionado
            const selectActivo = parseInt(req.body.selactivo, 10); // Convierte a entero

            // Actualiza el estado y activo a 0 para todas las preguntas
            await pool.execute('UPDATE preguntas SET estado = 0, activo = 0');
           
            // Verifica si hay valores seleccionados
            if (selectedValue && selectedValue.length > 0) {
                for (const id of selectedValue) {
                    // Actualiza el estado a 1 para los ids seleccionados
                    await pool.execute('UPDATE preguntas SET estado = 1 WHERE id = ?', [id]);
                    
                    // Actualiza el activo según selectActivo (asumiendo que es un valor por cada id)
                    await pool.execute('UPDATE preguntas SET activo = ? WHERE id = ?', [selectActivo, id]);
                }
            } else {
                console.log('Error update procesar-seleccion');
            }

            return res.json({
                status: 'success',
                title: 'Seleccion OK',
                message: '¡Registro Exitoso! BD'
            });   
        } catch (error) {
            res.json({
                status: 'error',
                title: 'Grabar Seleccion Pregunta NO Exitoso',
                message: `Error: ${error.message}`
            });
        }
    });
    
// End - [opc1]
    
// [moduser] - modifica usuarios

app.post('/usuariomod', async (req, res) => {
    try {
        const user = req.body.user;
        const name = req.body.name;
        const rol = req.body.rol;
        const estado = req.body.estado;

        // Insertar nuevo usuario
        await pool.execute('UPDATE users SET name = ?, rol = ? WHERE (estado IS NULL OR estado = 0) AND user = ?', [name, rol, user]);
        if (estado !== '1') {
            return res.json({
                status: 'success',
                title: 'Actualizacion Exitosa',
                message: '¡Registrado correctamente!'
            });
        } else {
            await pool.execute('UPDATE users SET name = ? WHERE user = ?', [name, user]);
            return res.json({
                status: 'question',
                title: 'Actualiza Nombre Usuario',
                message: 'Usuario Administrador Principal, solo permite modificar el Nombre'
            });
        }
    } catch (error) {
        res.json({
            status: 'success',
            title: 'Registro de Preguta NO Exitoso...',
            message: '¡Error en el servidor! BD'
        });
    }
});

// End - [moduser]

// [moduserpass] - modifica contraseña usuarios

app.post('/usuariomodpass', async (req, res) => {
    try {
        const user = req.body.user;
        const pass = req.body.pass;
        const current_password = req.body.current_password;
        const passt = req.body.passt;
        const passwordHash = await bcryptjs.hash(passt, 8);
        const passwordMatch = await bcryptjs.compare(current_password, pass);
        if (!passwordMatch) {
            return res.json({ status: 'error', message: 'Contraseña Actual Incorrecta' });
        }else{
            await pool.execute('UPDATE users SET pass = ? WHERE  user = ?', [passwordHash, user]);
            return res.json({
                status: 'success',
                title: 'Se Actualiza Contraseña',
                message: 'Actualizada'
            });
        };
    } catch (error) {
        res.json({
            status: 'success',
            title: 'Registro de Preguta NO Exitoso...',
            message: '¡Error en el servidor! BD'
        });
    }
});

// End - [moduserpass]

// [eliuser] - Eliminar usuarios

app.post('/usuarioeli', async (req, res) => {
    try {
        const ids = req.body.ids;

        // Log para depuración delete

        const [result] = await pool.execute('DELETE FROM users WHERE (estado IS NULL OR estado = 0) AND user = ?', [ids]);
        if (result.affectedRows > 0) {
            // El registro fue eliminado con éxito
            return res.json({
                status: 'success',
                title: 'Eliminado',
                message: 'El usuario ha sido eliminado correctamente.'
            });
        } else {
            // No se eliminó ningún registro
            return res.json({
                status: 'error',
                title: 'Error',
                message: 'No se pudo eliminar el usuario. Es posible que el usuario sea Administrador Principal o No exista.'
            });
        }
    } catch (error) {
        res.json({
            status: 'error',
            title: 'Borrado de Usuario NO Exitoso',
            message: `Error: ${error.message}`
        });
    }
});

// End - [eliuser]


// [usuariosreset] - Resetear pass usuarios */  

app.post('/usuariosrespass', async (req, res) => {
    try {
        const user = req.body.user;
        const transformedPassword = `${user.charAt(0).toUpperCase()}${user.slice(1)}24%`;
        const passwordHash = await bcryptjs.hash(transformedPassword, 8);
        await pool.execute('UPDATE users SET pass = ? WHERE  user = ?', [passwordHash, user]);
        return res.json({
            status: 'success',
            title: 'Se Actualiza Contraseña',
            message: 'Actualizada'
        });
    } catch (error) {
        res.json({
            status: 'error',
            title: 'Restaurar Contraseña NO Exitoso...',
            message: '¡Error en el servidor! BD'
        });
    }    
});

// End - [usuariosreset]

 // [preguntasopc] - opciones de preguntas - createPool

 app.post('/opcionesreg', async (req, res) => {
    const { id, respuesta, pgtas } = req.body;
    try {
        console.log('opcionesreg');
        const tableName = "pgtaresp";
        const [rows] = await pool.execute(`SELECT * FROM ${tableName} WHERE idprg= ? and respuesta = ?`, [id, pgtas]);
        if (rows.length > 0) {
            return res.json({
                status: 'error',
                message: 'Opción ya existe'
            });
        }
        const date = new Date();
        const estado = 0; // Ejemplo de estado
        await pool.execute(`INSERT INTO ${tableName} (idprg, pregunta, respuesta, fecha, estado) VALUES (?, ?, ?, ?, ?)`, [id, respuesta, pgtas, date, estado]);
        res.json({
            status: 'success',
            title: 'Registro Exitoso',
            message: '¡Registrado correctamente!'
        });
    } catch (error) {
        console.error('Error en /opcionesreg:', error);
        res.status(500).json({
            status: 'error',
            title: 'Error en el servidor',
            message: '¡Error en el servidor! BD'
        });
    }
});

// End - [preguntasopc]

// Ruta para procesar archivos CSV

async function processCSV(filePath) {
    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.execute(`CREATE TABLE IF NOT EXISTS my_table (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            age INT
        )`);

        const data = [];
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => data.push(row))
            .on('end', async () => {
                for (const { name, age } of data) {
                    await connection.execute('INSERT INTO my_table (name, age) VALUES (?, ?)', [name, age]);
                }
            });
    } catch (error) {
        console.error('Error procesando CSV:', error);
    } finally {
        await connection.end();
    }
}

// [cargascol] - Ruta para guardar datos en la tabla

app.post('/save-table-data2', async (req, res) => {
    const data = req.body;

    if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ message: 'No data provided' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.execute('DELETE FROM my_tableCol2');
        for (const { user, name, rol } of data) {
            if (user && name && rol) {
                await connection.execute('INSERT INTO my_tableCol2 (user, name, rol) VALUES (?, ?, ?)', [user, name, rol]);
            }
        }

        // Llamada al procedimiento almacenado
        await connection.execute('CALL SP_Valida_ImportarColumnas()'); // Reemplaza 'nombre_del_procedimiento_almacenado' con el nombre real de tu SP
        // Llamar a la función para ejecutar el proceso
        updatePasswords();

        await connection.commit();
        res.json({
            status: 'success',
            title: 'Registro Exitoso',
            message: '¡Registrado correctamente!'
        });
    } catch (error) {
        console.error('Error saving data:', error);
        await connection.rollback();
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
});

// End - [cargascol]

// [cargas] - Ruta para guardar datos en la tabla 
/*
app.post('/save-table-data', async (req, res) => {
    const data = req.body;
    console.log('paso 1');
    if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ message: 'No data provided' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.execute('DELETE FROM my_table2');

        for (const { codigo } of data) {
            if (codigo) {
                await connection.execute('INSERT INTO my_table2 (codigo) VALUES (?)', [codigo]);
            }
        }
        console.log('ingresa');
        // Llamada al procedimiento almacenado
        await connection.execute('CALL SP_Valida_ImportarColumnas()');
        console.log('actualiza')
        // Llamar a la función para ejecutar el proceso
        await updatePasswords();  // Asegúrate de usar await aquí

        await connection.commit();
        res.json({
            status: 'success',
            title: 'Registro Exitoso',
            message: '¡Registrado correctamente!'
        });
    } catch (error) {
        console.error('Error saving data:', error);
        await connection.rollback();
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
});
*/
// End - [cargas]

// Función para generar y actualizar la contraseña en la tabla
async function updatePasswords() {
    try {
        const [rows] = await pool.execute('SELECT Id, user FROM my_tableCol2');
        if (rows.length === 0) {
            //console.log('No hay usuarios para actualizar.');
            return; // Salir si no hay registros
        }
        for (const row of rows) {
            try {
                const transformedPassword = `${row.user.charAt(0).toUpperCase()}${row.user.slice(1)}24%`;
                const hashedPassword = await bcryptjs.hash(transformedPassword, 8);
                await pool.execute('UPDATE my_tableCol2 SET pass = ? WHERE user = ?', [hashedPassword, row.user]);
            } catch (updateError) {
                console.error(`Error actualizando la contraseña para el usuario ${row.user}:`, updateError);
            }
        }
    } catch (error) {
        console.error('Error en updatePasswords:', error);
    }
}





// [     V E R           A R C H I V O S        ]

// ver archivos cargas docx o pdf //////////////////////////////

// opc 1 docx
// app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/ver-word', (req, res) => {
    // Aquí usas la URL completa, que incluye el protocolo y el dominio (puede ser http://localhost:3000 o el dominio de producción)
    const archivoWord = 'http://localhost:3009/uploads/poder.docx';  // Ruta absoluta del archivo Word
    console.log('Archivo Word:', archivoWord);  // Log para verificar que archivoWord está definido
    res.render('ver-word', { archivoWord });  // Pasar la variable 'archivoWord' al template EJS
});

// opc 2 docx a pdf
/*
// Ruta del archivo .docx y de salida
const inputFilePath = path.join('uploads', 'poder.docx');
const outputFilePath = path.join('uploads', 'poder.pdf');

// Función para convertir .docx a PDF
async function convertDocxToPdf(inputPath, outputPath) {
    try {
        // Leer el archivo .docx
        const docxData = fs.readFileSync(inputPath);
        const { value: docText } = await mammoth.extractRawText({ buffer: docxData });

        // Crear un nuevo documento PDF usando pdf-lib
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        
        // Usar la fuente estándar Helvetica de pdf-lib
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const { width, height } = page.getSize();
        
        // Añadir el texto del documento .docx al PDF
        page.drawText(docText, {
            x: 50,
            y: height - 50,
            font,
            size: 12,
            maxWidth: width - 100,
            lineHeight: 14,
        });

        // Guardar el archivo PDF
        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(outputPath, pdfBytes);

        console.log('Archivo convertido a PDF con éxito.');
    } catch (error) {
        console.error('Error al convertir .docx a PDF:', error);
    }
}

  // Llamar a la función para convertir el archivo
  convertDocxToPdf(inputFilePath, outputFilePath);
*/

// opc 3 pdf  

// En tu ruta en Express:
app.get('/ver-pdf', (req, res) => {
    const archivoPDF = '../uploads/poder.pdf'; // Ruta al archivo PDF
    console.log(archivoPDF);
    res.render('ver-pdf', { pdfUrl: archivoPDF });
  });

// Cargar PDF
app.get('/cargarpdf', (req, res) => {
    res.render('cargarpdf');
  });

// Ruta para cargar la vista de carga
app.get('/cargapoder', (req, res) => {
    res.render('cargapoder'); // Renderiza cargapoder.ejs
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

/// CERRAR CONEXIONES :  connection.release(); //
