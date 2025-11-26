import express from 'express';
import { patientMedicationService } from '../services/PatientMedicationService';

const router = express.Router();

router.get('/patients/:patientId', async (req, res) => {
  try {
    const meds = await patientMedicationService.listByPatient(req.params.patientId);
    res.json(meds);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { patientId, medicationId, dosage, frequency, prescribedAt, prescribedBy } = req.body || {};
    if (!patientId || !medicationId || !dosage || !frequency || !prescribedAt) {
      return res.status(400).json({ error: 'patientId, medicationId, dosage, frequency y prescribedAt son requeridos' });
    }

    const assignment = await patientMedicationService.assignMedication({
      patientId,
      medicationId,
      dosage,
      frequency,
      prescribedAt,
      prescribedBy
    });

    res.status(201).json(assignment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;







