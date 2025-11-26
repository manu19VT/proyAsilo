import { v4 as uuidv4 } from 'uuid';
import { PersonalObject, ID } from '../types';
import { query, queryOne, execute } from '../database/database';

export class PersonalObjectService {
  // Verificar si la columna eliminado existe
  private async columnExists(columnName: string): Promise<boolean> {
    try {
      const result = await queryOne<{ exists: number }>(`
        SELECT COUNT(*) as exists
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'personal_objects' AND COLUMN_NAME = @columnName
      `, { columnName });
      return (result?.exists || 0) > 0;
    } catch {
      return false;
    }
  }

  // Listar todos los objetos personales (opcionalmente filtrado por paciente)
  async listPersonalObjects(patientId?: ID): Promise<PersonalObject[]> {
    const hasEliminadoColumn = await this.columnExists('eliminado');
    
    let sql = `
      SELECT 
        po.id,
        po.paciente_id as patientId,
        po.nombre as name,
        po.cantidad as qty,
        po.fecha_recepcion as receivedAt,
        p.nombre as patientName
      FROM personal_objects po
      LEFT JOIN patients p ON po.paciente_id = p.id
    `;
    
    const params: Record<string, any> = {};
    
    // Solo filtrar por eliminado si la columna existe
    if (hasEliminadoColumn) {
      sql += ' WHERE (po.eliminado = 0 OR po.eliminado IS NULL)';
    }
    
    if (patientId) {
      sql += hasEliminadoColumn ? ' AND paciente_id = @patientId' : ' WHERE paciente_id = @patientId';
      params.patientId = patientId;
    }
    
    sql += ' ORDER BY fecha_recepcion DESC';
    
    const objects = await query<PersonalObject>(sql, params);
    return objects;
  }

  // Obtener objeto personal por ID
  async getPersonalObjectById(id: ID): Promise<PersonalObject | null> {
    const hasEliminadoColumn = await this.columnExists('eliminado');
    
    let sql = `
      SELECT 
        po.id,
        po.paciente_id as patientId,
        po.nombre as name,
        po.cantidad as qty,
        po.fecha_recepcion as receivedAt,
        p.nombre as patientName
      FROM personal_objects po
      LEFT JOIN patients p ON po.paciente_id = p.id
      WHERE po.id = @id
    `;
    
    if (hasEliminadoColumn) {
      sql += ' AND (po.eliminado = 0 OR po.eliminado IS NULL)';
    }
    
    const obj = await queryOne<PersonalObject>(sql, { id });
    return obj || null;
  }

  // Crear objeto personal
  async createPersonalObject(data: Omit<PersonalObject, 'id' | 'receivedAt'>): Promise<PersonalObject> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await execute(`
      INSERT INTO personal_objects (id, paciente_id, nombre, cantidad, fecha_recepcion)
      VALUES (@id, @patientId, @name, @qty, @receivedAt)
    `, {
      id,
      patientId: data.patientId,
      name: data.name,
      qty: data.qty,
      receivedAt: now
    });
    
    const obj = await this.getPersonalObjectById(id);
    return obj!;
  }

  // Actualizar objeto personal
  async updatePersonalObject(id: ID, data: Partial<Omit<PersonalObject, 'id' | 'receivedAt'>>): Promise<PersonalObject | null> {
    const existing = await this.getPersonalObjectById(id);
    if (!existing) return null;
    
    await execute(`
      UPDATE personal_objects 
      SET paciente_id = COALESCE(@patientId, paciente_id),
          nombre = COALESCE(@name, nombre),
          cantidad = COALESCE(@qty, cantidad)
      WHERE id = @id
    `, {
      patientId: data.patientId || null,
      name: data.name || null,
      qty: data.qty !== undefined ? data.qty : null,
      id
    });
    
    return await this.getPersonalObjectById(id);
  }

  // Eliminar objeto personal (soft delete o hard delete si no existe la columna)
  async deletePersonalObject(id: ID): Promise<boolean> {
    const hasEliminadoColumn = await this.columnExists('eliminado');
    
    // Verificar que el objeto existe
    let checkSql = `SELECT id FROM personal_objects WHERE id = @id`;
    if (hasEliminadoColumn) {
      checkSql += ' AND (eliminado = 0 OR eliminado IS NULL)';
    }
    
    const existing = await queryOne<{ id: string }>(checkSql, { id });
    
    if (!existing) return false;
    
    let rowsAffected: number;
    
    if (hasEliminadoColumn) {
      // Soft delete
      const now = new Date().toISOString();
      rowsAffected = await execute(`
        UPDATE personal_objects 
        SET eliminado = 1, fecha_eliminacion = @fechaEliminacion
        WHERE id = @id
      `, { id, fechaEliminacion: now });
    } else {
      // Hard delete (fallback si la columna no existe)
      rowsAffected = await execute('DELETE FROM personal_objects WHERE id = @id', { id });
    }
    
    return rowsAffected > 0;
  }
}

export const personalObjectService = new PersonalObjectService();
