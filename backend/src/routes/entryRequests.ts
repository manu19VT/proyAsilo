import express from 'express';
import { entryRequestService } from '../services/EntryRequestService';

const router = express.Router();

// Listar solicitudes
router.get('/', async (req, res) => {
  try {
    const entryRequests = await entryRequestService.listEntryRequests();
    res.json(entryRequests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener solicitud por ID
router.get('/:id', async (req, res) => {
  try {
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
    const entryRequest = await entryRequestService.createEntryRequest(req.body);
    res.status(201).json(entryRequest);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Actualizar solicitud
router.put('/:id', async (req, res) => {
  try {
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
