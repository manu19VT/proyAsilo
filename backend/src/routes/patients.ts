import express from 'express';
import { patientService } from '../services/PatientService';
import { mockService } from '../services/MockService';
import { isMockMode } from '../utils/mockMode';

const router = express.Router();

// Listar pacientes
router.get('/', async (req, res) => {
  try {
    const { q, status, contactName, userId, userRole } = req.query as { 
      q?: string; 
      status?: string; 
      contactName?: string;
      userId?: string;
      userRole?: string;
    };
    
    if (isMockMode()) {
      const patients = mockService.listPatients({
        query: q,
        status: status === 'activo' || status === 'baja' ? status : undefined,
        contactName,
      });
      return res.json(patients);
    }
    
    const patients = await patientService.listPatients({
      query: q,
      status: status === 'activo' || status === 'baja' ? status : undefined,
      contactName,
      userId,
      userRole
    });
    res.json(patients);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener paciente por ID
router.get('/:id', async (req, res) => {
  try {
    if (isMockMode()) {
      const patient = mockService.getPatientById(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }
      return res.json(patient);
    }
    
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
    if (isMockMode()) {
      const patient = mockService.addPatient(req.body);
      return res.status(201).json(patient);
    }
    
    // Obtener el rol del usuario si se proporciona userId
    let userRole: string | undefined = req.body.userRole;
    if (!userRole && req.body.userId) {
      const { userService } = await import('../services/UserService');
      const user = await userService.getUserById(req.body.userId);
      userRole = user?.role;
    }

    const patient = await patientService.createPatient({
      ...req.body,
      createdBy: req.body.userId || null,
      doctorId: req.body.doctorId || undefined,
      nurseId: req.body.nurseId || undefined,
      userRole: userRole
    });
    res.status(201).json(patient);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Actualizar paciente
router.put('/:id', async (req, res) => {
  try {
    if (isMockMode()) {
      const patient = mockService.updatePatient(req.params.id, req.body);
      if (!patient) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }
      return res.json(patient);
    }
    
    const patient = await patientService.updatePatient(req.params.id, {
      ...req.body,
      updatedBy: req.body.userId || null,
      doctorId: req.body.doctorId || undefined,
      nurseId: req.body.nurseId || undefined
    });
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    res.json(patient);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/discharge', async (req, res) => {
  try {
    const { reason, userId } = req.body || {};
    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({ error: 'reason es requerido' });
    }
    
    if (isMockMode()) {
      const patient = mockService.getPatientById(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }
      patient.status = 'baja';
      patient.dischargeDate = new Date().toISOString();
      patient.dischargeReason = reason;
      return res.json(patient);
    }
    
    const patient = await patientService.dischargePatient(req.params.id, reason, userId);
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    res.json(patient);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/reactivate', async (req, res) => {
  try {
    if (isMockMode()) {
      const patient = mockService.restorePatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }
      return res.json(patient);
    }
    
    const { userId } = req.body || {};
    const patient = await patientService.reactivatePatient(req.params.id, userId);
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    res.json(patient);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar paciente (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    if (isMockMode()) {
      const deleted = mockService.deletePatient(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }
      return res.json({ message: 'Paciente eliminado correctamente' });
    }
    
    const { userId, userName } = req.body || {};
    const deleted = await patientService.deletePatient(req.params.id, userId, userName);
    if (!deleted) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    res.json({ message: 'Paciente eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Restaurar paciente eliminado (soft delete)
router.post('/:id/restore', async (req, res) => {
  try {
    if (isMockMode()) {
      const patient = mockService.restorePatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: 'Paciente no encontrado o no está eliminado' });
      }
      return res.json({ message: 'Paciente restaurado correctamente' });
    }
    
    const { userId } = req.body || {};
    const restored = await patientService.restorePatient(req.params.id, userId);
    if (!restored) {
      return res.status(404).json({ error: 'Paciente no encontrado o no está eliminado' });
    }
    res.json({ message: 'Paciente restaurado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Rutas de Contactos ==========

// Listar contactos de un paciente
router.get('/:patientId/contacts', async (req, res) => {
  try {
    if (isMockMode()) {
      const patient = mockService.getPatientById(req.params.patientId);
      return res.json(patient?.contacts || []);
    }
    
    const contacts = await patientService.getContactsByPatientId(req.params.patientId);
    res.json(contacts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar contacto a paciente
router.post('/:patientId/contacts', async (req, res) => {
  try {
    if (isMockMode()) {
      const contact = mockService.addContact(req.params.patientId, req.body);
      return res.status(201).json(contact);
    }
    
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
    if (isMockMode()) {
      const contact = mockService.updateContact(req.params.contactId, req.body);
      if (!contact) {
        return res.status(404).json({ error: 'Contacto no encontrado' });
      }
      return res.json(contact);
    }
    
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
    if (isMockMode()) {
      const deleted = mockService.deleteContact(req.params.contactId);
      if (!deleted) {
        return res.status(404).json({ error: 'Contacto no encontrado' });
      }
      return res.json({ message: 'Contacto eliminado correctamente' });
    }
    
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
