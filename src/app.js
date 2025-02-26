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
import { componentsToColor, PDFDocument } from 'pdf-lib'; // docx a pdf
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
 
// src/app.js
import { toggleSubmenu } from './menu.js';
import { Console, log } from 'console';

// Configuración de sesiones		
app.use(session({		
    secret: 'tu_secreto_aqui', // Cambia esto por una cadena secreta		
    resave: false, // No volver a guardar la sesión si no ha habido cambios		
    saveUninitialized: true, // Guarda una sesión incluso si no ha sido inicializada		
    cookie: { 
        httpOnly: true, 
        secure: false,  // Si usas https, ponlo a true
        expires: false  // La cookie solo durará mientras el navegador esté abierto
    }
}));		
		
app.use((req, res, next) => {		
    if (!req.session.loggedin) {		
        req.session.loggedin = false;		
    }		
    next();		
});		
		
// Middleware		
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.urlencoded({ extended: true })); // Para procesar formularios con datos codificados en URL
app.use(express.json()); // Para procesar cuerpos JSON, si se envían datos JSON

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
        res.render('login');		
    } catch (error) {		
        console.error('Error al renderizar la plantilla:', error);		
        res.status(500).json({ error: 'Error interno del servidor' });		
    }		
});		

// Ruta para descargar archivos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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


// Rutas de autenticación y registro
/*
app.get('/login', (req, res)=>{
        const userUser = req.session.unidad;
        res.render('login', { userUser });
})
*/

// Rutas para manejar el login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    return res.status(401).json({ message: 'Credenciales incorrectas' });
});

// Ruta para verificar si el usuario está logueado
app.get('/profile', (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ message: 'No estás logueado' });
    }
    res.json({ message: `Bienvenido ${req.session.username}` });
});

// Ruta para logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error al cerrar sesión' });
        }
        res.json({ message: 'Sesión cerrada exitosamente' });
    });
});

app.get('/documentos', async(req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;
            const id = req.query.id;
            const texto = req.query.texto;
            const [rows] = await pool.execute("select * from pgtaresp where idprg = ?", [id]);
            res.render('documentos', { id, texto, data: rows, user: userUser, name: userName });
        } else {
            //res.send('Por favor, inicia sesión primero.');
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error conectando a la base de datos....????:', error);
        res.status(500).send('Error conectando a la base de datos.?????');
        }
    });

app.get('/valida', (req, res)=>{
        const userUser = req.session.unidad;
        res.render('valida', { userUser });
    })
    
app.get('/totales', (req, res)=>{
    const userUser = req.session.unidad;
    res.render('totales', { userUser });
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
//        res.send('Por favor, inicia sesión primero.');
        res.redirect('/');
    }
});

app.get('/register', (req, res) => {
    if (req.session.loggedin) {
        res.render('register');
    } else {
//        res.send('Por favor, inicia sesión primero.');
        res.redirect('/');
    }
});

app.get('/menuDropdown', (req, res) => {
    if (req.session.loggedin) {
        const { user, name } = req.session;
        res.render('menuDropdown', { user, name });
    } else {
//        res.send('Por favor, inicia sesión primero.');
        res.redirect('/');
    }
});

// ajuste const

app.get('/preguntas', (req, res)=>{
    if (req.session.loggedin) {
        const userUser = req.session.user;
        const userName = req.session.name;
        res.render('preguntas', { user: userUser, name: userName });
    } else {
//        res.send('Por favor, inicia sesión primero.');
        res.redirect('/');
    }
})



app.get('/cargas', (req, res)=>{
    if (req.session.loggedin) {
        const userUser = req.session.user;
        const userName = req.session.name;
        res.render('cargas', { user: userUser, name: userName });
    } else {
//        res.send('Por favor, inicia sesión primero.');
        res.redirect('/');
    }
})

app.get('/cargascol', (req, res)=>{
    if (req.session.loggedin) {
        const userUser = req.session.user;
        const userName = req.session.name;
        res.render('cargascol', { user: userUser, name: userName });
    } else {
//        res.send('Por favor, inicia sesión primero.');
        res.redirect('/');
    }
})

app.get('/modificar', (req, res) => {
    const id = req.query.id;
    const texto = req.query.texto;
    res.render('modificar', { id, texto });
});

app.get('/activar', (req, res) => {
    const id = req.query.id;
    const texto = req.query.texto;
    res.render('activar', { id, texto });
});

