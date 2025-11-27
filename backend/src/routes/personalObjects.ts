import express from 'express';
import { personalObjectService } from '../services/PersonalObjectService';
import { mockService } from '../services/MockService';
import { isMockMode } from '../utils/mockMode';

const router = express.Router();

// Listar objetos personales (opcionalmente filtrado por paciente)
router.get('/', async (req, res) => {
  try {
    const patientId = req.query.patientId as string | undefined;
    
    if (isMockMode()) {
      const objects = mockService.listPersonalObjects(patientId);
      return res.json(objects);
    }
    
    const objects = await personalObjectService.listPersonalObjects(patientId);
    res.json(objects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener objeto personal por ID
router.get('/:id', async (req, res) => {
  try {
    if (isMockMode()) {
      const object = mockService.getPersonalObjectById(req.params.id);
      if (!object) {
        return res.status(404).json({ error: 'Objeto personal no encontrado' });
      }
      return res.json(object);
    }
    
    const object = await personalObjectService.getPersonalObjectById(req.params.id);
    if (!object) {
      return res.status(404).json({ error: 'Objeto personal no encontrado' });
    }
    res.json(object);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear objeto personal
router.post('/', async (req, res) => {
  try {
    if (isMockMode()) {
      const object = mockService.addPersonalObject(req.body);
      return res.status(201).json(object);
    }
    
    const object = await personalObjectService.createPersonalObject(req.body);
    res.status(201).json(object);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Actualizar objeto personal
router.put('/:id', async (req, res) => {
  try {
    if (isMockMode()) {
      const object = mockService.updatePersonalObject(req.params.id, req.body);
      if (!object) {
        return res.status(404).json({ error: 'Objeto personal no encontrado' });
      }
      return res.json(object);
    }
    
    const object = await personalObjectService.updatePersonalObject(req.params.id, req.body);
    if (!object) {
      return res.status(404).json({ error: 'Objeto personal no encontrado' });
    }
    res.json(object);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar objeto personal
router.delete('/:id', async (req, res) => {
  try {
    if (isMockMode()) {
      const deleted = mockService.deletePersonalObject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Objeto personal no encontrado' });
      }
      return res.json({ message: 'Objeto personal eliminado correctamente' });
    }
    
    const deleted = await personalObjectService.deletePersonalObject(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Objeto personal no encontrado' });
    }
    res.json({ message: 'Objeto personal eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
