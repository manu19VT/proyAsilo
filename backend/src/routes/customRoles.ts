import express from 'express';
import { customRoleService } from '../services/CustomRoleService';

const router = express.Router();

// Listar todos los roles personalizados
router.get('/', async (req, res) => {
  try {
    const roles = await customRoleService.listRoles();
    res.json(roles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un rol por ID
router.get('/:id', async (req, res) => {
  try {
    const role = await customRoleService.getRoleById(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }
    res.json(role);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear un nuevo rol
router.post('/', async (req, res) => {
  try {
    const { nombre, permisos } = req.body || {};

    if (!nombre || !Array.isArray(permisos) || permisos.length === 0) {
      return res.status(400).json({ error: 'nombre y permisos son requeridos' });
    }

    // Validar permisos
    const validPermissions = ["pacientes", "medicamentos", "control_es", "objetos"];
    const invalidPermissions = permisos.filter((p: string) => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      return res.status(400).json({ error: `Permisos inválidos: ${invalidPermissions.join(', ')}` });
    }

    const role = await customRoleService.createRole(nombre, permisos);
    res.status(201).json(role);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Actualizar un rol
router.put('/:id', async (req, res) => {
  try {
    const { nombre, permisos } = req.body || {};

    if (!nombre || !Array.isArray(permisos) || permisos.length === 0) {
      return res.status(400).json({ error: 'nombre y permisos son requeridos' });
    }

    // Validar permisos
    const validPermissions = ["pacientes", "medicamentos", "control_es", "objetos"];
    const invalidPermissions = permisos.filter((p: string) => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      return res.status(400).json({ error: `Permisos inválidos: ${invalidPermissions.join(', ')}` });
    }

    const role = await customRoleService.updateRole(req.params.id, nombre, permisos);
    if (!role) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }
    res.json(role);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar un rol
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await customRoleService.deleteRole(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }
    res.json({ message: 'Rol eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


