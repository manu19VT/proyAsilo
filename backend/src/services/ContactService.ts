import { v4 as uuidv4 } from 'uuid';
import { Contact, ID } from '../types';
import { query, queryOne, execute } from '../database/database';

export class ContactService {
  // Obtener contacto por ID
  async getContactById(id: ID): Promise<Contact | null> {
    const row = await queryOne<any>(`
      SELECT 
        id,
        paciente_id as patientId,
        nombre as name,
        telefono as phone,
        relacion as relation,
        rfc,
        edad as age,
        direccion as address
      FROM contacts 
      WHERE id = @id
    `, { id });
    
    if (!row) return null;
    
    return {
      id: row.id,
      patientId: row.patientId,
      name: row.name,
      phone: row.phone,
      relation: row.relation,
      rfc: row.rfc || undefined,
      age: row.age || undefined,
      address: row.address || undefined
    };
  }

  // Crear contacto
  async createContact(data: Omit<Contact, 'id'>): Promise<Contact> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await execute(`
      INSERT INTO contacts (id, paciente_id, nombre, telefono, relacion, rfc, edad, direccion, fecha_creacion)
      VALUES (@id, @patientId, @name, @phone, @relation, @rfc, @age, @address, @fechaCreacion)
    `, {
      id,
      patientId: data.patientId,
      name: data.name,
      phone: data.phone,
      relation: data.relation,
      rfc: data.rfc || null,
      age: data.age || null,
      address: data.address || null,
      fechaCreacion: now
    });
    
    return { id, ...data };
  }

  // Actualizar contacto
  async updateContact(id: ID, data: Partial<Omit<Contact, 'id'>>): Promise<Contact | null> {
    const existing = await this.getContactById(id);
    if (!existing) return null;
    
    await execute(`
      UPDATE contacts 
      SET paciente_id = COALESCE(@patientId, paciente_id),
          nombre = COALESCE(@name, nombre),
          telefono = COALESCE(@phone, telefono),
          relacion = COALESCE(@relation, relacion),
          rfc = COALESCE(@rfc, rfc),
          edad = COALESCE(@age, edad),
          direccion = COALESCE(@address, direccion)
      WHERE id = @id
    `, {
      patientId: data.patientId || null,
      name: data.name || null,
      phone: data.phone || null,
      relation: data.relation || null,
      rfc: data.rfc || null,
      age: data.age ?? null,
      address: data.address || null,
      id
    });
    
    return await this.getContactById(id);
  }

  // Eliminar contacto
  async deleteContact(id: ID): Promise<boolean> {
    const rowsAffected = await execute('DELETE FROM contacts WHERE id = @id', { id });
    return rowsAffected > 0;
  }
}

export const contactService = new ContactService();









