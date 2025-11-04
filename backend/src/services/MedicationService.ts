import { v4 as uuidv4 } from 'uuid';
import { Medication } from '../types';
import { query, queryOne, execute } from '../database/database';

export class MedicationService {
  // Listar todos los medicamentos
  async listMedications(): Promise<Medication[]> {
    const medications = await query<Medication>(`
      SELECT 
        id,
        name,
        qty,
        expires_at as expiresAt,
        created_at as createdAt,
        updated_at as updatedAt
      FROM medications
      ORDER BY name ASC
    `);
    return medications;
  }

  // Obtener medicamento por ID
  async getMedicationById(id: string): Promise<Medication | null> {
    const medication = await queryOne<Medication>(`
      SELECT 
        id,
        name,
        qty,
        expires_at as expiresAt,
        created_at as createdAt,
        updated_at as updatedAt
      FROM medications 
      WHERE id = @id
    `, { id });
    return medication;
  }

  // Crear medicamento
  async createMedication(data: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>): Promise<Medication> {
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
      INSERT INTO medications (id, name, qty, expires_at, created_at, updated_at)
      VALUES (@id, @name, @qty, @expiresAt, @createdAt, @updatedAt)
    `, {
      id,
      name: data.name,
      qty: data.qty,
      expiresAt: data.expiresAt,
      createdAt: now,
      updatedAt: now
    });
    
    const medication = await this.getMedicationById(id);
    return medication!;
  }

  // Actualizar medicamento
  async updateMedication(id: string, data: Partial<Omit<Medication, 'id' | 'createdAt'>>): Promise<Medication | null> {
    const existing = await this.getMedicationById(id);
    if (!existing) return null;
    
    const now = new Date().toISOString();
    
    await execute(`
      UPDATE medications 
      SET name = COALESCE(@name, name),
          qty = COALESCE(@qty, qty),
          expires_at = COALESCE(@expiresAt, expires_at),
          updated_at = @updatedAt
      WHERE id = @id
    `, {
      name: data.name || null,
      qty: data.qty !== undefined ? data.qty : null,
      expiresAt: data.expiresAt || null,
      updatedAt: now,
      id
    });
    
    return await this.getMedicationById(id);
  }

  // Eliminar medicamento
  async deleteMedication(id: string): Promise<boolean> {
    const rowsAffected = await execute('DELETE FROM medications WHERE id = @id', { id });
    return rowsAffected > 0;
  }
}

export const medicationService = new MedicationService();
