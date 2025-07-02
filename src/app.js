// src/app.js

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import session from './middlewares/session.js';
import authRoutes from './routes/auth.js';
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

// Puerto de escucha
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running at http://0.0.0.0:${PORT}`);
});
