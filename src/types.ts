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
  doctorId?: string; // ID del doctor asignado
  nurseId?: string; // ID del enfermero asignado
  doctorName?: string; // Nombre del doctor asignado
  nurseName?: string; // Nombre del enfermero asignado
}

export interface Medication {
  id: ID;
  name: string;
  qty: number;
  expiresAt: string; // ISO
  unit?: string;
  dosage?: string;
  barcode?: string;
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
  cantidad?: number; // cantidad entregada al paciente
  medicationName?: string;
  medicationUnit?: string;
  medicationDosage?: string;
}

/** NUEVO: tipos para entradas/salidas/caducidad */
export type EntryType = "entrada" | "salida" | "caducidad";

export interface EntryItem {
  medicationId: ID;
  qty: number;
  /** Para salidas: dosis recomendada */
  dosisRecomendada?: string;
  /** Para salidas: frecuencia (cada 8h, etc.) */
  frecuencia?: string;
  /** Para salidas y caducidad: fecha de caducidad del medicamento */
  fechaCaducidad?: string; // ISO
}

export interface EntryRequest {
  id: ID;
  folio: string; // folio único para control (E-YYYY-####, S-YYYY-####, C-YYYY-####)
  type: EntryType; // "entrada" | "salida" | "caducidad"
  patientId: ID;
  createdAt: string;
  items: EntryItem[];
  status: "completa" | "incompleta";
  /** Para salidas: próxima fecha estimada para volver */
  dueDate?: string; // ISO
  /** NUEVO: comentario libre (observaciones, motivo de baja, lote, etc.) */
  comment?: string;
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
  password?: string; // temporal, se enviará por correo
  passwordChangeRequired?: boolean; // si debe cambiar contraseña
  lastLogin?: string;
}
