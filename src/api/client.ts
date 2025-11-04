import { ID, Patient, Contact, Medication, EntryRequest, PersonalObject, User } from "../types";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Helper para hacer peticiones HTTP
async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(error.error || `Error ${response.status}`);
  }

  return response.json();
}

export const api = {
  // ========== Auth ==========
  login: async (email: string, password: string) => {
    return request<{ user: User }>(`/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (payload: { name: string; role: User['role']; email: string }) => {
    return request<{ user: User; password: string }>(`/auth/register`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // ========== Pacientes ==========
  listPatients: async (q?: string) => {
    const query = q ? `?q=${encodeURIComponent(q)}` : '';
    return request<Patient[]>(`/patients${query}`);
  },

  getPatient: async (id: ID) => {
    return request<Patient>(`/patients/${id}`);
  },

  addPatient: async (p: Omit<Patient, "id" | "contacts"> & { contacts?: Contact[]; userId?: string }) => {
    return request<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(p),
    });
  },

  updatePatient: async (id: ID, p: Partial<Omit<Patient, "id" | "contacts"> & { contacts?: Contact[]; userId?: string }>) => {
    return request<Patient>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(p),
    });
  },

  deletePatient: async (id: ID) => {
    return request<void>(`/patients/${id}`, {
      method: 'DELETE',
    });
  },

  // ========== Contactos ==========
  addContact: async (patientId: ID, contact: Omit<Contact, "id" | "patientId">) => {
    return request<Contact>(`/patients/${patientId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(contact),
    });
  },

  updateContact: async (contactId: ID, contact: Partial<Omit<Contact, "id" | "patientId">>) => {
    return request<Contact>(`/patients/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(contact),
    });
  },

  deleteContact: async (contactId: ID) => {
    return request<void>(`/patients/contacts/${contactId}`, {
      method: 'DELETE',
    });
  },

  // ========== Medicamentos ==========
  listMeds: async () => {
    return request<Medication[]>('/medications');
  },

  getMed: async (id: ID) => {
    return request<Medication>(`/medications/${id}`);
  },

  addMed: async (m: Omit<Medication, "id"> & { userId?: string }) => {
    return request<Medication>('/medications', {
      method: 'POST',
      body: JSON.stringify(m),
    });
  },

  updateMed: async (id: ID, m: Partial<Omit<Medication, "id">> & { userId?: string }) => {
    return request<Medication>(`/medications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(m),
    });
  },

  deleteMed: async (id: ID) => {
    return request<void>(`/medications/${id}`, {
      method: 'DELETE',
    });
  },

  // ========== Solicitudes de Entrada ==========
  listEntries: async () => {
    return request<EntryRequest[]>('/entry-requests');
  },

  getEntry: async (id: ID) => {
    return request<EntryRequest>(`/entry-requests/${id}`);
  },

  addEntry: async (e: Omit<EntryRequest, "id" | "createdAt">) => {
    return request<EntryRequest>('/entry-requests', {
      method: 'POST',
      body: JSON.stringify(e),
    });
  },

  updateEntry: async (id: ID, e: Partial<Omit<EntryRequest, "id" | "createdAt">>) => {
    return request<EntryRequest>(`/entry-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(e),
    });
  },

  deleteEntry: async (id: ID) => {
    return request<void>(`/entry-requests/${id}`, {
      method: 'DELETE',
    });
  },

  // ========== Objetos Personales ==========
  listObjects: async (patientId?: ID) => {
    const query = patientId ? `?patientId=${patientId}` : '';
    return request<PersonalObject[]>(`/personal-objects${query}`);
  },

  getObject: async (id: ID) => {
    return request<PersonalObject>(`/personal-objects/${id}`);
  },

  addObject: async (o: Omit<PersonalObject, "id" | "receivedAt">) => {
    return request<PersonalObject>('/personal-objects', {
      method: 'POST',
      body: JSON.stringify(o),
    });
  },

  updateObject: async (id: ID, o: Partial<Omit<PersonalObject, "id" | "receivedAt">>) => {
    return request<PersonalObject>(`/personal-objects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(o),
    });
  },

  deleteObject: async (id: ID) => {
    return request<void>(`/personal-objects/${id}`, {
      method: 'DELETE',
    });
  },

  // ========== Usuarios ==========
  listUsers: async () => {
    return request<User[]>('/users');
  },

  getUser: async (id: ID) => {
    return request<User>(`/users/${id}`);
  },

  addUser: async (u: Omit<User, "id">) => {
    return request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(u),
    });
  },

  updateUser: async (id: ID, u: Partial<Omit<User, "id">>) => {
    return request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(u),
    });
  },

  deleteUser: async (id: ID) => {
    return request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};


