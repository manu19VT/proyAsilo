import express from 'express';
import { medicationService } from '../services/MedicationService';

const router = express.Router();

// Listar medicamentos
router.get('/', async (req, res) => {
  try {
    const medications = await medicationService.listMedications();
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

// Crear medicamento
router.post('/', async (req, res) => {
  try {
    const medication = await medicationService.createMedication(req.body);
    res.status(201).json(medication);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Actualizar medicamento
router.put('/:id', async (req, res) => {
  try {
    const medication = await medicationService.updateMedication(req.params.id, req.body);
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
