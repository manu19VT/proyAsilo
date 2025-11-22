import { v4 as uuidv4 } from 'uuid';
import { PatientMedication, ID } from '../types';
import { execute, query, queryOne } from '../database/database';

export class PatientMedicationService {
  async listByPatient(patientId: ID): Promise<PatientMedication[]> {
    const rows = await query<any>(`
      SELECT 
        pm.id,
        pm.paciente_id as patientId,
        pm.medicamento_id as medicationId,
        pm.dosis as dosage,
        pm.frecuencia as frequency,
        pm.fecha_prescripcion as prescribedAt,
        pm.prescrito_por as prescribedBy,
        pm.cantidad as cantidad,
        m.nombre as medicationName,
        m.unidad as medicationUnit,
        m.dosis as medicationDosage
      FROM patient_medications pm
      LEFT JOIN medications m ON pm.medicamento_id = m.id
      WHERE pm.paciente_id = @patientId
      ORDER BY pm.fecha_prescripcion DESC
    `, { patientId });

    return rows.map(row => ({
      id: row.id,
      patientId: row.patientId,
      medicationId: row.medicationId,
      dosage: row.dosage,
      frequency: row.frequency,
      prescribedAt: row.prescribedAt,
      prescribedBy: row.prescribedBy || undefined,
      cantidad: row.cantidad || undefined,
      medicationName: row.medicationName || undefined,
      medicationUnit: row.medicationUnit || undefined,
      medicationDosage: row.medicationDosage || undefined
    }));
  }

  async assignMedication(data: Omit<PatientMedication, 'id'>): Promise<PatientMedication> {
    const id = uuidv4();
    await execute(`
      INSERT INTO patient_medications (
        id, paciente_id, medicamento_id, dosis, frecuencia, fecha_prescripcion, prescrito_por, cantidad
      ) VALUES (
        @id, @patientId, @medicationId, @dosage, @frequency, @prescribedAt, @prescribedBy, @cantidad
      )
    `, {
      id,
      patientId: data.patientId,
      medicationId: data.medicationId,
      dosage: data.dosage,
      frequency: data.frequency,
      prescribedAt: data.prescribedAt,
      prescribedBy: data.prescribedBy || null,
      cantidad: data.cantidad || null
    });

    const row = await queryOne<any>(`
      SELECT 
        pm.id,
        pm.paciente_id as patientId,
        pm.medicamento_id as medicationId,
        pm.dosis as dosage,
        pm.frecuencia as frequency,
        pm.fecha_prescripcion as prescribedAt,
        pm.prescrito_por as prescribedBy,
        pm.cantidad as cantidad,
        m.nombre as medicationName,
        m.unidad as medicationUnit,
        m.dosis as medicationDosage
      FROM patient_medications pm
      LEFT JOIN medications m ON pm.medicamento_id = m.id
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
      cantidad: row.cantidad || undefined,
      medicationName: row.medicationName || undefined,
      medicationUnit: row.medicationUnit || undefined,
      medicationDosage: row.medicationDosage || undefined
    };
  }
}

export const patientMedicationService = new PatientMedicationService();



