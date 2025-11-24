import { v4 as uuidv4 } from 'uuid';
import { EntryRequest, ID } from '../types';
import { query, queryOne, execute } from '../database/database';
import { patientMedicationService } from './PatientMedicationService';

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
      WHERE tipo = @type AND YEAR(fecha_creacion) = @year
    `, { type, year });
    const next = (result?.total || 0) + 1;
    return `${prefix}-${year}-${String(next).padStart(4, '0')}`;
  }

  private mapRow(row: any, items: { medicationId: ID; qty: number; dosisRecomendada?: string; frecuencia?: string; fechaCaducidad?: string }[]): EntryRequest {
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
        tipo as type,
        paciente_id as patientId,
        fecha_creacion as createdAt,
        estado as status,
        fecha_vencimiento as dueDate
      FROM entry_requests
    `;
    const params: Record<string, any> = {};
    const conditions: string[] = [];

    if (filters?.type) {
      conditions.push('tipo = @type');
      params.type = filters.type;
    }

    if (filters?.patientId) {
      conditions.push('paciente_id = @patientId');
      params.patientId = filters.patientId;
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY fecha_creacion DESC';

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
        tipo as type,
        paciente_id as patientId,
        fecha_creacion as createdAt,
        estado as status,
        fecha_vencimiento as dueDate
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
        tipo as type,
        paciente_id as patientId,
        fecha_creacion as createdAt,
        estado as status,
        fecha_vencimiento as dueDate
      FROM entry_requests 
      WHERE folio = @folio
    `, { folio });
    
    if (!row) return null;
    
    const items = await this.getItemsByEntryId(row.id);
    return this.mapRow(row, items);
  }

  async createEntryRequest(data: Omit<EntryRequest, 'id' | 'folio' | 'createdAt'> & { userId?: ID }): Promise<EntryRequest> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const folio = await this.getNextFolio(data.type);

    // Validar inventario para salidas
    if (data.type === 'salida') {
      for (const item of data.items) {
        const medication = await queryOne<{ qty: number; name: string }>(
          'SELECT cantidad as qty, nombre as name FROM medications WHERE id = @id',
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
      INSERT INTO entry_requests (id, folio, tipo, paciente_id, fecha_creacion, estado, fecha_vencimiento)
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
        qty: item.qty,
        dosisRecomendada: item.dosisRecomendada,
        frecuencia: item.frecuencia,
        fechaCaducidad: item.fechaCaducidad
      });

      if (data.type === 'salida') {
        // Actualizar inventario
        await execute(`
          UPDATE medications
          SET cantidad = cantidad - @qty, fecha_actualizacion = @updatedAt
          WHERE id = @medicationId
        `, { medicationId: item.medicationId, qty: item.qty, updatedAt: now });

        // Registrar medicamento en patient_medications si tiene dosis y frecuencia
        if (item.dosisRecomendada && item.frecuencia) {
          try {
            await patientMedicationService.assignMedication({
              patientId: data.patientId,
              medicationId: item.medicationId,
              dosage: item.dosisRecomendada,
              frequency: item.frecuencia,
              prescribedAt: now,
              prescribedBy: data.userId || undefined,
              cantidad: item.qty
            });
          } catch (error) {
            // Log error pero no fallar la creación de la salida
            console.error('Error al registrar medicamento en patient_medications:', error);
          }
        }
      } else {
        await execute(`
          UPDATE medications
          SET cantidad = cantidad + @qty, fecha_actualizacion = @updatedAt
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
      SET paciente_id = COALESCE(@patientId, paciente_id),
          estado = COALESCE(@status, estado),
          fecha_vencimiento = COALESCE(@dueDate, fecha_vencimiento)
      WHERE id = @id
    `, {
      patientId: data.patientId || null,
      status: data.status || null,
      dueDate: data.dueDate || null,
      id
    });
    
    if (data.items) {
      await execute('DELETE FROM entry_items WHERE solicitud_id = @id', { id });
      for (const item of data.items) {
        await this.createEntryItem({
          entryRequestId: id,
          medicationId: item.medicationId,
          qty: item.qty,
          dosisRecomendada: item.dosisRecomendada,
          frecuencia: item.frecuencia,
          fechaCaducidad: item.fechaCaducidad
        });
      }
    }
    
    return await this.getEntryRequestById(id);
  }

  async deleteEntryRequest(id: ID): Promise<boolean> {
    const rowsAffected = await execute('DELETE FROM entry_requests WHERE id = @id', { id });
    return rowsAffected > 0;
  }

  async getItemsByEntryId(entryRequestId: ID): Promise<{ medicationId: ID; qty: number; dosisRecomendada?: string; frecuencia?: string; fechaCaducidad?: string }[]> {
    const items = await query<{ medicationId: ID; qty: number; dosisRecomendada?: string; frecuencia?: string; fechaCaducidad?: string }>(`
      SELECT 
        medicamento_id as medicationId,
        cantidad as qty,
        dosis_recomendada as dosisRecomendada,
        frecuencia as frecuencia,
        fecha_caducidad as fechaCaducidad
      FROM entry_items 
      WHERE solicitud_id = @entryRequestId
    `, { entryRequestId });
    return items;
  }

  async createEntryItem(data: { entryRequestId: ID; medicationId: ID; qty: number; dosisRecomendada?: string; frecuencia?: string; fechaCaducidad?: string }): Promise<void> {
    const id = uuidv4();
    
    await execute(`
      INSERT INTO entry_items (id, solicitud_id, medicamento_id, cantidad, dosis_recomendada, frecuencia, fecha_caducidad)
      VALUES (@id, @entryRequestId, @medicationId, @qty, @dosisRecomendada, @frecuencia, @fechaCaducidad)
    `, {
      id,
      entryRequestId: data.entryRequestId,
      medicationId: data.medicationId,
      qty: data.qty,
      dosisRecomendada: data.dosisRecomendada || null,
      frecuencia: data.frecuencia || null,
      fechaCaducidad: data.fechaCaducidad || null
    });
  }
}

export const entryRequestService = new EntryRequestService();
