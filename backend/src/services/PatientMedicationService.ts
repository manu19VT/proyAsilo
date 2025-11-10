import { v4 as uuidv4 } from 'uuid';
import { PatientMedication, ID } from '../types';
import { execute, query } from '../database/database';

export class PatientMedicationService {
  async listByPatient(patientId: ID): Promise<PatientMedication[]> {
    const rows = await query<any>(`
      SELECT 
        id,
        patient_id as patientId,
        medication_id as medicationId,
        dosage,
        frequency,
        prescribed_at as prescribedAt,
        prescribed_by as prescribedBy
      FROM patient_medications
      WHERE patient_id = @patientId
      ORDER BY prescribed_at DESC
    `, { patientId });

    return rows.map(row => ({
      id: row.id,
      patientId: row.patientId,
      medicationId: row.medicationId,
      dosage: row.dosage,
      frequency: row.frequency,
      prescribedAt: row.prescribedAt,
      prescribedBy: row.prescribedBy || undefined
    }));
  }

  async assignMedication(data: Omit<PatientMedication, 'id'>): Promise<PatientMedication> {
    const id = uuidv4();
    await execute(`
      INSERT INTO patient_medications (
        id, patient_id, medication_id, dosage, frequency, prescribed_at, prescribed_by
      ) VALUES (
        @id, @patientId, @medicationId, @dosage, @frequency, @prescribedAt, @prescribedBy
      )
    `, {
      id,
      patientId: data.patientId,
      medicationId: data.medicationId,
      dosage: data.dosage,
      frequency: data.frequency,
      prescribedAt: data.prescribedAt,
      prescribedBy: data.prescribedBy || null
    });

    return { id, ...data };
  }
}

export const patientMedicationService = new PatientMedicationService();

