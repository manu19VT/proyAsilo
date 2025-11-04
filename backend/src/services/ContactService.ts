import { v4 as uuidv4 } from 'uuid';
import { Contact, ID } from '../types';
import db from '../database/database';

export class ContactService {
  // Obtener contacto por ID
  getContactById(id: ID): Contact | null {
    return db.prepare(`
      SELECT 
        id,
        patient_id as patientId,
        name,
        phone,
        relation
      FROM contacts 
      WHERE id = ?
    `).get(id) as Contact | undefined || null;
  }

  // Crear contacto
  createContact(data: Omit<Contact, 'id'>): Contact {
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO contacts (id, patient_id, name, phone, relation, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.patientId, data.name, data.phone, data.relation, new Date().toISOString());
    
    return { id, ...data };
  }

  // Actualizar contacto
  updateContact(id: ID, data: Partial<Omit<Contact, 'id'>>): Contact | null {
    const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
    if (!existing) return null;
    
    db.prepare(`
      UPDATE contacts 
      SET patient_id = COALESCE(?, patient_id),
          name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          relation = COALESCE(?, relation)
      WHERE id = ?
    `).run(data.patientId || null, data.name || null, data.phone || null, data.relation || null, id);
    
    return this.getContactById(id);
  }

  // Eliminar contacto
  deleteContact(id: ID): boolean {
    const result = db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
    return result.changes > 0;
  }
}

export const contactService = new ContactService();






