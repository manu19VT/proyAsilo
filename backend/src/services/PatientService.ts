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
        p.nombre as name,
        p.fecha_nacimiento as birthDate,
        p.lugar_nacimiento as birthPlace,
        p.edad as age,
        p.direccion as address,
        p.curp,
        p.rfc,
        p.fecha_ingreso as admissionDate,
        p.notas as notes,
        p.estado as status,
        p.fecha_baja as dischargeDate,
        p.motivo_baja as dischargeReason,
        p.fecha_creacion as createdAt,
        p.fecha_actualizacion as updatedAt,
        p.creado_por as createdBy,
        p.actualizado_por as updatedBy,
        u1.nombre as createdByName,
        u2.nombre as updatedByName
      FROM patients p
      LEFT JOIN users u1 ON p.creado_por = u1.id
      LEFT JOIN users u2 ON p.actualizado_por = u2.id
    `;

    const conditions: string[] = [];
    const params: Record<string, any> = {};

    if (filters?.status) {
      conditions.push('p.estado = @status');
      params.status = filters.status;
    }

    if (filters?.query) {
      conditions.push(`
        (
          LOWER(p.nombre) LIKE @query
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
          WHERE c.paciente_id = p.id 
            AND (
              LOWER(c.nombre) LIKE @contactQuery
              OR c.telefono LIKE @contactPhone
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

    sql += ' ORDER BY p.nombre ASC';

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
        p.nombre as name,
        p.fecha_nacimiento as birthDate,
        p.lugar_nacimiento as birthPlace,
        p.edad as age,
        p.direccion as address,
        p.curp,
        p.rfc,
        p.fecha_ingreso as admissionDate,
        p.notas as notes,
        p.estado as status,
        p.fecha_baja as dischargeDate,
        p.motivo_baja as dischargeReason,
        p.fecha_creacion as createdAt,
        p.fecha_actualizacion as updatedAt,
        p.creado_por as createdBy,
        p.actualizado_por as updatedBy,
        u1.nombre as createdByName,
        u2.nombre as updatedByName
      FROM patients p
      LEFT JOIN users u1 ON p.creado_por = u1.id
      LEFT JOIN users u2 ON p.actualizado_por = u2.id
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
        id, nombre, fecha_nacimiento, lugar_nacimiento, edad, direccion, curp, rfc, fecha_ingreso, notas, estado, fecha_baja, motivo_baja,
        fecha_creacion, fecha_actualizacion, creado_por, actualizado_por
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
      SET nombre = COALESCE(@name, nombre),
          fecha_nacimiento = COALESCE(@birthDate, fecha_nacimiento),
          lugar_nacimiento = COALESCE(@birthPlace, lugar_nacimiento),
          edad = COALESCE(@age, edad),
          direccion = COALESCE(@address, direccion),
          curp = COALESCE(@curp, curp),
          rfc = COALESCE(@rfc, rfc),
          fecha_ingreso = COALESCE(@admissionDate, fecha_ingreso),
          notas = COALESCE(@notes, notas),
          estado = COALESCE(@status, estado),
          fecha_baja = COALESCE(@dischargeDate, fecha_baja),
          motivo_baja = COALESCE(@dischargeReason, motivo_baja),
          fecha_actualizacion = @updatedAt,
          actualizado_por = COALESCE(@updatedBy, actualizado_por)
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
      await execute('DELETE FROM contacts WHERE paciente_id = @id', { id });
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
      SET estado = 'baja',
          motivo_baja = @reason,
          fecha_baja = @dischargeDate,
          fecha_actualizacion = @updatedAt,
          actualizado_por = COALESCE(@userId, actualizado_por)
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
      SET estado = 'activo',
          motivo_baja = NULL,
          fecha_baja = NULL,
          fecha_actualizacion = @updatedAt,
          actualizado_por = COALESCE(@userId, actualizado_por)
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
        paciente_id as patientId,
        nombre as name,
        telefono as phone,
        relacion as relation,
        rfc,
        edad as age,
        direccion as address
      FROM contacts 
      WHERE paciente_id = @patientId
      ORDER BY nombre ASC
    `, { patientId });
    return contacts;
  }

  // Crear contacto
  async createContact(data: Omit<Contact, 'id'>): Promise<Contact> {
    const id = uuidv4();
    
    await execute(`
      INSERT INTO contacts (id, paciente_id, nombre, telefono, relacion, rfc, edad, direccion, fecha_creacion)
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
      SET nombre = COALESCE(@name, nombre),
          telefono = COALESCE(@phone, telefono),
          relacion = COALESCE(@relation, relacion),
          rfc = COALESCE(@rfc, rfc),
          edad = COALESCE(@age, edad),
          direccion = COALESCE(@address, direccion)
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
    
    const contacts = await this.getContactsByPatientId(existing.paciente_id);
    return contacts.find(c => c.id === id) || null;
  }

  // Eliminar contacto
  async deleteContact(id: ID): Promise<boolean> {
    const rowsAffected = await execute('DELETE FROM contacts WHERE id = @id', { id });
    return rowsAffected > 0;
  }
}

export const patientService = new PatientService();
