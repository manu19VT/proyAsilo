import { ID, Patient, Contact, Medication, EntryRequest, PersonalObject, User, PatientMedication } from "../types";

const id = () => crypto.randomUUID();

// Generar folio único (formato: E-2024-0001)
let folioCounter = 1;
const generateFolio = (type: "entrada" | "salida") => {
  const year = new Date().getFullYear();
  const prefix = type === "entrada" ? "E" : "S";
  const num = String(folioCounter++).padStart(4, "0");
  return `${prefix}-${year}-${num}`;
};

// Calcular edad desde fecha de nacimiento
const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const db = {
  patients: [] as Patient[],
  meds: [] as Medication[],
  patientMeds: [] as PatientMedication[],
  entries: [] as EntryRequest[],
  objects: [] as PersonalObject[],
  users: [] as User[],
};

export const api = {
  // ============= PACIENTES =============
  
  // Listar todos los pacientes (con filtro opcional)
  listPatients: async (filters?: { 
    query?: string; 
    status?: "activo" | "baja";
    contactName?: string;
  }) => {
    let result = db.patients;
    
    if (filters?.status) {
      result = result.filter(p => p.status === filters.status);
    }
    
    if (filters?.query) {
      const s = filters.query.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(s) ||
        p.id.toLowerCase().includes(s) ||
        p.curp?.toLowerCase().includes(s) ||
        p.rfc?.toLowerCase().includes(s)
      );
    }
    
    if (filters?.contactName) {
      const s = filters.contactName.toLowerCase();
      result = result.filter(p => 
        p.contacts.some(c => 
          c.name.toLowerCase().includes(s) ||
          c.phone.includes(s) ||
          c.rfc?.toLowerCase().includes(s)
        )
      );
    }
    
    return result;
  },

  // Buscar paciente por ID/clave
  getPatientById: async (id: ID) => {
    return db.patients.find(p => p.id === id);
  },

  // Agregar paciente
  addPatient: async (p: Omit<Patient, "id" | "status">) => {
    const age = p.birthDate ? calculateAge(p.birthDate) : undefined;
    const np: Patient = { 
      id: id(), 
      status: "activo",
      contacts: p.contacts ?? [], 
      name: p.name, 
      birthDate: p.birthDate,
      age,
      curp: p.curp,
      rfc: p.rfc,
      admissionDate: p.admissionDate || new Date().toISOString(),
      notes: p.notes 
    };
    db.patients.push(np); 
    return np;
  },

  // Actualizar paciente
  updatePatient: async (id: ID, updates: Partial<Patient>) => {
    const idx = db.patients.findIndex(p => p.id === id);
    if (idx === -1) throw new Error("Paciente no encontrado");
    
    if (updates.birthDate) {
      updates.age = calculateAge(updates.birthDate);
    }
    
    db.patients[idx] = { ...db.patients[idx], ...updates };
    return db.patients[idx];
  },

  // Dar de baja a un paciente
  dischargePatient: async (id: ID, reason: string) => {
    const idx = db.patients.findIndex(p => p.id === id);
    if (idx === -1) throw new Error("Paciente no encontrado");
    
    db.patients[idx] = {
      ...db.patients[idx],
      status: "baja",
      dischargeDate: new Date().toISOString(),
      dischargeReason: reason
    };
    return db.patients[idx];
  },

  // Reactivar paciente
  reactivatePatient: async (id: ID) => {
    const idx = db.patients.findIndex(p => p.id === id);
    if (idx === -1) throw new Error("Paciente no encontrado");
    
    db.patients[idx] = {
      ...db.patients[idx],
      status: "activo",
      dischargeDate: undefined,
      dischargeReason: undefined
    };
    return db.patients[idx];
  },

  // ============= MEDICAMENTOS =============
  
  // Listar medicamentos con búsqueda
  listMeds: async (query?: string) => {
    if (!query) return db.meds;
    const s = query.toLowerCase();
    return db.meds.filter(m => 
      m.name.toLowerCase().includes(s) ||
      m.unit?.toLowerCase().includes(s) ||
      m.dosage?.toLowerCase().includes(s)
    );
  },

  // Agregar medicamento (SIN validación de 3 meses, eso era para caducidad cercana)
  addMed: async (m: Omit<Medication, "id">) => {
    const nm: Medication = { ...m, id: id() };
    db.meds.push(nm);
    return nm;
  },

  // Actualizar cantidad de medicamento
  updateMedQty: async (id: ID, qty: number) => {
    const idx = db.meds.findIndex(m => m.id === id);
    if (idx === -1) throw new Error("Medicamento no encontrado");
    db.meds[idx].qty = qty;
    return db.meds[idx];
  },

  // Obtener medicamentos de un paciente
  getPatientMedications: async (patientId: ID) => {
    return db.patientMeds.filter(pm => pm.patientId === patientId);
  },

  // Asignar medicamento a paciente (nombre corregido)
  addPatientMedication: async (data: Omit<PatientMedication, "id">) => {
    const npm: PatientMedication = {
      ...data,
      id: id()
    };
    db.patientMeds.push(npm);
    return npm;
  },

  // ============= ENTRADAS/SALIDAS =============
  
  // Listar entradas con filtros
  listEntries: async (filters?: { patientId?: ID; type?: "entrada" | "salida" }) => {
    let result = db.entries;
    
    if (filters?.patientId) {
      result = result.filter(e => e.patientId === filters.patientId);
    }
    
    if (filters?.type) {
      result = result.filter(e => e.type === filters.type);
    }
    
    return result;
  },

  // Buscar entrada por folio
  getEntryByFolio: async (folio: string) => {
    return db.entries.find(e => e.folio === folio);
  },

  // Agregar entrada/salida
  addEntry: async (e: Omit<EntryRequest, "id" | "createdAt" | "folio">) => {
    const ne: EntryRequest = { 
      ...e, 
      id: id(), 
      folio: generateFolio(e.type),
      createdAt: new Date().toISOString() 
    };
    db.entries.push(ne); 
    return ne;
  },

  // ============= OBJETOS PERSONALES =============
  
  listObjects: async (patientId?: ID) => 
    patientId ? db.objects.filter(o=>o.patientId===patientId) : db.objects,
  
  addObject: async (o: Omit<PersonalObject, "id" | "receivedAt">) => {
    const no: PersonalObject = { ...o, id: id(), receivedAt: new Date().toISOString() };
    db.objects.push(no);
    return no;
  },

  // ============= USUARIOS =============
  
  // Listar usuarios
  listUsers: async (role?: string) => {
    if (!role) return db.users;
    return db.users.filter(u => u.role === role);
  },

  // Agregar usuario con contraseña aleatoria
  addUser: async (u: Omit<User, "id" | "password" | "passwordChangeRequired" | "createdAt">) => {
    // Generar contraseña aleatoria de 8 caracteres
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    const password = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    
    const nu: User = { 
      ...u, 
      id: id(),
      password, // En producción, esto se hasheará
      passwordChangeRequired: true,
      createdAt: new Date().toISOString()
    };
    
    db.users.push(nu);
    
    // Aquí tu compañero conectará el envío de correo
    console.log(`Usuario creado: ${u.email}`);
    console.log(`Contraseña temporal: ${password}`);
    console.log("TODO: Enviar correo con contraseña");
    
    return nu;
  },

  // Cambiar contraseña
  changePassword: async (userId: ID, newPassword: string) => {
    const idx = db.users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error("Usuario no encontrado");
    
    db.users[idx].password = newPassword; // En producción, hashear
    db.users[idx].passwordChangeRequired = false;
    return db.users[idx];
  },
};