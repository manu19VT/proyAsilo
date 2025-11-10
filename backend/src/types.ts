export type ID = string;

export interface Contact {
  id: ID;
  patientId: ID;
  name: string;
  phone: string;
  relation: string;
  rfc?: string;
}

export interface Patient {
  id: ID;
  name: string;
  birthDate?: string;
  age?: number;
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
}

export interface EntryRequest {
  id: ID;
  folio: string;
  type: "entrada" | "salida";
  patientId: ID;
  createdAt: string;
  items: { medicationId: ID; qty: number }[];
  status: "completa" | "incompleta";
  dueDate?: string;
}

export interface PersonalObject {
  id: ID;
  patientId: ID;
  name: string;
  qty: number;
  receivedAt: string;
}

export interface User {
  id: ID;
  name: string;
  role: "admin" | "nurse" | "doctor" | "usuario" | "reception";
  email?: string;
  createdAt?: string;
  password?: string;
  passwordChangeRequired?: boolean;
}


