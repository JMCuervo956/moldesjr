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
import fs from 'fs'; // Importación del módulo fs
import crypto from 'crypto';
import { pool } from './db.js';		
import { PORT } from './config.js';
import path from 'path';		
import { fileURLToPath } from 'url';	
import mammoth from 'mammoth'; // docx a pdf
import { componentsToColor, defaultCheckBoxAppearanceProvider, PDFDocument } from 'pdf-lib'; // docx a pdf
import { calcularEstadoConColor } from './estadoFechas.js';


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
  saveUninitialized: true,
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




  /* SALIDA ******************************************************************************************/

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
});



// FIN //

