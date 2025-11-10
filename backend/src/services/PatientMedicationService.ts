import { v4 as uuidv4 } from 'uuid';
import { PatientMedication, ID } from '../types';
import { execute, query, queryOne } from '../database/database';

export class PatientMedicationService {
  async listByPatient(patientId: ID): Promise<PatientMedication[]> {
    const rows = await query<any>(`
      SELECT 
        pm.id,
        pm.patient_id as patientId,
        pm.medication_id as medicationId,
        pm.dosage,
        pm.frequency,
        pm.prescribed_at as prescribedAt,
        pm.prescribed_by as prescribedBy,
        m.name as medicationName,
        m.unit as medicationUnit,
        m.dosage as medicationDosage
      FROM patient_medications pm
      LEFT JOIN medications m ON pm.medication_id = m.id
      WHERE pm.patient_id = @patientId
      ORDER BY pm.prescribed_at DESC
    `, { patientId });

    return rows.map(row => ({
      id: row.id,
      patientId: row.patientId,
      medicationId: row.medicationId,
      dosage: row.dosage,
      frequency: row.frequency,
      prescribedAt: row.prescribedAt,
      prescribedBy: row.prescribedBy || undefined,
      medicationName: row.medicationName || undefined,
      medicationUnit: row.medicationUnit || undefined,
      medicationDosage: row.medicationDosage || undefined
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

    const row = await queryOne<any>(`
      SELECT 
        pm.id,
        pm.patient_id as patientId,
        pm.medication_id as medicationId,
        pm.dosage,
        pm.frequency,
        pm.prescribed_at as prescribedAt,
        pm.prescribed_by as prescribedBy,
        m.name as medicationName,
        m.unit as medicationUnit,
        m.dosage as medicationDosage
      FROM patient_medications pm
      LEFT JOIN medications m ON pm.medication_id = m.id
      WHERE pm.id = @id
    `, { id });

    return {
      id,
      patientId: row.patientId,
      medicationId: row.medicationId,
      dosage: row.dosage,
      frequency: row.frequency,
      prescribedAt: row.prescribedAt,
      prescribedBy: row.prescribedBy || undefined,
      medicationName: row.medicationName || undefined,
      medicationUnit: row.medicationUnit || undefined,
      medicationDosage: row.medicationDosage || undefined
    };
  }
}

export const patientMedicationService = new PatientMedicationService();



