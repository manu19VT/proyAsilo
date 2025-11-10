export type ID = string;

export interface Contact {
  id: ID;
  patientId: ID;
  name: string;
  phone: string;
  relation: string; // hijo, hija, etc.
  rfc?: string; // RFC del contacto
  age?: number;
  address?: string;
}

export interface Patient {
  id: ID;
  name: string;
  birthDate?: string; // ISO
  age?: number; // calculada automáticamente
  birthPlace?: string;
  address?: string;
  curp?: string; // CURP del paciente
  rfc?: string; // RFC del paciente
  admissionDate?: string; // fecha de ingreso ISO
  notes?: string;
  contacts: Contact[];
  status: "activo" | "baja";
  dischargeDate?: string;
  dischargeReason?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string; // ID del usuario que creó el paciente
  updatedBy?: string; // ID del usuario que actualizó el paciente
  createdByName?: string; // Nombre del usuario que creó
  updatedByName?: string; // Nombre del usuario que actualizó
}

export interface Medication {
  id: ID;
  name: string;
  qty: number;
  expiresAt: string; // ISO
  unit?: string;
  dosage?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string; // ID del usuario que creó el medicamento
  updatedBy?: string; // ID del usuario que actualizó el medicamento
  createdByName?: string; // Nombre del usuario que creó
  updatedByName?: string; // Nombre del usuario que actualizó
}

export interface PatientMedication {
  id: ID;
  patientId: ID;
  medicationId: ID;
  dosage: string; // dosis específica para este paciente
  frequency: string; // cada 8 horas, 3 veces al día, etc.
  prescribedAt: string; // fecha de prescripción
  prescribedBy?: string; // doctor que prescribió
}

export interface EntryRequest {
  id: ID;
  folio: string; // folio único para control
  type: "entrada" | "salida"; // tipo de movimiento
  patientId: ID;
  createdAt: string;
  items: { medicationId: ID; qty: number }[];
  status: "completa" | "incompleta";
  dueDate?: string; // fecha para volver
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
  age?: number;
  birthDate?: string;
  password?: string; // temporal, se enviará por correo
  passwordChangeRequired?: boolean; // si debe cambiar contraseña
  lastLogin?: string;
}
