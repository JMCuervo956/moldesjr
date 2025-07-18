// src/routes/auth.js
import { Router } from 'express';
import { login } from '../controllers/authController.js';

const router = Router();

router.post('/auth', login);

export default router;
