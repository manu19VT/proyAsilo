import express from 'express';
import crypto from 'crypto';
import { userService } from '../services/UserService';

const router = express.Router();

function hashPassword(password: string, email: string): string {
  // Derive a hash using email as salt to keep it dependency-free
  const h = crypto.createHash('sha256');
  h.update(`${email.toLowerCase()}::${password}`);
  return h.digest('hex');
}

function generateRandomPassword(): string {
  // 12-char base64url-like string
  return crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, role, email } = req.body || {};
    if (!name || !role || !email) {
      return res.status(400).json({ error: 'name, role y email son requeridos' });
    }
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    }

    const password = generateRandomPassword();
    const passwordHash = hashPassword(password, email);

    const user = await userService.createUserWithPasswordHash({ name, role, email, passwordHash });
    return res.status(201).json({ user, password });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error al registrar' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son requeridos' });
    }
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
