import { v4 as uuidv4 } from 'uuid';
import { EntryRequest, ID } from '../types';
import { query, queryOne, execute } from '../database/database';

interface EntryFilters {
  type?: "entrada" | "salida";
  patientId?: ID;
}

export class EntryRequestService {
  private async getNextFolio(type: "entrada" | "salida"): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = type === "entrada" ? "E" : "S";
    const result = await queryOne<{ total?: number }>(`
      SELECT COUNT(*) AS total
      FROM entry_requests
      WHERE type = @type AND YEAR(created_at) = @year
    `, { type, year });
    const next = (result?.total || 0) + 1;
    return `${prefix}-${year}-${String(next).padStart(4, '0')}`;
  }

  private mapRow(row: any, items: { medicationId: ID; qty: number }[]): EntryRequest {
    return {
      id: row.id,
      folio: row.folio,
      type: row.type,
      patientId: row.patientId,
      createdAt: row.createdAt,
      items,
      status: row.status,
      dueDate: row.dueDate || undefined,
    };
  }

  async listEntryRequests(filters?: EntryFilters): Promise<EntryRequest[]> {
    let sql = `
      SELECT 
        id,
        folio,
        type,
        patient_id as patientId,
        created_at as createdAt,
        status,
        due_date as dueDate
      FROM entry_requests
    `;
    const params: Record<string, any> = {};
    const conditions: string[] = [];

    if (filters?.type) {
      conditions.push('type = @type');
      params.type = filters.type;
    }

    if (filters?.patientId) {
      conditions.push('patient_id = @patientId');
      params.patientId = filters.patientId;
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY created_at DESC';

    const rows = await query<any>(sql, params);
    const entries = await Promise.all(rows.map(async (row) => {
      const items = await this.getItemsByEntryId(row.id);
      return this.mapRow(row, items);
    }));
    return entries;
  }

  async getEntryRequestById(id: ID): Promise<EntryRequest | null> {
    const row = await queryOne<any>(`
      SELECT 
        id,
        folio,
        type,
        patient_id as patientId,
        created_at as createdAt,
        status,
        due_date as dueDate
      FROM entry_requests 
      WHERE id = @id
    `, { id });
    
    if (!row) return null;
    
    const items = await this.getItemsByEntryId(id);
    return this.mapRow(row, items);
  }

  async getEntryRequestByFolio(folio: string): Promise<EntryRequest | null> {
    const row = await queryOne<any>(`
      SELECT 
        id,
        folio,
        type,
        patient_id as patientId,
        created_at as createdAt,
        status,
        due_date as dueDate
      FROM entry_requests 
      WHERE folio = @folio
    `, { folio });
    
    if (!row) return null;
    
    const items = await this.getItemsByEntryId(row.id);
    return this.mapRow(row, items);
  }

  async createEntryRequest(data: Omit<EntryRequest, 'id' | 'folio' | 'createdAt'>): Promise<EntryRequest> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const folio = await this.getNextFolio(data.type);

    // Validar inventario para salidas
    if (data.type === 'salida') {
      for (const item of data.items) {
        const medication = await queryOne<{ qty: number; name: string }>(
          'SELECT qty, name FROM medications WHERE id = @id',
          { id: item.medicationId }
        );
        if (!medication) {
          throw new Error(`Medicamento ${item.medicationId} no encontrado`);
        }
        if (item.qty > medication.qty) {
          throw new Error(`Cantidad insuficiente de ${medication.name}. Disponible: ${medication.qty}`);
        }
      }
    }

    await execute(`
      INSERT INTO entry_requests (id, folio, type, patient_id, created_at, status, due_date)
      VALUES (@id, @folio, @type, @patientId, @createdAt, @status, @dueDate)
    `, {
      id,
      folio,
      type: data.type,
      patientId: data.patientId,
      createdAt: now,
      status: data.status,
      dueDate: data.dueDate || null
    });
    
    for (const item of data.items) {
      await this.createEntryItem({
        entryRequestId: id,
        medicationId: item.medicationId,
        qty: item.qty
      });

      if (data.type === 'salida') {
        await execute(`
          UPDATE medications
          SET qty = qty - @qty, updated_at = @updatedAt
          WHERE id = @medicationId
        `, { medicationId: item.medicationId, qty: item.qty, updatedAt: now });
      } else {
        await execute(`
          UPDATE medications
          SET qty = qty + @qty, updated_at = @updatedAt
          WHERE id = @medicationId
        `, { medicationId: item.medicationId, qty: item.qty, updatedAt: now });
      }
    }
    
    const entryRequest = await this.getEntryRequestById(id);
    return entryRequest!;
  }

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
    
    if (data.items) {
      await execute('DELETE FROM entry_items WHERE entry_request_id = @id', { id });
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

  async deleteEntryRequest(id: ID): Promise<boolean> {
    const rowsAffected = await execute('DELETE FROM entry_requests WHERE id = @id', { id });
    return rowsAffected > 0;
  }

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
