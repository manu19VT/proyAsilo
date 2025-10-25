export type ID = string;

export interface Contact {
  id: ID;
  patientId: ID;
  name: string;
  phone: string;
  relation: string; // hijo, hija, etc.
  rfc?: string; // RFC del contacto
}

export interface Patient {
  id: ID;
  name: string;
  birthDate?: string; // ISO
  age?: number; // calculada automáticamente
  curp?: string; // CURP del paciente
  rfc?: string; // RFC del paciente
  admissionDate?: string; // fecha de ingreso ISO
  notes?: string;
  contacts: Contact[];
  status: "activo" | "baja"; // para dar de baja pacientes
  dischargeDate?: string; // fecha de baja si aplica
  dischargeReason?: string; // motivo de baja
}

export interface Medication {
  id: ID;
  name: string;
  qty: number;
  expiresAt: string; // ISO
  unit?: string; // mg, ml, tabletas, etc.
  dosage?: string; // dosis recomendada
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
  patientId: ID;
  createdAt: string;
  items: { medicationId: ID; qty: number }[];
  status: "completa" | "incompleta";
  dueDate?: string; // fecha para volver
  type: "entrada" | "salida"; // tipo de movimiento
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
  role: "admin" | "nurse" | "doctor" | "reception";
  email: string;
  password?: string; // temporal, se enviará por correo
  passwordChangeRequired?: boolean; // si debe cambiar contraseña
  createdAt?: string;
  lastLogin?: string;
}