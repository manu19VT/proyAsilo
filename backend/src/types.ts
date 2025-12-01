export type ID = string;

export interface Contact {
  id: ID;
  patientId: ID;
  name: string;
  phone: string;
  relation: string;
  rfc?: string;
  age?: number;
  address?: string;
}

export interface Patient {
  id: ID;
  name: string;
  birthDate?: string;
  age?: number;
  birthPlace?: string;
  address?: string;
  curp?: string;
  rfc?: string;
  admissionDate?: string;
  notes?: string;
  contacts: Contact[];
  status: "activo" | "baja";
  dischargeDate?: string;
  dischargeReason?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  createdByName?: string;
  updatedByName?: string;
  doctorId?: string;
  nurseId?: string;
  doctorName?: string;
  nurseName?: string;
}

export interface Medication {
  id: ID;
  name: string;
  qty: number;
  expiresAt: string;
  unit?: string;
  dosage?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PatientMedication {
  id: ID;
  patientId: ID;
  medicationId: ID;
  dosage: string;
  frequency: string;
  prescribedAt: string;
  prescribedBy?: string;
  cantidad?: number; // cantidad entregada al paciente
  medicationName?: string;
  medicationUnit?: string;
  medicationDosage?: string;
}

export interface EntryRequest {
  id: ID;
  folio: string;
  type: "entrada" | "salida" | "caducidad";
  patientId?: ID; // Opcional: solo requerido para salidas
  createdAt: string;
  items: { 
    medicationId: ID; 
    qty: number;
    dosisRecomendada?: string; // dosis recomendada (solo para salidas)
    frecuencia?: string; // cada cuándo tomar (solo para salidas)
    fechaCaducidad?: string; // fecha de caducidad del medicamento (para salidas y caducidad)
  }[];
  status: "completa" | "incompleta";
  dueDate?: string;
  comment?: string; // comentario opcional
}

export interface PersonalObject {
  id: ID;
  patientId: ID;
  name: string;
  qty: number;
  receivedAt: string;
  patientName?: string;
}

export interface User {
  id: ID;
  name: string;
  role: "admin" | "nurse" | "doctor" | "usuario" | "reception";
  email?: string;
  createdAt?: string;
  age?: number;
  birthDate?: string;
  password?: string;
  passwordChangeRequired?: boolean;
}


