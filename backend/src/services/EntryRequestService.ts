import { v4 as uuidv4 } from 'uuid';
import { EntryRequest, ID } from '../types';
import { query, queryOne, execute } from '../database/database';

export class EntryRequestService {
  // Listar todas las solicitudes
  async listEntryRequests(): Promise<EntryRequest[]> {
    const entries = await query<any>(`
      SELECT 
        id,
        patient_id as patientId,
        created_at as createdAt,
        status,
        due_date as dueDate
      FROM entry_requests
      ORDER BY created_at DESC
    `);
    
    // Cargar items para cada solicitud
    const entriesWithItems = await Promise.all(entries.map(async (entry: any) => ({
      ...entry,
      items: await this.getItemsByEntryId(entry.id)
    })));
    
    return entriesWithItems as EntryRequest[];
  }

  // Obtener solicitud por ID
  async getEntryRequestById(id: ID): Promise<EntryRequest | null> {
    const entry = await queryOne<any>(`
      SELECT 
        id,
        patient_id as patientId,
        created_at as createdAt,
        status,
        due_date as dueDate
      FROM entry_requests 
      WHERE id = @id
    `, { id });
    
    if (!entry) return null;
    
    entry.items = await this.getItemsByEntryId(id);
    return entry as EntryRequest;
  }

  // Crear nueva solicitud
  async createEntryRequest(data: Omit<EntryRequest, 'id' | 'createdAt'>): Promise<EntryRequest> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await execute(`
      INSERT INTO entry_requests (id, patient_id, created_at, status, due_date)
      VALUES (@id, @patientId, @createdAt, @status, @dueDate)
    `, {
      id,
      patientId: data.patientId,
      createdAt: now,
      status: data.status,
      dueDate: data.dueDate || null
    });
    
    // Crear items de la solicitud
    for (const item of data.items) {
      await this.createEntryItem({
        entryRequestId: id,
        medicationId: item.medicationId,
        qty: item.qty
      });
    }
    
    const entryRequest = await this.getEntryRequestById(id);
    return entryRequest!;
  }

  // Actualizar solicitud
  async updateEntryRequest(id: ID, data: Partial<EntryRequest>): Promise<EntryRequest | null> {
    const existing = await this.getEntryRequestById(id);
    if (!existing) return null;
    
    await execute(`
      UPDATE entry_requests 
      SET patient_id = COALESCE(@patientId, patient_id),
          status = COALESCE(@status, status),
          due_date = COALESCE(@dueDate, due_date)
      WHERE id = @id
    `, {
      patientId: data.patientId || null,
      status: data.status || null,
      dueDate: data.dueDate || null,
      id
    });
    
    // Si se proporcionan items, actualizarlos
    if (data.items) {
      // Eliminar items existentes
      await execute('DELETE FROM entry_items WHERE entry_request_id = @id', { id });
      
      // Crear nuevos items
      for (const item of data.items) {
        await this.createEntryItem({
          entryRequestId: id,
          medicationId: item.medicationId,
          qty: item.qty
        });
      }
    }
    
    return await this.getEntryRequestById(id);
  }

  // Eliminar solicitud
  async deleteEntryRequest(id: ID): Promise<boolean> {
    const rowsAffected = await execute('DELETE FROM entry_requests WHERE id = @id', { id });
    return rowsAffected > 0;
  }

  // Obtener items de una solicitud
  async getItemsByEntryId(entryRequestId: ID): Promise<{ medicationId: ID; qty: number }[]> {
    const items = await query<{ medicationId: ID; qty: number }>(`
      SELECT 
        medication_id as medicationId,
        qty
      FROM entry_items 
      WHERE entry_request_id = @entryRequestId
    `, { entryRequestId });
    return items;
  }

  // Crear item de solicitud
  async createEntryItem(data: { entryRequestId: ID; medicationId: ID; qty: number }): Promise<void> {
    const id = uuidv4();
    
    await execute(`
      INSERT INTO entry_items (id, entry_request_id, medication_id, qty)
      VALUES (@id, @entryRequestId, @medicationId, @qty)
    `, {
      id,
      entryRequestId: data.entryRequestId,
      medicationId: data.medicationId,
      qty: data.qty
    });
  }
}

export const entryRequestService = new EntryRequestService();
