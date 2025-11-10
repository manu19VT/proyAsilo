import express from 'express';
import { userService } from '../services/UserService';

const router = express.Router();

// Listar usuarios
router.get('/', async (req, res) => {
  try {
    const { role } = req.query as { role?: string };
    const users = await userService.listUsers(role);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear usuario
router.post('/', async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Actualizar usuario
router.put('/:id', async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar usuario
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await userService.deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/change-password', async (req, res) => {
  try {
    const { password, requireChange } = req.body || {};
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'password es requerido' });
    }

    const user = await userService.getUserById(req.params.id);
    if (!user || !user.email) {
      return res.status(404).json({ error: 'Usuario no encontrado o sin correo asociado' });
    }

    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(`${user.email.toLowerCase()}::${password}`);
    const passwordHash = hash.digest('hex');

    const updated = await userService.updatePassword(req.params.id, passwordHash, !!requireChange);
    if (!updated) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
