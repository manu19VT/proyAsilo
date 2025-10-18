import { ID, Patient, Contact, Medication, EntryRequest, PersonalObject, User } from "../types";

const id = () => crypto.randomUUID();

const db = {
  patients: [] as Patient[],
  meds: [] as Medication[],
  entries: [] as EntryRequest[],
  objects: [] as PersonalObject[],
  users: [] as User[],
};

export const api = {
  // Pacientes
  listPatients: async (q?: string) => {
    if (!q) return db.patients;
    const s = q.toLowerCase();
    return db.patients.filter(p => p.name.toLowerCase().includes(s));
  },
  addPatient: async (p: Omit<Patient, "id" | "contacts"> & { contacts?: Contact[] }) => {
    const np: Patient = { id: id(), contacts: p.contacts ?? [], name: p.name, birthDate: p.birthDate, notes: p.notes };
    db.patients.push(np); 
    return np;
  },

  // Medicamentos
  listMeds: async () => db.meds,
  addMed: async (m: Omit<Medication, "id">) => {
    // regla: no permitir > 3 meses a caducar
    const months = (new Date(m.expiresAt).getTime() - Date.now()) / (1000*60*60*24*30);
    if (months > 3) throw new Error("La caducidad supera los 3 meses.");
    const nm: Medication = { ...m, id: id() };
    db.meds.push(nm);
    return nm;
  },

  // Entradas (solicitudes/entregas)
  listEntries: async () => db.entries,
  addEntry: async (e: Omit<EntryRequest, "id" | "createdAt">) => {
    const ne: EntryRequest = { ...e, id: id(), createdAt: new Date().toISOString() };
    db.entries.push(ne); 
    return ne;
  },

  // Objetos personales
  listObjects: async (patientId?: ID) => patientId ? db.objects.filter(o=>o.patientId===patientId) : db.objects,
  addObject: async (o: Omit<PersonalObject, "id" | "receivedAt">) => {
    const no: PersonalObject = { ...o, id: id(), receivedAt: new Date().toISOString() };
    db.objects.push(no);
    return no;
  },

  // Usuarios
  listUsers: async () => db.users,
  addUser: async (u: Omit<User, "id">) => {
    const nu: User = { ...u, id: id() }; db.users.push(nu); return nu;
  },
};
