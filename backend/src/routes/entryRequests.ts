import express from 'express';
import { entryRequestService } from '../services/EntryRequestService';
import { separateEntryService } from '../services/SeparateEntryService';
import { mockService } from '../services/MockService';
import { isMockMode } from '../utils/mockMode';

const router = express.Router();

// Listar solicitudes
router.get('/', async (req, res) => {
  try {
    const { type, patientId } = req.query as { type?: string; patientId?: string };
    
    if (isMockMode()) {
      const entryRequests = mockService.listEntryRequests({
        type: type === 'entrada' || type === 'salida' || type === 'caducidad' ? type : undefined,
        patientId: patientId || undefined
      });
      return res.json(entryRequests);
    }
    
    // Usar el nuevo servicio con tablas separadas
    const entryRequests = await separateEntryService.listEntryRequests({
      type: type === 'entrada' || type === 'salida' || type === 'caducidad' ? type as any : undefined,
      patientId: patientId || undefined
    });
    res.json(entryRequests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/folio/:folio', async (req, res) => {
  try {
    if (isMockMode()) {
      const entryRequest = mockService.getEntryRequestByFolio(req.params.folio);
      if (!entryRequest) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }
      return res.json(entryRequest);
    }
    
    const entryRequest = await separateEntryService.getEntryRequestByFolio(req.params.folio);
    if (!entryRequest) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }
    res.json(entryRequest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener solicitud por ID
router.get('/:id', async (req, res) => {
  try {
    if (isMockMode()) {
      const entryRequest = mockService.getEntryRequestById(req.params.id);
      if (!entryRequest) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }
      return res.json(entryRequest);
    }
    
    const entryRequest = await separateEntryService.getEntryRequestById(req.params.id);
    if (!entryRequest) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }
    res.json(entryRequest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear solicitud
router.post('/', async (req, res) => {
  try {
    const { type, patientId, items, status, dueDate, userId, comment } = req.body || {};
    
    // Validar tipo
    if (!type) {
      return res.status(400).json({ error: 'type es requerido' });
    }
    
    const validTypes = ['entrada', 'salida', 'caducidad'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `type debe ser uno de: ${validTypes.join(', ')}` });
    }
    
    // Para entradas y caducidad, NO se requiere patientId. Solo para salidas.
    if (type === 'salida') {
      if (!patientId || patientId.trim() === '') {
        return res.status(400).json({ error: 'patientId es requerido para salidas' });
      }
    }
    
    // Para entrada y caducidad, asegurarse de que patientId no se envíe
    const finalPatientId = (type === 'entrada' || type === 'caducidad') ? undefined : (patientId || undefined);
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Debe incluir al menos un item' });
    }

    if (isMockMode()) {
      const entryRequest = mockService.addEntryRequest({
        type,
        patientId: finalPatientId,
        items,
        status: status || 'completa',
        dueDate,
      });
      return res.status(201).json(entryRequest);
    }

    const entryRequest = await separateEntryService.createEntryRequest({
      type,
      patientId: finalPatientId,
      items,
      status: status || 'completa',
      dueDate,
      userId,
      comment
    });
    res.status(201).json(entryRequest);
  } catch (error: any) {
    console.error('Error al crear entrada:', error);
    res.status(400).json({ error: error.message || 'Error al registrar el movimiento' });
  }
});

// Actualizar solicitud
router.put('/:id', async (req, res) => {
  try {
    if (isMockMode()) {
      const entryRequest = mockService.updateEntryRequest(req.params.id, req.body);
      if (!entryRequest) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }
      return res.json(entryRequest);
    }
    
    const entryRequest = await separateEntryService.updateEntryRequest(req.params.id, req.body);
    if (!entryRequest) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }
    res.json(entryRequest);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar solicitud
router.delete('/:id', async (req, res) => {
  try {
    if (isMockMode()) {
      const deleted = mockService.deleteEntryRequest(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }
      return res.json({ message: 'Solicitud eliminada correctamente' });
    }
    
    const deleted = await separateEntryService.deleteEntryRequest(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }
    res.json({ message: 'Solicitud eliminada correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
