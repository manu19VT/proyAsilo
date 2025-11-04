import { v4 as uuidv4 } from 'uuid';
import { PersonalObject, ID } from '../types';
import { query, queryOne, execute } from '../database/database';

export class PersonalObjectService {
  // Listar todos los objetos personales (opcionalmente filtrado por paciente)
  async listPersonalObjects(patientId?: ID): Promise<PersonalObject[]> {
    let sql = `
      SELECT 
        id,
        patient_id as patientId,
        name,
        qty,
        received_at as receivedAt
      FROM personal_objects
    `;
    
    const params: Record<string, any> = {};
    
    if (patientId) {
      sql += ' WHERE patient_id = @patientId';
      params.patientId = patientId;
    }
    
    sql += ' ORDER BY received_at DESC';
    
    const objects = await query<PersonalObject>(sql, params);
    return objects;
  }

  // Obtener objeto personal por ID
  async getPersonalObjectById(id: ID): Promise<PersonalObject | null> {
    const obj = await queryOne<PersonalObject>(`
      SELECT 
        id,
        patient_id as patientId,
        name,
        qty,
        received_at as receivedAt
      FROM personal_objects 
      WHERE id = @id
    `, { id });
    return obj;
  }

  // Crear objeto personal
  async createPersonalObject(data: Omit<PersonalObject, 'id' | 'receivedAt'>): Promise<PersonalObject> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await execute(`
      INSERT INTO personal_objects (id, patient_id, name, qty, received_at)
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
      SET patient_id = COALESCE(@patientId, patient_id),
          name = COALESCE(@name, name),
          qty = COALESCE(@qty, qty)
      WHERE id = @id
    `, {
      patientId: data.patientId || null,
      name: data.name || null,
      qty: data.qty !== undefined ? data.qty : null,
      id
    });
    
    return await this.getPersonalObjectById(id);
  }

  // Eliminar objeto personal
  async deletePersonalObject(id: ID): Promise<boolean> {
    const rowsAffected = await execute('DELETE FROM personal_objects WHERE id = @id', { id });
    return rowsAffected > 0;
  }
}

export const personalObjectService = new PersonalObjectService();
