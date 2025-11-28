import { v4 as uuidv4 } from 'uuid';
import { User, Patient, Contact, Medication, EntryRequest, PersonalObject, PatientMedication } from '../types';

// Datos mock en memoria
const mockData = {
  users: [] as User[],
  patients: [] as Patient[],
  medications: [] as Medication[],
  patientMedications: [] as PatientMedication[],
  entryRequests: [] as EntryRequest[],
  personalObjects: [] as PersonalObject[],
};

// Inicializar datos mock
function initializeMockData() {
  // Usuario admin por defecto
  const adminUser: User = {
    id: uuidv4(),
    name: 'Administrador',
    role: 'admin',
    email: 'admin@asilo.com',
    createdAt: new Date().toISOString(),
    passwordChangeRequired: false,
  };
  mockData.users = [adminUser];

  // Algunos usuarios adicionales
  const doctor: User = {
    id: uuidv4(),
    name: 'Dr. Juan Pérez',
    role: 'doctor',
    email: 'doctor@asilo.com',
    createdAt: new Date().toISOString(),
    passwordChangeRequired: false,
  };
  const nurse: User = {
    id: uuidv4(),
    name: 'Enfermera María García',
    role: 'nurse',
    email: 'nurse@asilo.com',
    createdAt: new Date().toISOString(),
    passwordChangeRequired: false,
  };
  mockData.users.push(doctor, nurse);

  // Pacientes de ejemplo
  const patient1: Patient = {
    id: uuidv4(),
    name: 'José Hernández López',
    birthDate: '1945-03-15',
    age: 79,
    birthPlace: 'Ciudad de México',
    address: 'Calle Principal 123',
    curp: 'HELJ450315HDFRPS01',
    rfc: 'HELJ450315ABC',
    admissionDate: '2023-01-10',
    status: 'activo',
    contacts: [
      {
        id: uuidv4(),
        patientId: '',
        name: 'María Hernández',
        phone: '5551234567',
        relation: 'hija',
        rfc: 'HELM700101ABC',
      },
    ],
    doctorId: doctor.id,
    doctorName: doctor.name,
    nurseId: nurse.id,
    nurseName: nurse.name,
    createdAt: new Date().toISOString(),
  };
  patient1.contacts[0].patientId = patient1.id;

  const patient2: Patient = {
    id: uuidv4(),
    name: 'Carmen Rodríguez Sánchez',
    birthDate: '1940-07-22',
    age: 84,
    birthPlace: 'Guadalajara',
    address: 'Av. Reforma 456',
    curp: 'ROSC400722JDFRNS02',
    admissionDate: '2022-11-05',
    status: 'activo',
    contacts: [
      {
        id: uuidv4(),
        patientId: '',
        name: 'Carlos Rodríguez',
        phone: '5559876543',
        relation: 'hijo',
      },
    ],
    doctorId: doctor.id,
    doctorName: doctor.name,
    createdAt: new Date().toISOString(),
  };
  patient2.contacts[0].patientId = patient2.id;

  mockData.patients = [patient1, patient2];

  // Medicamentos de ejemplo
  const med1: Medication = {
    id: uuidv4(),
    name: 'Paracetamol',
    qty: 100,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    unit: 'tabletas',
    dosage: '500mg',
    createdAt: new Date().toISOString(),
  };

  const med2: Medication = {
    id: uuidv4(),
    name: 'Omeprazol',
    qty: 50,
    expiresAt: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString(),
    unit: 'cápsulas',
    dosage: '20mg',
    createdAt: new Date().toISOString(),
  };

  mockData.medications = [med1, med2];

  // Medicamentos asignados a pacientes
  const patientMed1: PatientMedication = {
    id: uuidv4(),
    patientId: patient1.id,
    medicationId: med1.id,
    dosage: '500mg',
    frequency: 'Cada 8 horas',
    prescribedAt: new Date().toISOString(),
    prescribedBy: doctor.id,
    cantidad: 30,
    medicationName: med1.name,
    medicationUnit: med1.unit,
    medicationDosage: med1.dosage,
  };
  mockData.patientMedications = [patientMed1];

  // Solicitudes de entrada/salida
  const entry1: EntryRequest = {
    id: uuidv4(),
    folio: 'E-2024-0001',
    type: 'entrada',
    patientId: patient1.id,
    createdAt: new Date().toISOString(),
    items: [
      {
        medicationId: med1.id,
        qty: 20,
      },
    ],
    status: 'completa',
  };
  mockData.entryRequests = [entry1];

  // Objetos personales
  const object1: PersonalObject = {
    id: uuidv4(),
    patientId: patient1.id,
    name: 'Reloj de pulsera',
    qty: 1,
    receivedAt: new Date().toISOString(),
    patientName: patient1.name,
  };
  mockData.personalObjects = [object1];
}

