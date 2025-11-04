export type ID = string;

export interface Contact {
  id: ID;
  patientId: ID;
  name: string;
  phone: string;
  relation: string;
}

export interface Patient {
  id: ID;
  name: string;
  birthDate?: string;
  notes?: string;
  contacts: Contact[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Medication {
  id: ID;
  name: string;
  qty: number;
  expiresAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EntryRequest {
  id: ID;
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
  role: "admin" | "nurse" | "doctor" | "reception";
  email?: string;
  createdAt?: string;
}


