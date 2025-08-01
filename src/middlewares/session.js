import session from 'express-session';

const isProduction = process.env.NODE_ENV === 'production';

export default session({
  secret: process.env.SESSION_SECRET || 'tu-secreto-aqui',  // Mejor usar variable de entorno
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,   // true en producción, false en desarrollo
    maxAge: 2 * 60 * 60 * 1000, // 2 horas
    sameSite: 'lax'         // ayuda a proteger contra CSRF
  }
});

