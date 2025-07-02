// src/middlewares/session.js
import session from 'express-session';

export default session({
  secret: 'tu-secreto-aqui',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 30 // 30 minutos
  }
});
