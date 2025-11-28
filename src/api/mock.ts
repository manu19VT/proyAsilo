import { ID, Patient, Contact, Medication, EntryRequest, PersonalObject, User, PatientMedication } from "../types";

const id = () => crypto.randomUUID();

// =================== FOLIOS ===================
// Formato: <Prefijo>-<Año>-<Consecutivo de 4 dígitos>
// Prefijos: E = entrada, S = salida, C = caducidad
let currentYear = new Date().getFullYear();
const folioCounters: Record<"entrada" | "salida" | "caducidad", number> = {
  entrada: 1,
  salida: 1,
  caducidad: 1,
};

const ensureYear = () => {
  const y = new Date().getFullYear();
  if (y !== currentYear) {
    currentYear = y;
    folioCounters.entrada = 1;
    folioCounters.salida = 1;
    folioCounters.caducidad = 1;
  }
};

const generateFolio = (type: "entrada" | "salida" | "caducidad") => {
  ensureYear();
  const year = currentYear;
  const prefix = type === "entrada" ? "E" : type === "salida" ? "S" : "C";
  const num = String(folioCounters[type]++).padStart(4, "0");
  return `${prefix}-${year}-${num}`;
};

// =================== HELPERS ===================
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

  getPatientById: async (id: ID) => {
    return db.patients.find(p => p.id === id);
  },

  addPatient: async (p: Omit<Patient, "id" | "status">) => {
    const age = p.birthDate ? calculateAge(p.birthDate) : undefined;
    const np: Patient = { 
      id: id(), 
      status: "activo",
      contacts: p.contacts ?? [], 
      name: p.name, 
      birthDate: p.birthDate,
      age,
      birthPlace: p.birthPlace,
      address: p.address,
      curp: p.curp,
      rfc: p.rfc,
      admissionDate: p.admissionDate || new Date().toISOString(),
      notes: p.notes 
    };
    db.patients.push(np); 
    return np;
  },

  updatePatient: async (id: ID, updates: Partial<Patient>) => {
    const idx = db.patients.findIndex(p => p.id === id);
    if (idx === -1) throw new Error("Paciente no encontrado");
    
    if (updates.birthDate) {
      updates.age = calculateAge(updates.birthDate);
    }
    
    db.patients[idx] = { ...db.patients[idx], ...updates };
    return db.patients[idx];
  },

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
  // Búsqueda incluye barcode
  listMeds: async (query?: string) => {
    if (!query) return db.meds;
    const s = query.toLowerCase();
    return db.meds.filter(m => 
      m.name.toLowerCase().includes(s) ||
      m.unit?.toLowerCase().includes(s) ||
      m.dosage?.toLowerCase().includes(s) ||
      m.barcode?.toLowerCase().includes(s)
    );
  },

  // Alta con barcode opcional
  addMed: async (m: Omit<Medication, "id">) => {
    const nm: Medication = { ...m, id: id() };
    db.meds.push(nm);
    return nm;
  },

  updateMedQty: async (idMed: ID, qty: number) => {
    const idx = db.meds.findIndex(m => m.id === idMed);
    if (idx === -1) throw new Error("Medicamento no encontrado");
    db.meds[idx].qty = qty;
    return db.meds[idx];
  },

  // 🔎 Buscar por código de barras (útil para lector)
  findMedByBarcode: async (barcode: string) => {
    return db.meds.find(m => m.barcode?.toLowerCase() === barcode.toLowerCase()) || null;
  },

  getPatientMedications: async (patientId: ID) => {
    return db.patientMeds
      .filter(pm => pm.patientId === patientId)
      .map(pm => {
        const med = db.meds.find(m => m.id === pm.medicationId);
        return {
          ...pm,
          medicationName: med?.name,
          medicationUnit: med?.unit,
          medicationDosage: med?.dosage
        };
      });
  },

  addPatientMedication: async (data: Omit<PatientMedication, "id">) => {
    const npm: PatientMedication = {
      ...data,
      id: id()
    };
    db.patientMeds.push(npm);
    const med = db.meds.find(m => m.id === data.medicationId);
    return {
      ...npm,
      medicationName: med?.name,
      medicationUnit: med?.unit,
      medicationDosage: med?.dosage
    };
  },

  // ============= ENTRADAS / SALIDAS / CADUCIDAD =============
  listEntries: async (filters?: { patientId?: ID; type?: "entrada" | "salida" | "caducidad" }) => {
    let result = db.entries;
    
    if (filters?.patientId) {
      result = result.filter(e => e.patientId === filters.patientId);
    }
    
    if (filters?.type) {
      result = result.filter(e => e.type === filters.type);
    }
    
    return result;
  },

  getEntryByFolio: async (folio: string) => {
    return db.entries.find(e => e.folio === folio);
  },

  // Guarda comment si viene y actualiza inventario según el tipo
  addEntry: async (e: Omit<EntryRequest, "id" | "createdAt" | "folio">) => {
    const ne: EntryRequest = { 
      ...e,                         // incluye comment si se envía
      id: id(), 
      folio: generateFolio(e.type), // ahora acepta "caducidad"
      createdAt: new Date().toISOString() 
    };

    // Actualiza inventario (mock)
    try {
      for (const item of ne.items) {
        const med = db.meds.find(m => m.id === item.medicationId);
        if (!med) continue;
        const q = Number(item.qty) || 0;
        if (ne.type === "entrada") {
          med.qty += q;
        } else {
          med.qty = Math.max(0, med.qty - q);
        }
      }
    } catch {
      // noop en mock
    }

    db.entries.push(ne); 
    return ne;
  },

  // ============= OBJETOS PERSONALES =============
  listObjects: async (patientId?: ID) => 
    patientId
      ? db.objects.filter(o => o.patientId === patientId).map(o => ({
          ...o,
          patientName: db.patients.find(p => p.id === o.patientId)?.name
        }))
      : db.objects.map(o => ({
          ...o,
          patientName: db.patients.find(p => p.id === o.patientId)?.name
        })),
  
  addObject: async (o: Omit<PersonalObject, "id" | "receivedAt">) => {
    const no: PersonalObject = {
      ...o,
      id: id(),
      receivedAt: new Date().toISOString(),
      patientName: db.patients.find(p => p.id === o.patientId)?.name
    };
    db.objects.push(no);
    return no;
  },

  // ============= USUARIOS =============
  listUsers: async (role?: string) => {
    if (!role) return db.users;
    return db.users.filter(u => u.role === role);
  },

  addUser: async (u: Omit<User, "id" | "password" | "passwordChangeRequired" | "createdAt">) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    const password = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    
    const nu: User = { 
      ...u, 
      id: id(),
      password, // En producción, se hashea
      passwordChangeRequired: true,
      createdAt: new Date().toISOString()
    };
    
    db.users.push(nu);
    console.log(`Usuario creado: ${u.email}`);
    console.log(`Contraseña temporal: ${password}`);
    console.log("TODO: Enviar correo con contraseña");
    return nu;
  },

  changePassword: async (userId: ID, newPassword: string) => {
    const idx = db.users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error("Usuario no encontrado");
    
    db.users[idx].password = newPassword; // En producción, hashear
    db.users[idx].passwordChangeRequired = false;
    return db.users[idx];
  },
};