app.post('/activar', async (req, res) => {
    const { id, estado } = req.body;
    const tableName = "preguntas";
    try {
        // Actualizar el estado de la pregunta en la base de datos
        await pool.execute(`UPDATE ${tableName} SET activo = ? WHERE id = ?`, [estado, id]);
        res.json({ status: 'success' });
    } catch (error) {
        console.error(error);
        res.json({ status: 'error', message: 'Error al actualizar el estado' });
    }
});

app.post('/actualizarEstado', async (req, res) => {
    const { id, estado } = req.body;
    const tableName = "preguntas";
    console.log(id);
    try {
        // Actualiza el estado en la base de datos
        await pool.execute(`UPDATE ${tableName} SET estado = ? WHERE id = ?`, [estado, id]);
        console.log(estado);
        return res.json({status: 'success' });
    } catch (error) {
        console.error(error);
        return res.json({
            status: 'error',
            message: 'Hubo un error al actualizar el estado'
        });
    }
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
//        res.send('Por favor, inicia sesión primero.');
        res.redirect('/');
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
        const tableName = "preguntas";
//        const [rows] = await pool.execute(`SELECT * FROM ${tableName} WHERE activo <> 1`);
        const [rows] = await pool.execute(`
            SELECT 
                a.id AS id, 
                a.texto, 
                a.estado, 
                a.activo, 
                COUNT(b.id) AS opc 
            FROM 
                ${tableName} a 
            LEFT JOIN 
                pgtaresp b ON a.id = b.idprg 
            WHERE activo <> 1    
            GROUP BY 
                a.id, a.texto, a.estado, a.activo
        `);

        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;
            res.render('seleccion', { data: rows, user: userUser, name: userName });

        } else {
//            res.send('Por favor, inicia sesión primero.');
            res.redirect('/');
        }
    } catch (error) {
                console.error('Error conectando a la base de datos....????:', error);
                res.status(500).send('Error conectando a la base de datos.?????');
            }
});

app.post('/seleccion', async(req, res) => {
    console.log('seleccionar');
    const { id, texto } = req.body; // Recibir los datos enviados desde el cliente
    // Lógica para procesar la pregunta seleccionada
    console.log(id);
    console.log(texto);
    const wid = id;
    const tableName = "preguntas";
    await pool.execute(`UPDATE ${tableName} SET estado = 0`);
    await pool.execute(`UPDATE ${tableName} SET estado = 1 WHERE id = ?`, [wid]);
    return res.json({
        status: 'success',
        title: 'Actualizacion Exitosa',
        message: '¡Registrado correctamente!'
    });
});
    
app.post('/seleccion2', async(req, res) => {
    console.log('seleccionar dos');
    // Lógica para procesar la pregunta seleccionada
    const tableName = "preguntas";
    await pool.execute(`UPDATE ${tableName} SET estado = 0`);
    return res.json({
        status: 'success',
        title: 'Actualizacion Exitosa',
        message: '¡Registrado correctamente!'
    });
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
//            res.send('Por favor, inicia sesión primero.');
            res.redirect('/');
        }
    } catch (error) {
        res.status(500).send('Error conectando a la base de datos.');
    }
});

app.get('/respuesta', async (req, res) => {
    try {
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;
            const [rows] = await pool.execute("select a.id as idp,a.texto,a.estado,a.activo as prgact,b.id,b.respuesta,b.estado from preguntas a inner join pgtaresp b on a.id=b.idprg where a.disponer=1 and a.estado=1 and a.activo=0");
            res.render('respuesta', { preguntas: rows, user: userUser, name: userName });
        } else {
//            res.send('Por favor, inicia sesión primero.');
            res.redirect('/');
        }
    } catch (error) {
        res.status(500).send('Error conectando a la base de datos.');
    }
});

app.get('/disponer', async (req, res) => {
    try {
        const tableName = "preguntas";
        const [rows] = await pool.execute(`
            SELECT 
                a.id AS id, 
                a.texto, 
                a.estado, 
                a.activo,
                b.respuesta
            FROM 
                ${tableName} a 
            LEFT JOIN 
                pgtaresp b ON a.id = b.idprg 
            WHERE activo <> 1 and a.estado = 1    
        `);

        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;
            res.render('disponer', { data: rows, user: userUser, name: userName });

        } else {
            res.redirect('/');
        }
    } catch (error) {
                console.error('Error conectando a la base de datos....????:', error);
                res.status(500).send('Error conectando a la base de datos.?????');
            }
});