// Inicializar al cargar el módulo
initializeMockData();

export class MockService {
  // ========== Auth ==========
  verifyPassword(email: string, passwordHash: string): User | null {
    // Hash de 'admin@asilo.com::admin123'
    const adminHash = '50f3d9310f55a9e7f2b5b521bad3b9d3e51ca501d18b6d7db566f3429f3697f5';
    
    if (email.toLowerCase() === 'admin@asilo.com' && passwordHash === adminHash) {
      return mockData.users.find(u => u.email === 'admin@asilo.com') || null;
    }
    return null;
  }

  // ========== Users ==========
  listUsers(role?: string): User[] {
    let users = [...mockData.users];
    if (role) {
      users = users.filter(u => u.role === role);
    }
    return users.map(u => ({ ...u, password: undefined }));
  }

  getUserById(id: string): User | null {
    const user = mockData.users.find(u => u.id === id);
    return user ? { ...user, password: undefined } : null;
  }

  getUserByEmail(email: string): User | null {
    const user = mockData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    return user ? { ...user, password: undefined } : null;
  }

  // ========== Patients ==========
  listPatients(filters?: { query?: string; status?: string; contactName?: string }): Patient[] {
    let patients = [...mockData.patients];
    
    if (filters?.status) {
      patients = patients.filter(p => p.status === filters.status);
    }
    
    if (filters?.query) {
      const query = filters.query.toLowerCase();
      patients = patients.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        p.curp?.toLowerCase().includes(query) ||
        p.rfc?.toLowerCase().includes(query)
      );
    }
    
    if (filters?.contactName) {
      const contactName = filters.contactName.toLowerCase();
      patients = patients.filter(p =>
        p.contacts.some(c =>
          c.name.toLowerCase().includes(contactName) ||
          c.phone.includes(contactName)
        )
      );
    }
    
