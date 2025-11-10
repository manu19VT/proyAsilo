import { v4 as uuidv4 } from 'uuid';
import { Patient, Contact, ID } from '../types';
import { query, queryOne, execute } from '../database/database';

interface PatientFilters {
  query?: string;
  status?: "activo" | "baja";
  contactName?: string;
}

function calculateAge(birthDate?: string): number | undefined {
  if (!birthDate) return undefined;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export class PatientService {
  private mapDbPatient(row: any): Patient {
    const patient: Patient = {
      id: row.id,
      name: row.name,
      birthDate: row.birthDate || undefined,
      age: row.age ?? calculateAge(row.birthDate),
      birthPlace: row.birthPlace || undefined,
      address: row.address || undefined,
      curp: row.curp || undefined,
      rfc: row.rfc || undefined,
      admissionDate: row.admissionDate || undefined,
      notes: row.notes || undefined,
      status: (row.status as Patient["status"]) || "activo",
      dischargeDate: row.dischargeDate || undefined,
      dischargeReason: row.dischargeReason || undefined,
      contacts: [],
      createdAt: row.createdAt || undefined,
      updatedAt: row.updatedAt || undefined,
      createdBy: row.createdBy || undefined,
      updatedBy: row.updatedBy || undefined,
      createdByName: row.createdByName || undefined,
      updatedByName: row.updatedByName || undefined,
    };
    return patient;
  }

  // Listar todos los pacientes con filtros opcionales
  async listPatients(filters?: PatientFilters): Promise<Patient[]> {
    let sql = `
      SELECT 
        p.id,
        p.name,
        p.birth_date as birthDate,
        p.birth_place as birthPlace,
        p.age,
        p.address as address,
        p.curp,
        p.rfc,
        p.admission_date as admissionDate,
        p.notes,
        p.status,
        p.discharge_date as dischargeDate,
        p.discharge_reason as dischargeReason,
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

    const conditions: string[] = [];
    const params: Record<string, any> = {};

    if (filters?.status) {
      conditions.push('p.status = @status');
      params.status = filters.status;
    }

    if (filters?.query) {
      conditions.push(`
        (
          LOWER(p.name) LIKE @query
          OR LOWER(p.id) LIKE @query
          OR LOWER(p.curp) LIKE @query
          OR LOWER(p.rfc) LIKE @query
        )
      `);
      params.query = `%${filters.query.toLowerCase()}%`;
    }

    if (filters?.contactName) {
      conditions.push(`
        EXISTS (
          SELECT 1 
          FROM contacts c
          WHERE c.patient_id = p.id 
            AND (
              LOWER(c.name) LIKE @contactQuery
              OR c.phone LIKE @contactPhone
              OR LOWER(c.rfc) LIKE @contactQuery
            )
        )
      `);
      params.contactQuery = `%${filters.contactName.toLowerCase()}%`;
      params.contactPhone = `%${filters.contactName}%`;
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY p.name ASC';

    const rows = await query<any>(sql, params);
    const patients = await Promise.all(rows.map(async (row) => {
      const patient = this.mapDbPatient(row);
      patient.contacts = await this.getContactsByPatientId(patient.id);
      return patient;
    }));

    return patients;
  }

  // Obtener paciente por ID
  async getPatientById(id: ID): Promise<Patient | null> {
    const row = await queryOne<any>(`
      SELECT 
        p.id,
        p.name,
        p.birth_date as birthDate,
        p.birth_place as birthPlace,
        p.age,
        p.address as address,
        p.curp,
        p.rfc,
        p.admission_date as admissionDate,
        p.notes,
        p.status,
        p.discharge_date as dischargeDate,
        p.discharge_reason as dischargeReason,
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
    
    if (!row) return null;

    const patient = this.mapDbPatient(row);
    patient.contacts = await this.getContactsByPatientId(id);
    return patient;
  }

  // Crear nuevo paciente
  async createPatient(data: Omit<Patient, 'id' | 'contacts' | 'createdAt' | 'updatedAt' | 'createdByName' | 'updatedByName'> & { contacts?: Contact[]; createdBy?: string }): Promise<Patient> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const age = data.age ?? calculateAge(data.birthDate);

    await execute(`
      INSERT INTO patients (
        id, name, birth_date, birth_place, age, address, curp, rfc, admission_date, notes, status, discharge_date, discharge_reason,
        created_at, updated_at, created_by, updated_by
      )
      VALUES (
        @id, @name, @birthDate, @birthPlace, @age, @address, @curp, @rfc, @admissionDate, @notes, @status, NULL, NULL,
        @createdAt, @updatedAt, @createdBy, @updatedBy
      )
    `, {
      id,
      name: data.name,
      birthDate: data.birthDate || null,
      birthPlace: data.birthPlace || null,
      age: age ?? null,
      address: data.address || null,
      curp: data.curp || null,
      rfc: data.rfc || null,
      admissionDate: data.admissionDate || now,
      notes: data.notes || null,
      status: data.status || 'activo',
      createdAt: now,
      updatedAt: now,
      createdBy: data.createdBy || null,
      updatedBy: data.createdBy || null,
    });
    
    // Agregar contactos si se proporcionan
    if (data.contacts && data.contacts.length > 0) {
      for (const contact of data.contacts) {
        await this.createContact({
          patientId: id,
          name: contact.name,
          phone: contact.phone,
          relation: contact.relation,
          rfc: contact.rfc,
          age: contact.age,
          address: contact.address
        });
      }
    }
    
    const patient = await this.getPatientById(id);
    return patient!;
  }

  // Actualizar paciente
  async updatePatient(id: ID, data: Partial<Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'contacts' | 'createdByName' | 'updatedByName'>> & { updatedBy?: string; contacts?: Contact[] }): Promise<Patient | null> {
    const now = new Date().toISOString();
    const age = data.age ?? calculateAge(data.birthDate);

    await execute(`
      UPDATE patients 
      SET name = COALESCE(@name, name),
          birth_date = COALESCE(@birthDate, birth_date),
          birth_place = COALESCE(@birthPlace, birth_place),
          age = COALESCE(@age, age),
          address = COALESCE(@address, address),
          curp = COALESCE(@curp, curp),
          rfc = COALESCE(@rfc, rfc),
          admission_date = COALESCE(@admissionDate, admission_date),
          notes = COALESCE(@notes, notes),
          status = COALESCE(@status, status),
          discharge_date = COALESCE(@dischargeDate, discharge_date),
          discharge_reason = COALESCE(@dischargeReason, discharge_reason),
          updated_at = @updatedAt,
          updated_by = COALESCE(@updatedBy, updated_by)
      WHERE id = @id
    `, {
      name: data.name || null,
      birthDate: data.birthDate || null,
      birthPlace: data.birthPlace || null,
      age: age ?? null,
      address: data.address || null,
      curp: data.curp || null,
      rfc: data.rfc || null,
      admissionDate: data.admissionDate || null,
      notes: data.notes || null,
      status: data.status || null,
      dischargeDate: data.dischargeDate || null,
      dischargeReason: data.dischargeReason || null,
      updatedAt: now,
      updatedBy: data.updatedBy || null,
      id
    });
    
    if (data.contacts) {
      // Eliminar contactos actuales y recrear (simplificación)
      await execute('DELETE FROM contacts WHERE patient_id = @id', { id });
      for (const contact of data.contacts) {
        await this.createContact({
          patientId: id,
          name: contact.name,
          phone: contact.phone,
          relation: contact.relation,
          rfc: contact.rfc,
          age: contact.age,
          address: contact.address
        });
      }
    }

    return await this.getPatientById(id);
  }

  async dischargePatient(id: ID, reason: string, userId?: string): Promise<Patient | null> {
    const now = new Date().toISOString();
    await execute(`
      UPDATE patients
      SET status = 'baja',
          discharge_reason = @reason,
          discharge_date = @dischargeDate,
          updated_at = @updatedAt,
          updated_by = COALESCE(@userId, updated_by)
      WHERE id = @id
    `, {
      id,
      reason,
      dischargeDate: now,
      updatedAt: now,
      userId: userId || null
    });
    return this.getPatientById(id);
  }

  async reactivatePatient(id: ID, userId?: string): Promise<Patient | null> {
    const now = new Date().toISOString();
    await execute(`
      UPDATE patients
      SET status = 'activo',
          discharge_reason = NULL,
          discharge_date = NULL,
          updated_at = @updatedAt,
          updated_by = COALESCE(@userId, updated_by)
      WHERE id = @id
    `, {
      id,
      updatedAt: now,
      userId: userId || null
    });
    return this.getPatientById(id);
  }

  // Eliminar paciente
  async deletePatient(id: ID): Promise<boolean> {
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
        relation,
        rfc,
        age,
        address
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
      INSERT INTO contacts (id, patient_id, name, phone, relation, rfc, age, address, created_at)
      VALUES (@id, @patientId, @name, @phone, @relation, @rfc, @age, @address, @createdAt)
    `, {
      id,
      patientId: data.patientId,
      name: data.name,
      phone: data.phone,
      relation: data.relation,
      rfc: data.rfc || null,
      age: data.age ?? null,
      address: data.address || null,
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
          relation = COALESCE(@relation, relation),
          rfc = COALESCE(@rfc, rfc),
          age = COALESCE(@age, age),
          address = COALESCE(@address, address)
      WHERE id = @id
    `, {
      name: data.name || null,
      phone: data.phone || null,
      relation: data.relation || null,
      rfc: data.rfc || null,
      age: data.age ?? null,
      address: data.address || null,
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
