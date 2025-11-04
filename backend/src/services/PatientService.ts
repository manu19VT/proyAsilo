import { v4 as uuidv4 } from 'uuid';
import { Patient, Contact, ID } from '../types';
import { query, queryOne, execute } from '../database/database';

export class PatientService {
  // Listar todos los pacientes con filtro opcional
  async listPatients(queryFilter?: string): Promise<Patient[]> {
    let sql = `
      SELECT 
        p.id,
        p.name,
        p.birth_date as birthDate,
        p.notes,
        p.created_at as createdAt,
        p.updated_at as updatedAt,
        p.created_by as createdBy,
        p.updated_by as updatedBy,
        u1.name as createdByName,
        u2.name as updatedByName
      FROM patients p
      LEFT JOIN users u1 ON p.created_by = u1.id
      LEFT JOIN users u2 ON p.updated_by = u2.id
    `;
    
    const params: Record<string, any> = {};
    
    if (queryFilter) {
      sql += ' WHERE p.name LIKE @queryFilter';
      params.queryFilter = `%${queryFilter}%`;
    }
    
    sql += ' ORDER BY p.name ASC';
    
    const patients = await query<Patient>(sql, params);
    
    // Cargar contactos para cada paciente
    const patientsWithContacts = await Promise.all(patients.map(async (patient) => ({
      ...patient,
      contacts: await this.getContactsByPatientId(patient.id)
    })));
    
    return patientsWithContacts;
  }

  // Obtener paciente por ID
  async getPatientById(id: ID): Promise<Patient | null> {
    const patient = await queryOne<Patient>(`
      SELECT 
        p.id,
        p.name,
        p.birth_date as birthDate,
        p.notes,
        p.created_at as createdAt,
        p.updated_at as updatedAt,
        p.created_by as createdBy,
        p.updated_by as updatedBy,
        u1.name as createdByName,
        u2.name as updatedByName
      FROM patients p
      LEFT JOIN users u1 ON p.created_by = u1.id
      LEFT JOIN users u2 ON p.updated_by = u2.id
      WHERE p.id = @id
    `, { id });
    
    if (!patient) return null;
    
    patient.contacts = await this.getContactsByPatientId(id);
    return patient;
  }

  // Crear nuevo paciente
  async createPatient(data: Omit<Patient, 'id' | 'contacts' | 'createdAt' | 'updatedAt'> & { contacts?: Contact[]; createdBy?: string }): Promise<Patient> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await execute(`
      INSERT INTO patients (id, name, birth_date, notes, created_at, updated_at, created_by, updated_by)
      VALUES (@id, @name, @birthDate, @notes, @createdAt, @updatedAt, @createdBy, @updatedBy)
    `, {
      id,
      name: data.name,
      birthDate: data.birthDate || null,
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
      createdBy: data.createdBy || null,
      updatedBy: data.createdBy || null
    });
    
    // Agregar contactos si se proporcionan
    if (data.contacts && data.contacts.length > 0) {
      for (const contact of data.contacts) {
        await this.createContact({
          patientId: id,
          name: contact.name,
          phone: contact.phone,
          relation: contact.relation
        });
      }
    }
    
    const patient = await this.getPatientById(id);
    return patient!;
  }

  // Actualizar paciente
  async updatePatient(id: ID, data: Partial<Omit<Patient, 'id' | 'createdAt'>> & { updatedBy?: string }): Promise<Patient | null> {
    const now = new Date().toISOString();
    
    await execute(`
      UPDATE patients 
      SET name = COALESCE(@name, name),
          birth_date = COALESCE(@birthDate, birth_date),
          notes = COALESCE(@notes, notes),
          updated_at = @updatedAt,
          updated_by = COALESCE(@updatedBy, updated_by)
      WHERE id = @id
    `, {
      name: data.name || null,
      birthDate: data.birthDate || null,
      notes: data.notes || null,
      updatedAt: now,
      updatedBy: data.updatedBy || null,
      id
    });
    
    return await this.getPatientById(id);
  }

  // Eliminar paciente
  async deletePatient(id: ID, deletedBy?: string): Promise<boolean> {
    // Por ahora solo eliminamos, después podemos agregar un campo deleted_by o una tabla de auditoría
    const rowsAffected = await execute('DELETE FROM patients WHERE id = @id', { id });
    return rowsAffected > 0;
  }

  // Obtener contactos de un paciente
  async getContactsByPatientId(patientId: ID): Promise<Contact[]> {
    const contacts = await query<Contact>(`
      SELECT 
        id,
        patient_id as patientId,
        name,
        phone,
        relation
      FROM contacts 
      WHERE patient_id = @patientId
      ORDER BY name ASC
    `, { patientId });
    return contacts;
  }

  // Crear contacto
  async createContact(data: Omit<Contact, 'id'>): Promise<Contact> {
    const id = uuidv4();
    
    await execute(`
      INSERT INTO contacts (id, patient_id, name, phone, relation, created_at)
      VALUES (@id, @patientId, @name, @phone, @relation, @createdAt)
    `, {
      id,
      patientId: data.patientId,
      name: data.name,
      phone: data.phone,
      relation: data.relation,
      createdAt: new Date().toISOString()
    });
    
    return { id, ...data };
  }

  // Actualizar contacto
  async updateContact(id: ID, data: Partial<Omit<Contact, 'id'>>): Promise<Contact | null> {
    const existing = await queryOne<any>('SELECT * FROM contacts WHERE id = @id', { id });
    if (!existing) return null;
    
    await execute(`
      UPDATE contacts 
      SET name = COALESCE(@name, name),
          phone = COALESCE(@phone, phone),
          relation = COALESCE(@relation, relation)
      WHERE id = @id
    `, {
      name: data.name || null,
      phone: data.phone || null,
      relation: data.relation || null,
      id
    });
    
    const contacts = await this.getContactsByPatientId(existing.patient_id);
    return contacts.find(c => c.id === id) || null;
  }

  // Eliminar contacto
  async deleteContact(id: ID): Promise<boolean> {
    const rowsAffected = await execute('DELETE FROM contacts WHERE id = @id', { id });
    return rowsAffected > 0;
  }
}

export const patientService = new PatientService();