    return patients;
  }

  getPatientById(id: string): Patient | null {
    return mockData.patients.find(p => p.id === id) || null;
  }

  addPatient(patient: Omit<Patient, 'id' | 'createdAt'>): Patient {
    const newPatient: Patient = {
      ...patient,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      contacts: patient.contacts.map(c => ({
        ...c,
        id: c.id || uuidv4(),
        patientId: '',
      })),
    };
    newPatient.contacts.forEach(c => c.patientId = newPatient.id);
    mockData.patients.push(newPatient);
    return newPatient;
  }

  updatePatient(id: string, updates: Partial<Patient>): Patient | null {
    const index = mockData.patients.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    const updated = { ...mockData.patients[index], ...updates, updatedAt: new Date().toISOString() };
    mockData.patients[index] = updated;
    return updated;
  }

  deletePatient(id: string): boolean {
    const index = mockData.patients.findIndex(p => p.id === id);
    if (index === -1) return false;
    mockData.patients[index].status = 'baja';
    mockData.patients[index].dischargeDate = new Date().toISOString();
    return true;
  }

  restorePatient(id: string): Patient | null {
    const patient = mockData.patients.find(p => p.id === id);
    if (!patient) return null;
    patient.status = 'activo';
    patient.dischargeDate = undefined;
    patient.dischargeReason = undefined;
    return patient;
  }

  // ========== Medications ==========
  listMedications(query?: string): Medication[] {
    let meds = [...mockData.medications];
    if (query) {
      const q = query.toLowerCase();
      meds = meds.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.unit?.toLowerCase().includes(q) ||
        m.dosage?.toLowerCase().includes(q)
      );
    }
    return meds;
  }

  getMedicationById(id: string): Medication | null {
    return mockData.medications.find(m => m.id === id) || null;
  }

  addMedication(med: Omit<Medication, 'id' | 'createdAt'>): Medication {
    const newMed: Medication = {
      ...med,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    mockData.medications.push(newMed);
    return newMed;
  }

  updateMedication(id: string, updates: Partial<Medication>): Medication | null {
    const index = mockData.medications.findIndex(m => m.id === id);
    if (index === -1) return null;
    const updated = { ...mockData.medications[index], ...updates, updatedAt: new Date().toISOString() };
    mockData.medications[index] = updated;
    return updated;
  }

  deleteMedication(id: string): boolean {
    const index = mockData.medications.findIndex(m => m.id === id);
    if (index === -1) return false;
    mockData.medications.splice(index, 1);
    return true;
  }

  // ========== Patient Medications ==========
  getPatientMedications(patientId: string): PatientMedication[] {
    return mockData.patientMedications.filter(pm => pm.patientId === patientId);
  }

  addPatientMedication(pm: Omit<PatientMedication, 'id'>): PatientMedication {
    const med = mockData.medications.find(m => m.id === pm.medicationId);
    const newPm: PatientMedication = {
      ...pm,
      id: uuidv4(),
      medicationName: med?.name,
      medicationUnit: med?.unit,
      medicationDosage: med?.dosage,
    };
    mockData.patientMedications.push(newPm);
    return newPm;
  }

  // ========== Entry Requests ==========
  listEntryRequests(filters?: { type?: string; patientId?: string }): EntryRequest[] {
    let entries = [...mockData.entryRequests];
    if (filters?.type) {
      entries = entries.filter(e => e.type === filters.type);
    }
    if (filters?.patientId) {
      entries = entries.filter(e => e.patientId === filters.patientId);
    }
    return entries;
  }

  getEntryRequestById(id: string): EntryRequest | null {
    return mockData.entryRequests.find(e => e.id === id) || null;
  }

  getEntryRequestByFolio(folio: string): EntryRequest | null {
    return mockData.entryRequests.find(e => e.folio === folio) || null;
  }

  addEntryRequest(entry: Omit<EntryRequest, 'id' | 'folio' | 'createdAt'>): EntryRequest {
    const year = new Date().getFullYear();
    const num = String(mockData.entryRequests.length + 1).padStart(4, '0');
    const prefix = entry.type === 'entrada' ? 'E' : 'S';
    const folio = `${prefix}-${year}-${num}`;
    
    const newEntry: EntryRequest = {
      ...entry,
      id: uuidv4(),
      folio,
      createdAt: new Date().toISOString(),
    };
    mockData.entryRequests.push(newEntry);
    return newEntry;
  }

  updateEntryRequest(id: string, updates: Partial<EntryRequest>): EntryRequest | null {
    const index = mockData.entryRequests.findIndex(e => e.id === id);
    if (index === -1) return null;
    const updated = { ...mockData.entryRequests[index], ...updates };
    mockData.entryRequests[index] = updated;
    return updated;
  }

  deleteEntryRequest(id: string): boolean {
    const index = mockData.entryRequests.findIndex(e => e.id === id);
    if (index === -1) return false;
    mockData.entryRequests.splice(index, 1);
    return true;
  }

  // ========== Personal Objects ==========
  listPersonalObjects(patientId?: string): PersonalObject[] {
    let objects = [...mockData.personalObjects];
    if (patientId) {
      objects = objects.filter(o => o.patientId === patientId);
    }
    return objects;
  }

  getPersonalObjectById(id: string): PersonalObject | null {
    return mockData.personalObjects.find(o => o.id === id) || null;
  }

  addPersonalObject(obj: Omit<PersonalObject, 'id' | 'receivedAt'>): PersonalObject {
    const patient = mockData.patients.find(p => p.id === obj.patientId);
    const newObj: PersonalObject = {
      ...obj,
      id: uuidv4(),
      receivedAt: new Date().toISOString(),
      patientName: patient?.name,
    };
    mockData.personalObjects.push(newObj);
    return newObj;
  }

  updatePersonalObject(id: string, updates: Partial<PersonalObject>): PersonalObject | null {
    const index = mockData.personalObjects.findIndex(o => o.id === id);
    if (index === -1) return null;
    const updated = { ...mockData.personalObjects[index], ...updates };
    mockData.personalObjects[index] = updated;
    return updated;
  }

  deletePersonalObject(id: string): boolean {
    const index = mockData.personalObjects.findIndex(o => o.id === id);
    if (index === -1) return false;
    mockData.personalObjects.splice(index, 1);
    return true;
  }

  // ========== Contacts ==========
  addContact(patientId: string, contact: Omit<Contact, 'id' | 'patientId'>): Contact {
    const patient = mockData.patients.find(p => p.id === patientId);
    if (!patient) throw new Error('Paciente no encontrado');
    
    const newContact: Contact = {
      ...contact,
      id: uuidv4(),
      patientId,
    };
    patient.contacts.push(newContact);
    return newContact;
  }

  updateContact(contactId: string, updates: Partial<Contact>): Contact | null {
    for (const patient of mockData.patients) {
      const contact = patient.contacts.find(c => c.id === contactId);
      if (contact) {
        Object.assign(contact, updates);
        return contact;
      }
    }
    return null;
  }

  deleteContact(contactId: string): boolean {
    for (const patient of mockData.patients) {
      const index = patient.contacts.findIndex(c => c.id === contactId);
      if (index !== -1) {
        patient.contacts.splice(index, 1);
        return true;
      }
    }
    return false;
  }
}

export const mockService = new MockService();

