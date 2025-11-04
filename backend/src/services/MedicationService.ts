import { v4 as uuidv4 } from 'uuid';
import { Medication } from '../types';
import { query, queryOne, execute } from '../database/database';

export class MedicationService {
  // Listar todos los medicamentos
  async listMedications(): Promise<Medication[]> {
    const medications = await query<Medication>(`
      SELECT 
        m.id,
        m.name,
        m.qty,
        m.expires_at as expiresAt,
        m.created_at as createdAt,
        m.updated_at as updatedAt,
        m.created_by as createdBy,
        m.updated_by as updatedBy,
        u1.name as createdByName,
        u2.name as updatedByName
      FROM medications m
      LEFT JOIN users u1 ON m.created_by = u1.id
      LEFT JOIN users u2 ON m.updated_by = u2.id
      ORDER BY m.name ASC
    `);
    return medications;
  }

  // Obtener medicamento por ID
  async getMedicationById(id: string): Promise<Medication | null> {
    const medication = await queryOne<Medication>(`
      SELECT 
        m.id,
        m.name,
        m.qty,
        m.expires_at as expiresAt,
        m.created_at as createdAt,
        m.updated_at as updatedAt,
        m.created_by as createdBy,
        m.updated_by as updatedBy,
        u1.name as createdByName,
        u2.name as updatedByName
      FROM medications m
      LEFT JOIN users u1 ON m.created_by = u1.id
      LEFT JOIN users u2 ON m.updated_by = u2.id
      WHERE m.id = @id
    `, { id });
    return medication;
  }

  // Crear medicamento
  async createMedication(data: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'> & { createdBy?: string }): Promise<Medication> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // Validar que la caducidad no supere 3 meses
    const expiresDate = new Date(data.expiresAt);
    const nowDate = new Date();
    const monthsDiff = (expiresDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsDiff > 3) {
      throw new Error('La caducidad supera los 3 meses');
    }
    
    if (data.qty < 0) {
      throw new Error('La cantidad debe ser mayor o igual a 0');
    }
    
    await execute(`
      INSERT INTO medications (id, name, qty, expires_at, created_at, updated_at, created_by, updated_by)
      VALUES (@id, @name, @qty, @expiresAt, @createdAt, @updatedAt, @createdBy, @updatedBy)
    `, {
      id,
      name: data.name,
      qty: data.qty,
      expiresAt: data.expiresAt,
      createdAt: now,
      updatedAt: now,
      createdBy: data.createdBy || null,
      updatedBy: data.createdBy || null
    });
    
    const medication = await this.getMedicationById(id);
    return medication!;
  }

  // Actualizar medicamento
  async updateMedication(id: string, data: Partial<Omit<Medication, 'id' | 'createdAt'>> & { updatedBy?: string }): Promise<Medication | null> {
    const existing = await this.getMedicationById(id);
    if (!existing) return null;
    
    const now = new Date().toISOString();
    
    await execute(`
      UPDATE medications 
      SET name = COALESCE(@name, name),
          qty = COALESCE(@qty, qty),
          expires_at = COALESCE(@expiresAt, expires_at),
          updated_at = @updatedAt,
          updated_by = COALESCE(@updatedBy, updated_by)
      WHERE id = @id
    `, {
      name: data.name || null,
      qty: data.qty !== undefined ? data.qty : null,
      expiresAt: data.expiresAt || null,
      updatedAt: now,
      updatedBy: data.updatedBy || null,
      id
    });
    
    return await this.getMedicationById(id);
  }

  // Eliminar medicamento
  async deleteMedication(id: string, deletedBy?: string): Promise<boolean> {
    // Por ahora solo eliminamos, después podemos agregar un campo deleted_by o una tabla de auditoría
    const rowsAffected = await execute('DELETE FROM medications WHERE id = @id', { id });
    return rowsAffected > 0;
  }
}

export const medicationService = new MedicationService();
