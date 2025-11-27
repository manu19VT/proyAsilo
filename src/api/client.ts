import { ID, Patient, Contact, Medication, EntryRequest, PersonalObject, User, PatientMedication } from "../types";

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

  // ========== Pacientes ==========
  listPatients: async (filters?: { query?: string; status?: "activo" | "baja"; contactName?: string; userId?: string; userRole?: string }) => {
    const params = new URLSearchParams();
    if (filters?.query) params.append('q', filters.query);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.contactName) params.append('contactName', filters.contactName);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.userRole) params.append('userRole', filters.userRole);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<Patient[]>(`/patients${query}`);
  },

  getPatient: async (id: ID) => {
    return request<Patient>(`/patients/${id}`);
  },

  addPatient: async (
    p: Omit<Patient, "id" | "contacts" | "status"> & {
      status?: Patient["status"];
      contacts?: Contact[];
      userId?: string;
      userRole?: string;
      doctorId?: string;
      nurseId?: string;
    }
  ) => {
    return request<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(p),
    });
  },

  updatePatient: async (
    id: ID,
    p: Partial<Omit<Patient, "id" | "contacts" | "status">> & {
      status?: Patient["status"];
      contacts?: Contact[];
      userId?: string;
      doctorId?: string;
      nurseId?: string;
    }
  ) => {
    return request<Patient>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(p),
    });
  },

  deletePatient: async (id: ID, userId?: string, userName?: string) => {
    return request<void>(`/patients/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId, userName }),
    });
  },

  restorePatient: async (id: ID, userId?: string) => {
    return request<Patient>(`/patients/${id}/restore`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  dischargePatient: async (id: ID, reason: string, userId?: string) => {
    return request<Patient>(`/patients/${id}/discharge`, {
      method: 'POST',
      body: JSON.stringify({ reason, userId }),
    });
  },

  reactivatePatient: async (id: ID, userId?: string) => {
    return request<Patient>(`/patients/${id}/reactivate`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
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
  listMeds: async (query?: string) => {
    const qs = query ? `?q=${encodeURIComponent(query)}` : '';
    return request<Medication[]>(`/medications${qs}`);
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

  // 🆕 Buscar por código de barras (si implementaste este endpoint)
  findMedByBarcode: async (barcode: string) => {
    try {
      return await request<Medication>(`/medications/barcode/${encodeURIComponent(barcode)}`);
    } catch (e) {
      // Si tu backend devuelve 404, mejor regresamos null
      return null as unknown as Medication;
    }
  },

  getPatientMedications: async (patientId: ID) => {
    return request<PatientMedication[]>(`/patient-medications/patients/${patientId}`);
  },

  addPatientMedication: async (payload: Omit<PatientMedication, "id">) => {
    return request<PatientMedication>('/patient-medications', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // ========== Solicitudes de Entrada / Salida / Caducidad ==========
  // 🆕 incluyo 'caducidad' en el filtro
  listEntries: async (filters?: { type?: "entrada" | "salida" | "caducidad"; patientId?: ID }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.patientId) params.append('patientId', filters.patientId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<EntryRequest[]>(`/entry-requests${query}`);
  },

  getEntry: async (id: ID) => {
    return request<EntryRequest>(`/entry-requests/${id}`);
  },

  getEntryByFolio: async (folio: string) => {
    return request<EntryRequest>(`/entry-requests/folio/${folio}`);
  },

  // 🆕 acepto 'comment' opcional en el payload
  addEntry: async (
    e: Omit<EntryRequest, "id" | "createdAt" | "folio"> & { userId?: string; comment?: string }
  ) => {
    return request<EntryRequest>('/entry-requests', {
      method: 'POST',
      body: JSON.stringify(e),
    });
  },

  updateEntry: async (
    id: ID,
    e: Partial<Omit<EntryRequest, "id" | "createdAt" | "folio">> & { comment?: string }
  ) => {
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
  listUsers: async (role?: User['role']) => {
    const query = role ? `?role=${encodeURIComponent(role)}` : '';
    return request<User[]>(`/users${query}`);
  },

  listDoctors: async () => {
    return request<User[]>(`/users?role=doctor`);
  },

  listNurses: async () => {
    return request<User[]>(`/users?role=nurse`);
  },

  getUser: async (id: ID) => {
    return request<User>(`/users/${id}`);
  },

  addUser: async (payload: {
    name: string;
    role: User['role'];
    email: string;
    password: string;
    age?: number;
    birthDate?: string;
  }) => {
    return request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
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

  changePassword: async (userId: ID, password: string, requireChange = false) => {
    return request<User>(`/users/${userId}/change-password`, {
      method: 'POST',
      body: JSON.stringify({ password, requireChange }),
    });
  },
};
