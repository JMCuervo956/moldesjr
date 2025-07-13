import session from 'express-session';

const isProduction = process.env.NODE_ENV === 'production';

export default session({
  secret: 'tu-secreto-aqui',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,   // true en producción, false en desarrollo
    maxAge: 15 * 60 * 1000
  }
});