app.post('/disponer', (req, res) => {
    const { username, password } = req.body;
    console.log('Ingresa DIsponer');
    return res.json({
        status: 'success',
        title: 'Pregunta Asignada',
        message: '¡Registrado correctamente!'
    });

    //    res.json({ message: `Hola` });
});

app.get('/cerrar', async (req, res) => {
    try {
        const tableName = "preguntas";
        const [rows] = await pool.execute(`
            SELECT 
                a.id AS id, 
                a.texto, 
                a.estado, 
                a.activo,
                b.respuesta
            FROM 
                ${tableName} a 
            LEFT JOIN 
                pgtaresp b ON a.id = b.idprg 
            WHERE activo <> 1 and a.estado = 1    
        `);

        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;
            res.render('cerrar', { data: rows, user: userUser, name: userName, title: 'Actualizacion Exitosa', });
        } else {
            res.redirect('/');
        }
    } catch (error) {
                console.error('Error conectando a la base de datos....????:', error);
                res.status(500).send('Error conectando a la base de datos.?????');
            }
});

app.post('/cerrar', (req, res) => {
    const { username, password } = req.body;
    console.log('Ingresa Cerrar');
    return res.json({
        status: 'success',
        title: 'Pregunta Cerrada',
        message: '¡Registrado correctamente!'
    });
    //    res.json({ message: `Hola` });
});

