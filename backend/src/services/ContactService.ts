import { v4 as uuidv4 } from 'uuid';
import { Contact, ID } from '../types';
import db from '../database/database';

export class ContactService {
  // Obtener contacto por ID
  getContactById(id: ID): Contact | null {
    return db.prepare(`
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
      WHERE id = ?
    `).get(id) as Contact | undefined || null;
  }

  // Crear contacto
  createContact(data: Omit<Contact, 'id'>): Contact {
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO contacts (id, paciente_id, nombre, telefono, relacion, rfc, edad, direccion, fecha_creacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.patientId,
      data.name,
      data.phone,
      data.relation,
      data.rfc ?? null,
      data.age ?? null,
      data.address ?? null,
      new Date().toISOString()
    );
    
    return { id, ...data };
  }

  // Actualizar contacto
  updateContact(id: ID, data: Partial<Omit<Contact, 'id'>>): Contact | null {
    const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
    if (!existing) return null;
    
    db.prepare(`
      UPDATE contacts 
      SET paciente_id = COALESCE(?, paciente_id),
          nombre = COALESCE(?, nombre),
          telefono = COALESCE(?, telefono),
          relacion = COALESCE(?, relacion),
          rfc = COALESCE(?, rfc),
          edad = COALESCE(?, edad),
          direccion = COALESCE(?, direccion)
      WHERE id = ?
    `).run(
      data.patientId || null,
      data.name || null,
      data.phone || null,
      data.relation || null,
      data.rfc || null,
      data.age ?? null,
      data.address || null,
      id
    );
    
    return this.getContactById(id);
  }

  // Eliminar contacto
  deleteContact(id: ID): boolean {
    const result = db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
    return result.changes > 0;
  }
}

export const contactService = new ContactService();









