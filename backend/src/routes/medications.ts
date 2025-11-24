import express from 'express';
import { medicationService } from '../services/MedicationService';
import { userService } from '../services/UserService';

const router = express.Router();

// Listar medicamentos
router.get('/', async (req, res) => {
  try {
    const { q } = req.query as { q?: string };
    const medications = await medicationService.listMedications(q);
    res.json(medications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener medicamento por ID
router.get('/:id', async (req, res) => {
  try {
    const medication = await medicationService.getMedicationById(req.params.id);
    if (!medication) {
      return res.status(404).json({ error: 'Medicamento no encontrado' });
    }
    res.json(medication);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear medicamento (solo admin, doctor, nurse)
router.post('/', async (req, res) => {
  try {
    const { userId } = req.body || {};
    
    // Validar que el usuario tenga permiso (admin, doctor, nurse)
    if (userId) {
      const user = await userService.getUserById(userId);
      if (user) {
        const allowedRoles = ['admin', 'doctor', 'nurse'];
        if (!allowedRoles.includes(user.role)) {
          return res.status(403).json({ error: 'Solo administradores, doctores y enfermeras pueden agregar medicamentos' });
        }
      }
    }
    
    // El frontend debe enviar userId en el body: { ..., userId: "..." }
    const medication = await medicationService.createMedication({
      ...req.body,
      createdBy: userId || null
    });
    res.status(201).json(medication);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Actualizar medicamento
router.put('/:id', async (req, res) => {
  try {
    // El frontend debe enviar userId en el body: { ..., userId: "..." }
    const medication = await medicationService.updateMedication(req.params.id, {
      ...req.body,
      updatedBy: req.body.userId || null
    });
    if (!medication) {
      return res.status(404).json({ error: 'Medicamento no encontrado' });
    }
    res.json(medication);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar medicamento
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await medicationService.deleteMedication(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Medicamento no encontrado' });
    }
    res.json({ message: 'Medicamento eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