app.get('/opc2', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT 
                a.id AS id, 
                a.texto, 
                a.estado, 
                a.activo, 
                COUNT(b.id) AS opc 
            FROM 
                preguntas a 
            LEFT JOIN 
                pgtaresp b ON a.id = b.idprg 
            GROUP BY 
                a.id, a.texto, a.estado, a.activo
        `);

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
//            res.send('Por favor, inicia sesión primero.');
            res.redirect('/');
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
//            res.send('Por favor, inicia sesión primero.');
            res.redirect('/');
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
//            res.send('Por favor, inicia sesión primero.');
            res.redirect('/');
        }
    } catch (error) {
                console.error('Error conectando a la base de datos....????:', error);
                res.status(500).send('Error conectando a la base de datos.?????');
            }
    });

// Resultados Votos

app.get('/resultados', async (req, res) => {
    try {
        const tableName = "preguntas";
        const [rows] = await pool.execute(`SELECT * FROM ${tableName} WHERE activo = 0`);
        if (req.session.loggedin) {
            const userUser = req.session.user;
            const userName = req.session.name;
            res.render('resultados', { data: rows, user: userUser, name: userName });

        } else {
//            res.send('Por favor, inicia sesión primero.');
            res.redirect('/');
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
//            res.send('Por favor, inicia sesión primero.');
            res.redirect('/');
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
//        res.send('Por favor, inicia sesión primero.');
        res.redirect('/');
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
    req.session.idrsocial = UdaRecord.id_rz; 
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
//            res.send('Por favor, inicia sesión primero.');
            res.redirect('/');
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
//        res.send('Por favor, inicia sesión primero.');
        res.redirect('/');
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

// PODERES - USUARIOS

// PODERES 

app.get('/poderesusu', async (req, res) => {
    try {
        const { user, numprop } = req.session;
        const tableName = "tbl_poderes_usu";
        const [rows] = await pool.execute(`SELECT * FROM ${tableName} WHERE propoder = ?`, [numprop]);
        if (req.session.loggedin) {
            res.render('poderesusu', { data: rows });
        } else {
//            res.send('Por favor, inicia sesión primero.');
            res.redirect('/');
        }
    } catch (error) {
                console.error('Error conectando a la base de datos....????:', error);
                res.status(500).send('Error conectando a la base de datos.?????');
            }
});

app.get('/poderadiusu', (req, res) => {
    if (req.session.loggedin) {
        const { user, name } = req.session;                 // revisar
        res.render('poderadiusu', { user, name });
    } else {
//        res.send('Por favor, inicia sesión primero.');
        res.redirect('/');
    }
});

app.get('/cargarpoder', (req, res) => {
    if (req.session.loggedin) {
        const { user, name } = req.session;                 // revisar
        res.render('cargarpoder', { user, name });
    } else {
//        res.send('Por favor, inicia sesión primero.');
        res.redirect('/');
    }
});

app.get('/podermodusu', (req, res) => {
    const id = req.query.Id;
    const numprop = req.query.numprop;
    const name = req.query.name;
    const propoder = req.query.propoder;
    const proname = req.query.proname;
    res.render('podermodusu', { id, numprop, name, propoder, proname });
});


// cargarpd


app.get('/podereliusu', (req, res) => {
    const id = req.query.Id;
    const numprop = req.query.numprop;
    const name = req.query.name;
    const propoder = req.query.propoder;
    const proname = req.query.proname;
    res.render('podereliusu', { id, numprop, name, propoder, proname });
});

app.post('/poderadiusu', async (req, res) => {
    try {
        const tableName = "tbl_poderes_usu";
        const date = new Date();
        const numprop = req.body.numprop;
        const name = req.body.name;
        const propoder = req.session.numprop;
        const proname = req.session.name;
/*        
        if (!numprop) {
            return res.status(400).json({ status: 'error', message: 'Todos los campos son obligatorios' });
        }
*/
        if (name==propoder) {
            return res.status(400).json({ status: 'error', message: 'Quien Otorga no puede recibir' });
        }
            
        const [rows] = await pool.execute('SELECT * FROM tbl_poderes_usu WHERE numprop = ?', [name]);
        if (rows.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Poder ya Existe' });
        }
        const [rows2] = await pool.execute('SELECT * FROM tbl_poderes_usu WHERE numprop = ?', [propoder]);
        if (rows2.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Quien recibe ya otorgo poder' });
        }

/*
        const [rows3] = await pool.execute('SELECT * FROM tbl_poderes_usu WHERE propoder = ?', [numprop]);
        if (rows3.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Quien Otorga ya tiene poderes recibidos' });
        }
*/
        await pool.execute(`INSERT INTO ${tableName} (name,numprop,propoder,proname,pdf, fecha) VALUES (?,?,?,?,?,?)`, [numprop, name, propoder, proname, 'Subir PDF',date]);
        res.json({ status: 'success', message: '¡Registrado Correctamente!' });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ status: 'error', message: 'Error en el servidor' });
    }
});

// [podermod] - modifica poder

app.post('/podermodusu', async (req, res) => {
    try {
        const tableName = "tbl_poderes_usu";
        const date = new Date();
        const id = req.body.id;
        const numprop = req.body.numprop;
        const name = req.body.name;
        const propoder = req.session.numprop;
        const proname = req.session.name;
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
            message: `Error: ${error.message}`
        });
    }
});

// End - [podermod]

// [podereli] - Eliminar poder
           
app.post('/podereliusu', async (req, res) => {
    try {
        const tableName = "tbl_poderes_usu";
        const id = req.body.id;
        // Log para borrar archivo fisico
        const [rows] = await pool.execute(`SELECT ruta FROM ${tableName} WHERE id = ?`, [id]);
        const ruta = rows.length > 0 ? rows[0].ruta : null;  // Extraemos el valor de la propiedad 'ruta'

        // BORRAR FISICO

        // Ruta base del servidor donde están almacenados los archivos
        const rutaBase = path.join(__dirname, '../uploads');  // Ruta base relativa para Express
        console.log(rutaBase);
        // Asumimos que 'rows' contiene los datos obtenidos de la base de datos
        const rutaArchivoRelativa = rows.length > 0 ? rows[0].ruta : null;
        
        if (rutaArchivoRelativa) {
          // Combina la ruta base con la ruta relativa del archivo
          const rutaCompleta = path.join(rutaBase, rutaArchivoRelativa.replace(/\\/g, path.sep));
          console.log('borrar');  
          console.log(rutaCompleta);
          try {
            // Elimina el archivo físico
            await fs.promises.unlink(rutaCompleta);
            console.log('Archivo eliminado con éxito');
          } catch (err) {
            console.error('Error al borrar el archivo:', err);
          }
        } else {
          console.log('No se encontró la ruta del archivo');
        }
        
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

// End Poderes Usuarios

// Graficos

app.get('/bar', async (req, res) => {
    try {


        if (req.session.loggedin) {
            // Obtener el valor de 'idp' de la URL
            const idPregunta = req.query.idp;  // Obtén el idp de la URL

            // Ejecuta la consulta SQL
            //const [datos] = await pool.execute("SELECT respuesta, COUNT(*) AS total FROM respusers GROUP BY respuesta order by total desc");

            // Aquí puedes usar 'idPregunta' para hacer una consulta específica si es necesario
            const [datos] = await pool.execute(
                "SELECT respuesta, COUNT(*) AS total FROM respusers WHERE idprg = ? GROUP BY respuesta ORDER BY total DESC", 
                [idPregunta] // Usar el idPregunta como parámetro para la consulta
            );


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
//            res.send('Por favor, inicia sesión primero.');
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);  // Imprime el error en la consola
        res.status(500).send('Error conectando a la base de datos.');
    }
});

app.get('/bar_resul', async (req, res) => {
    try {
        if (req.session.loggedin) {
            // Obtener el valor de 'idp' de la URL
            const idPregunta = req.query.idp;  // Obtén el idp de la URL
            // Ejecuta la consulta SQL
            const [datos] = await pool.execute(
                "SELECT respuesta, COUNT(*) AS total FROM respusers WHERE idprg = ? GROUP BY respuesta ORDER BY total DESC LIMIT 10", 
                [idPregunta] // Usar el idPregunta como parámetro para la consulta
            );
            // Procesa los resultados para obtener las etiquetas y valores
            const labels = [];
            const dataValues = [];

            // Cambié 'results' por 'datos' porque 'datos' es el resultado de la consulta
            datos.forEach(row => {
                labels.push(row.respuesta);  // Añade la respuesta como una etiqueta
                dataValues.push(row.total);  // Añade el conteo de respuestas como un valor
            });

            // Pasa estos datos a la vista
            res.render('bar_resul', {
                labels: labels, // No es necesario usar JSON.stringify aquí
                dataValues: dataValues, // No es necesario usar JSON.stringify aquí
            });
        } else {
//            res.send('Por favor, inicia sesión primero.');
            res.redirect('/');
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
//            res.send('Por favor, inicia sesión primero.');
            res.redirect('/');
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
//            res.send('Por favor, inicia sesión primero.');
            res.redirect('/');
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
    req.session.nomid = UdaRecord.nomid;
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
    req.session.numprop = userRecord.numprop;

    // Verifica si ya hay una sesión activa
    if (req.session.username) {
        return res.status(400).json({ message: 'Ya estás logueado en otro dispositivo' });
    }

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
        console.log(newFileName);
        cb(null, newFileName); // Establecer el nombre del archivo
    }
});

const uploadpdf = multer({ storage: storagepdf }); // Usar el almacenamiento configurado

// Ruta para manejar la carga del archivo PDF   Inumprop
app.post('/uploadpdf', uploadpdf.single('file'), async (req, res) => {
    try {
        const oldPath = req.file.path;
        // Obtener el valor de Inumprop del formulario
        const numprop = req.body.Inumprop || 'valor_predeterminado'; // Usar 'valor_predeterminado' si no se pasa nada
        const propoder = req.body.Ipropoder || 'valor_predeterminado'; // Usar 'valor_predeterminado' si no se pasa nada
        const empresaid = req.body.empresaId;
        const numpropFromSession = req.session.numprop; // Valor en la sesión
        const numpropFromForm = req.body.Inumprop;  // Valor enviado desde el formulario
        const anewFileName1 = 'PODERASM_' + numpropFromSession + "_" + numpropFromForm;
        const anewFileName = `PODER_${propoder}_${numprop}${path.extname(req.file.originalname)}`;
        // Determinar el nuevo path para el archivo cargado
        const newPath = path.join('uploads', anewFileName);
        const rta = empresaid + '\\' + anewFileName;
        const tableName = "tbl_poderes_usu";
        const wpdf = 'Cargado';
        await pool.execute(`UPDATE ${tableName} SET pdf = ? WHERE numprop = ?`, [wpdf, numprop]);
        await pool.execute(`UPDATE ${tableName} SET ruta = ? WHERE numprop = ?`, [rta, numprop]);
        // Enviar respuesta en JSON
        res.json({ 
            status: 'success', 
            message: '¡Archivo registrado correctamente....!' 
        });

    } catch (error) {
        console.error('Error al cargar el archivo:', error);
        res.status(500).send('Error al cargar el archivo.');
    }
});
  
// End - [cargapoder] - Configuración de Multer - Para Cargar Archivos 

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

// [activar]

app.post('/preguntasact', async (req, res) => {
    try {
        console.log(req.body);
        const ids = req.body.ids;
//        const respuesta = req.body.respuesta;
        const tableName = "preguntas";

        // update nuevo usuario
        const respuesta = req.body.respuesta;
        // Convertir la respuesta en 1 o 0
        const valorActivo = respuesta === 'Sí' ? 0 : 1;
        console.log(valorActivo);        
        // Actualizar la base de datos con el valor correspondiente
        await pool.execute(`UPDATE ${tableName} SET activo = ? WHERE id = ?`, [valorActivo, ids]);

        // Si quieres hacer el otro update (por ejemplo, para desactivar la otra respuesta), lo harías de esta forma:
        const valorInactivo = valorActivo === 1 ? 0 : 1;
        console.log(valorInactivo);        
//        await pool.execute(`UPDATE ${tableName} SET activo = ? WHERE respuesta = ? and id = ?`, [valorInactivo, respuesta, ids]);

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
            message: '¡Registro NO realizado! BD'
        });
    }
});

// End - [eliopc]

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
            title: '¡Registro NO realizado! BD',
            message: ' - Validar si contiene respuestas - '
        });
    }
});

// End - [eliminar]

app.post('/procesarseleccion', async (req, res) => {
    try {
        const userUser = req.session.user;
        const userName = req.session.name;
        const selectedValue = req.body.preguntas; // Obtén el valor seleccionado
        const [id, texto, idp, respuesta] = selectedValue.split('|');

        // EVALUA SI YA VOTO
        //const pgtas = req.body.pgtas;
        // Log para depuración

        // SELECT      
        /*        
        //const tablePtas = "respusers";
        //const [rows] = await pool.execute(`SELECT respuesta FROM ${tablePtas} WHERE user = ? and idprg = ?`, [userUser, id]);
        if (rows.length > 0) {
            const respuesta = rows[0].respuesta;  // Obtenemos la primera fila y el campo "pregunta"
            return res.json({
                status: 'info',
                title: `ya No puede votar`,
                message: `Su Voto Registrado es : [ ${respuesta} ]`
            });
        } else {
*/
            // insert de respuesta
            const tableName = "respusers";
            const date = new Date();
            const estado = 0; // Ejemplo de estado
            await pool.execute(`DELETE FROM ${tableName} WHERE user = ? AND idprg = ?`, [userUser, id]);
            await pool.execute(`INSERT INTO ${tableName} (user, idprg, pregunta, idpres, respuesta) VALUES (?, ?, ?, ?, ?)`, [userUser, id, texto, idp, respuesta]);
            return res.json({   
                status: 'success',
                title: 'Voto Exitoso.',
                message: '¡Registro Exitoso! BD'
            });
    } catch (error) {
        res.json({
            status: 'error',
            title: 'Grabar Respuesta NO Exitoso',
            message: `Error: ${error.message}`
        });
    }
});

// [opc2] activar voto   

app.post('/asignar', async (req, res) => {
    try {
        console.log('Entró al POST');
        console.log(req.body); // Verifica qué datos están llegando

        const userUser = req.body.user;
        const userName = req.body.name;
        const selectedValue = req.body.respuesta; // Puedes ajustar esto según el nombre del campo
        const wid = req.body.ids; // Asegúrate de que el valor de 'ids' sea correcto
        console.log('Datos recibidos:', userUser, userName, selectedValue, wid);

        const tableName = "preguntas";
        const date = new Date();
        const estado = 0; // Ejemplo de estado
        await pool.execute(`UPDATE ${tableName} SET disponer = 1 WHERE id = ?`, [wid]);

        return res.json({
            status: 'success',
            title: 'Voto Exitoso.',
            message: '¡Registro Exitoso! BD'
        });
    } catch (error) {
        console.error('Error:', error);
        res.json({
            status: 'error',
            title: 'Grabar Respuesta NO Exitoso',
            message: `Error: ${error.message}`
        });
    }
});

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
    
    
// [moduser] - modifica usuarios

app.post('/usuariomod', async (req, res) => {
    try {
        const user = req.body.user;
        const name = req.body.name;
        const rol = req.body.rol;
        const estado = req.body.estado;
        const numprop = req.body.numpropNew;
        const coefici = req.body.coeficiente;
        // Insertar nuevo usuario
        //await pool.execute('UPDATE users SET name = ?, rol = ?, numprop = ?, coeficiente = ?,  WHERE (estado IS NULL OR estado = 0) AND user = ?', [name, rol, numprop, coefici, user]);
        await pool.execute('UPDATE users SET name = ?, numprop = ?, coeficiente = ?, rol = ? WHERE (estado IS NULL OR estado = 0) AND user = ?', [name, numprop, coefici, rol, user]);

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
//            message: '¡Error en el servidor! BD'
            message: `Error: ${error.message}`
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
        await connection.execute('DELETE FROM my_tablecol2');

        for (const { ip, pn, sn, pa, sa, ap, apq } of data) {
            //const user = `${pn.charAt(0)}${sa}`;
            const user = `${pn.charAt(0).toUpperCase()}${pa}`;
            //const name = `${pn}-${sn}-${pa}-${sa}`;
            const name = pn + ' ' + sn + ' ' + pa + ' ' + sa
            const rol = `Usuario`;
            if (ip && name && ap && apq && rol) {
                await connection.execute('INSERT INTO my_tablecol2 (user, name, rol) VALUES (?, ?, ?)', [user, name, rol]);
            }
            // Llamar a la función para ejecutar el proceso
        }

        // Llamada al procedimiento almacenado
        await connection.execute('CALL SP_Valida_ImportarColumnas()'); // Reemplaza 'nombre_del_procedimiento_almacenado' con el nombre real de tu SP
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

// Función para generar y actualizar la contraseña en la tabla
async function updatePasswords() {
    try {
        const [rows] = await pool.execute('SELECT Id, user FROM my_tablecol2');
        if (rows.length === 0) {
            //console.log('No hay usuarios para actualizar.');
            return; // Salir si no hay registros
        }
        for (const row of rows) {
            try {
                const transformedPassword = `${row.user.charAt(0).toUpperCase()}${row.user.slice(1)}24%`;
                const hashedPassword = await bcryptjs.hash(transformedPassword, 8);
                await pool.execute('UPDATE my_tablecol2 SET pass = ? WHERE user = ?', [hashedPassword, row.user]);
            } catch (updateError) {
                console.error(`Error actualizando la contraseña para el usuario ${row.user}:`, updateError);
            }
        }
    } catch (error) {
        console.error('Error en updatePasswords:', error);
    }
}

// End - [cargascol]

app.get('/ver-word', (req, res) => {
    // Aquí usas la URL completa, que incluye el protocolo y el dominio (puede ser http://localhost:3000 o el dominio de producción)
    //const archivoWord = 'http://localhost:3000/uploads/poder.docx';  // Ruta absoluta del archivo Word
    //const archivoWord = path.join(__dirname, `../uploads/poder.docx`);
    const archivoWord = `../uploads/poder.docx`;
    res.render('ver-word', { archivoWord });  // Pasar la variable 'archivoWord' al template EJS
});

app.get('/reloj', (req, res) => {
    //    const ruta = 'emp4';
    //    const archivo = 'poder_18401.pdf';
        const ruta = req.session.nomid;
        const archivo = `PODER.pdf`;
        const archivoPDF = `/uploads/${ruta}/${archivo}`;
        res.render('reloj', { pdfUrl: archivoPDF });
      });

app.get('/ver_poder', (req, res) => {
//    const ruta = 'emp4';
//    const archivo = 'poder_18401.pdf';
    const ruta = req.session.nomid;
    const archivo = `PODER.pdf`;
    const archivoPDF = `/uploads/${ruta}/${archivo}`;
    res.render('ver_poder', { pdfUrl: archivoPDF });
  });

app.get('/ver_poder_usu', (req, res) => {
    const id = req.query.Id;
    const numprop = req.query.numprop;
    const name = req.query.name;
    const propoder = req.query.propoder;
    const proname = req.query.proname;

    const ruta = req.session.nomid;
    const archivo = `PODER_${propoder}_${numprop}.pdf`;
    const archivoPDF = `/uploads/${ruta}/${archivo}`;
    //const archivoPDF = path.join(__dirname, 'uploads', ruta, archivo);
/*
    console.log(archivoPDF); // Imprimirá la ruta completa en el servidor
    console.log('inicia');
    console.log(archivoPDF);
    console.log('Id:', id);
    console.log('Número de propiedad:', numprop);
    console.log('Nombre:', name);
    console.log('Propietario:', propoder);
    console.log('Nombre propietario:', proname);    
 */
    res.render('ver_poder_usu', { pdfUrl: archivoPDF, archivoExistente: true });

/*    
    // Verificamos si el archivo existe
    fs.access(archivoPDF, fs.constants.F_OK, (err) => {
        if (err) {
            // Si el archivo no existe, pasamos archivoExistente: false
            console.log('Archivo no encontrado');
            res.render('ver_poder_usu', { 
                pdfUrl: null, 
                archivoExistente: false, 
                mensajeError: 'El archivo PDF no está cargado o no existe.' 
            });
        } else {
            // Si el archivo existe, pasamos archivoExistente: true y la URL del PDF
            console.log('Archivo encontrado');
            res.render('ver_poder_usu', { pdfUrl: archivoPDF, archivoExistente: true });
        }
    });
*/
//    res.render('ver_poder_usu', { pdfUrl: archivoPDF });
    
});

app.post('/ver_poder_usu', async (req, res) => {
try {
    const tableName = "tbl_poderes_usu";
    const id = req.body.id;
    // Log para borrar archivo fisico
    const [rows] = await pool.execute(`SELECT ruta FROM ${tableName} WHERE id = ?`, [id]);
    const ruta = rows.length > 0 ? rows[0].ruta : null;  // Extraemos el valor de la propiedad 'ruta'
    // BORRAR FISICO

    // Ruta base del servidor donde están almacenados los archivos
    const rutaBase = path.join(__dirname, '../uploads');  // Ruta base relativa para Express
    console.log(rutaBase);
    // Asumimos que 'rows' contiene los datos obtenidos de la base de datos
    const rutaArchivoRelativa = rows.length > 0 ? rows[0].ruta : null;

} catch (error) {
    res.json({
        status: 'error',
        title: 'PDF NO Exitoso.....PODER',
        message: `Error: ${error.message}`
    });
}
});
    
app.get('/ver-pdf', (req, res) => {
//    const ruta = 'emp4';
//    const archivo = 'poder_18401.pdf';
    const ruta = req.session.nomid;
    const archivo = `PODERASM_${req.session.numprop}.pdf`;
    const archivoPDF = `/uploads/${ruta}/${archivo}`;
    res.render('ver-pdf', { pdfUrl: archivoPDF });
    });
    
// Cargar PDF
app.get('/cargarpdf', (req, res) => {
    const nomid = req.session.nomid;
    const id = req.query.Id;
    const numprop = req.query.numprop;
    const name = req.query.name;
    const propoder = req.query.propoder;
    const proname = req.query.proname;
    res.render('cargarpdf', { nomid, id, numprop, name, propoder, proname });
});

// Ruta para cargar la vista de carga
app.get('/cargapoder', (req, res) => {
    const nomid = req.session.nomid;
    const id = req.query.Id;
    const numprop = req.query.numprop;
    const name = req.query.name;
    const propoder = req.query.propoder;
    const proname = req.query.proname;
    res.render('cargapoder', { nomid, id, numprop, name, propoder, proname });
});

// Ruta GET para obtener las ciudades y parqueaderos

app.get('/datos', async (req, res) => {
    try {
        //Console.log('datos');
        // Consultar ciudades
        //const [ciudades] = await pool.execute('SELECT id_ciudad, ciudad FROM tbl_ciudades');
        const [ciudades] = await pool.execute('SELECT numprop, name FROM users');

        // Enviar las ciudades y parqueaderos como respuesta JSON
        res.json({ ciudades});
    } catch (error) {
        console.error("Error al obtener los datos: ", error);
        res.status(500).json({ status: 'error', message: 'Error del servidor' });
    }
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

app.post('/valregTOT', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        // Llamada al procedimiento almacenado
        await connection.execute('CALL SP_validarTOTALES()'); // Reemplaza 'SP_Validar' con tu nombre real de SP

        // Recuperamos los datos de la tabla tbl_valida
        const [rows] = await connection.execute('SELECT * FROM tbl_validaTOT');

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


app.post('/valsecuen', async (req, res) => {
    const connection = await pool.getConnection();
    try {

        // Llamada al procedimiento almacenado
        await connection.execute('CALL SP_Valida_ImportarColumnas()'); // Reemplaza 'nombre_del_procedimiento_almacenado' con el nombre real de tu SP
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

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

/// CERRAR CONEXIONES :  connection.release(); //


