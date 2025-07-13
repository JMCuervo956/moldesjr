// src/middlewares/requireSession.js
export function requireSession(req, res, next) {
  const { loggedin, user, name, rol } = req.session;

  if (!loggedin || !user || !name || !rol) {
    return res.redirect('/?expired=1');
  }

  next(); // Todo bien, continúa
}
