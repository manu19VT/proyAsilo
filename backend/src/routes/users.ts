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

// Crear usuario (admin)
router.post('/', async (req, res) => {
  try {
    const { name, email, role, password, age, birthDate, requireChange } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email y password son requeridos' });
    }

    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(`${String(email).toLowerCase()}::${password}`);
    const passwordHash = hash.digest('hex');

    const user = await userService.createUserWithPasswordHash({
      name,
      email,
      role,
      passwordHash,
      age: age !== undefined ? Number(age) : undefined,
      birthDate: birthDate ?? null,
      requireChange: !!requireChange
    });

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

// Eliminar usuario (requiere confirmar contraseña de un administrador - Rick)
router.delete('/:id', async (req, res) => {
  try {
    const { password } = req.body || {};
    
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Se requiere la contraseña de un administrador para eliminar usuarios' });
    }

    // Buscar el usuario Rick (administrador) - primero por nombre, luego por email
    let adminUser = await userService.getUserByName('Rick');
    if (!adminUser || adminUser.role !== 'admin') {
      // Si no se encuentra por nombre, intentar por email
      adminUser = await userService.getUserByEmail('r@r.com');
    }
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'No se encontró un administrador válido' });
    }

    // Verificar la contraseña del administrador Rick
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(`${adminUser.email!.toLowerCase()}::${password}`);
    const passwordHash = hash.digest('hex');

    const verifiedAdmin = await userService.verifyPassword(adminUser.email!, passwordHash);
    if (!verifiedAdmin) {
      return res.status(401).json({ error: 'Contraseña de administrador incorrecta' });
    }

    // Verificar que el usuario a eliminar existe
    const userToDelete = await userService.getUserById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Si la contraseña del admin es correcta, eliminar el usuario
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
    const { currentPassword, newPassword, requireChange } = req.body || {};
    
    if (!currentPassword || typeof currentPassword !== 'string') {
      return res.status(400).json({ error: 'La contraseña actual es requerida' });
    }
    
    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'La nueva contraseña es requerida' });
    }

    const user = await userService.getUserById(req.params.id);
    if (!user || !user.email) {
      return res.status(404).json({ error: 'Usuario no encontrado o sin correo asociado' });
    }

    // Verificar la contraseña actual
    const crypto = await import('crypto');
    const currentHash = crypto.createHash('sha256');
    currentHash.update(`${user.email.toLowerCase()}::${currentPassword}`);
    const currentPasswordHash = currentHash.digest('hex');

    const verifiedUser = await userService.verifyPassword(user.email, currentPasswordHash);
    if (!verifiedUser) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    // Si la contraseña actual es correcta, actualizar a la nueva contraseña
    const newHash = crypto.createHash('sha256');
    newHash.update(`${user.email.toLowerCase()}::${newPassword}`);
    const newPasswordHash = newHash.digest('hex');

    const updated = await userService.updatePassword(req.params.id, newPasswordHash, !!requireChange);
    if (!updated) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
