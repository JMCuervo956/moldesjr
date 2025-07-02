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