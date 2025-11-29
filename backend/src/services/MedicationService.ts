import { v4 as uuidv4 } from 'uuid';
import { Medication } from '../types';
import { query, queryOne, execute } from '../database/database';

export class MedicationService {
  // Listar todos los medicamentos
  async listMedications(search?: string): Promise<Medication[]> {
    let sql = `
      SELECT 
        m.id,
        m.nombre as name,
        m.cantidad as qty,
        m.fecha_vencimiento as expiresAt,
        m.unidad as unit,
        m.dosis as dosage,
        m.codigo_barras as barcode,
        m.fecha_creacion as createdAt,
        m.fecha_actualizacion as updatedAt,
        m.creado_por as createdBy,
        m.actualizado_por as updatedBy,
        u1.nombre as createdByName,
        u2.nombre as updatedByName
      FROM medications m
      LEFT JOIN users u1 ON m.creado_por = u1.id
      LEFT JOIN users u2 ON m.actualizado_por = u2.id
    `;

    const params: Record<string, any> = {};
    if (search) {
      sql += `
        WHERE 
          LOWER(m.nombre) LIKE @query
          OR LOWER(m.unidad) LIKE @query
          OR LOWER(m.dosis) LIKE @query
          OR LOWER(m.codigo_barras) LIKE @query
      `;
      params.query = `%${search.toLowerCase()}%`;
    }

    sql += ' ORDER BY m.nombre ASC';

    const medications = await query<Medication>(sql, params);
    return medications;
  }

  // Obtener medicamento por ID
  async getMedicationById(id: string): Promise<Medication | null> {
    const medication = await queryOne<Medication>(`
      SELECT 
        m.id,
        m.nombre as name,
        m.cantidad as qty,
        m.fecha_vencimiento as expiresAt,
        m.unidad as unit,
        m.dosis as dosage,
        m.codigo_barras as barcode,
        m.fecha_creacion as createdAt,
        m.fecha_actualizacion as updatedAt,
        m.creado_por as createdBy,
        m.actualizado_por as updatedBy,
        u1.nombre as createdByName,
        u2.nombre as updatedByName
      FROM medications m
      LEFT JOIN users u1 ON m.creado_por = u1.id
      LEFT JOIN users u2 ON m.actualizado_por = u2.id
      WHERE m.id = @id
    `, { id });
    return medication;
  }

  // Obtener medicamento por código de barras
  async getMedicationByBarcode(barcode: string): Promise<Medication | null> {
    const medication = await queryOne<Medication>(`
      SELECT 
        m.id,
        m.nombre as name,
        m.cantidad as qty,
        m.fecha_vencimiento as expiresAt,
        m.unidad as unit,
        m.dosis as dosage,
        m.codigo_barras as barcode,
        m.fecha_creacion as createdAt,
        m.fecha_actualizacion as updatedAt,
        m.creado_por as createdBy,
        m.actualizado_por as updatedBy,
        u1.nombre as createdByName,
        u2.nombre as updatedByName
      FROM medications m
      LEFT JOIN users u1 ON m.creado_por = u1.id
      LEFT JOIN users u2 ON m.actualizado_por = u2.id
      WHERE LOWER(m.codigo_barras) = LOWER(@barcode)
    `, { barcode });
    return medication;
  }

  // Crear medicamento
  async createMedication(data: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'> & { createdBy?: string }): Promise<Medication> {
    const id = uuidv4();
    const now = new Date().toISOString();

    if (data.qty < 0) {
      throw new Error('La cantidad debe ser mayor o igual a 0');
    }
    
    await execute(`
      INSERT INTO medications (id, nombre, cantidad, fecha_vencimiento, unidad, dosis, codigo_barras, fecha_creacion, fecha_actualizacion, creado_por, actualizado_por)
      VALUES (@id, @name, @qty, @expiresAt, @unit, @dosage, @barcode, @createdAt, @updatedAt, @createdBy, @updatedBy)
    `, {
      id,
      name: data.name,
      qty: data.qty,
      expiresAt: data.expiresAt,
      unit: data.unit || null,
      dosage: data.dosage || null,
      barcode: data.barcode || null,
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
      SET nombre = COALESCE(@name, nombre),
          cantidad = COALESCE(@qty, cantidad),
          fecha_vencimiento = COALESCE(@expiresAt, fecha_vencimiento),
          unidad = COALESCE(@unit, unidad),
          dosis = COALESCE(@dosage, dosis),
          codigo_barras = COALESCE(@barcode, codigo_barras),
          fecha_actualizacion = @updatedAt,
          actualizado_por = COALESCE(@updatedBy, actualizado_por)
      WHERE id = @id
    `, {
      name: data.name || null,
      qty: data.qty !== undefined ? data.qty : null,
      expiresAt: data.expiresAt || null,
      unit: data.unit || null,
      dosage: data.dosage || null,
      barcode: data.barcode || null,
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
