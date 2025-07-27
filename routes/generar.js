const express = require('express');
const router = express.Router();
const pool = require('../db'); // Esto apunta a tu conexión a MySQL

router.post('/generarSemana', async (req, res) => {
    const { fecha, idot } = req.body;

    if (!fecha || !idot) {
        return res.status(400).json({ status: 'error', message: 'Faltan datos: fecha o idot' });
    }

    try {
        const conn = await pool.getConnection();
        await conn.query('CALL sp_insertar_items_por_rango(?, ?)', [fecha, idot]);
        conn.release();

        res.json({ status: 'ok' });
    } catch (err) {
        console.error('Error al ejecutar el SP:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
