import express from 'express';
import { patientService } from '../services/PatientService';

const router = express.Router();

// Listar pacientes
router.get('/', async (req, res) => {
  try {
    const query = req.query.q as string | undefined;
    const patients = await patientService.listPatients(query);
    res.json(patients);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener paciente por ID
router.get('/:id', async (req, res) => {
  try {
    const patient = await patientService.getPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    res.json(patient);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear paciente
router.post('/', async (req, res) => {
  try {
    // El frontend debe enviar userId en el body: { ..., userId: "..." }
    const patient = await patientService.createPatient({
      ...req.body,
      createdBy: req.body.userId || null
    });
    res.status(201).json(patient);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Actualizar paciente
router.put('/:id', async (req, res) => {
  try {
    // El frontend debe enviar userId en el body: { ..., userId: "..." }
    const patient = await patientService.updatePatient(req.params.id, {
      ...req.body,
      updatedBy: req.body.userId || null
    });
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    res.json(patient);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar paciente
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await patientService.deletePatient(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    res.json({ message: 'Paciente eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Rutas de Contactos ==========

// Listar contactos de un paciente
router.get('/:patientId/contacts', async (req, res) => {
  try {
    const contacts = await patientService.getContactsByPatientId(req.params.patientId);
    res.json(contacts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar contacto a paciente
router.post('/:patientId/contacts', async (req, res) => {
  try {
    const contact = await patientService.createContact({
      patientId: req.params.patientId,
      ...req.body
    });
    res.status(201).json(contact);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Actualizar contacto
router.put('/contacts/:contactId', async (req, res) => {
  try {
    const contact = await patientService.updateContact(req.params.contactId, req.body);
    if (!contact) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }
    res.json(contact);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar contacto
router.delete('/contacts/:contactId', async (req, res) => {
  try {
    const deleted = await patientService.deleteContact(req.params.contactId);
    if (!deleted) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }
    res.json({ message: 'Contacto eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
