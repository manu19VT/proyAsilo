import express from 'express';
import crypto from 'crypto';
import { userService } from '../services/UserService';
import { mockService } from '../services/MockService';
import { isMockMode } from '../utils/mockMode';

const router = express.Router();

function hashPassword(password: string, email: string): string {
  const h = crypto.createHash('sha256');
  h.update(`${email.toLowerCase()}::${password}`);
  return h.digest('hex');
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  return res.status(403).json({ error: 'La creación de cuentas está restringida a administradores.' });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son requeridos' });
    }
    
    // Usar mock si está activado
    if (isMockMode()) {
      const passwordHash = hashPassword(password, email);
      const user = mockService.verifyPassword(email, passwordHash);
      if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
      return res.json({ user });
    }
    
    // Modo normal con base de datos
    const passwordHash = hashPassword(password, email);
    const user = await userService.verifyPassword(email, passwordHash);
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    // Para simplicidad, devolvemos el usuario sin token
    return res.json({ user });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error al iniciar sesión' });
  }
});

export default router;
