import express from 'express';
import { entryRequestService } from '../services/EntryRequestService';
import { mockService } from '../services/MockService';
import { isMockMode } from '../utils/mockMode';

const router = express.Router();

// Listar solicitudes
router.get('/', async (req, res) => {
  try {
    const { type, patientId } = req.query as { type?: string; patientId?: string };
    
    if (isMockMode()) {
      const entryRequests = mockService.listEntryRequests({
        type: type === 'entrada' || type === 'salida' ? type : undefined,
        patientId: patientId || undefined
      });
      return res.json(entryRequests);
    }
    
    const entryRequests = await entryRequestService.listEntryRequests({
      type: type === 'entrada' || type === 'salida' ? type : undefined,
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
    
    const entryRequest = await entryRequestService.getEntryRequestByFolio(req.params.folio);
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
    
    const entryRequest = await entryRequestService.getEntryRequestById(req.params.id);
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
    const { type, patientId, items, status, dueDate, userId } = req.body || {};
    if (!type || (type !== 'entrada' && type !== 'salida' && type !== 'caducidad')) {
      return res.status(400).json({ error: 'type debe ser "entrada", "salida" o "caducidad"' });
    }
    // Para entradas, no se requiere patientId. Para salidas y caducidad, es obligatorio.
    if (type !== 'entrada' && !patientId) {
      return res.status(400).json({ error: 'patientId es requerido para salidas y caducidad' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Debe incluir al menos un item' });
    }

    if (isMockMode()) {
      const entryRequest = mockService.addEntryRequest({
        type,
        patientId,
        items,
        status: status || 'completa',
        dueDate,
      });
      return res.status(201).json(entryRequest);
    }

    const entryRequest = await entryRequestService.createEntryRequest({
      type,
      patientId: type === 'entrada' ? undefined : patientId,
      items,
      status: status || 'completa',
      dueDate,
      userId
    });
    res.status(201).json(entryRequest);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
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
    
    const entryRequest = await entryRequestService.updateEntryRequest(req.params.id, req.body);
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
    
    const deleted = await entryRequestService.deleteEntryRequest(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }
    res.json({ message: 'Solicitud eliminada correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
