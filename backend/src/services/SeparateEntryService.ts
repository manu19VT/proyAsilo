import { v4 as uuidv4 } from 'uuid';
import { EntryRequest, ID } from '../types';
import { query, queryOne, execute, getDatabase } from '../database/database';
import { patientMedicationService } from './PatientMedicationService';

interface EntryFilters {
  type?: "entrada" | "salida" | "caducidad";
  patientId?: ID;
}

export class SeparateEntryService {
  // Generar folio según el tipo
  private async getNextFolio(type: "entrada" | "salida" | "caducidad"): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = type === "entrada" ? "E" : type === "salida" ? "S" : "C";
    
    let tableName = "";
    let dateColumn = "";
    if (type === "entrada") {
      tableName = "entradas";
      dateColumn = "fecha_creacion";
    } else if (type === "salida") {
      tableName = "salidas";
      dateColumn = "fecha_creacion";
    } else {
      tableName = "caducidades";
      dateColumn = "fecha_registro";
    }
    
    const result = await queryOne<{ total?: number }>(`
      SELECT COUNT(*) AS total
      FROM ${tableName}
      WHERE YEAR(${dateColumn}) = @year
    `, { year });
    const next = (result?.total || 0) + 1;
    return `${prefix}-${year}-${String(next).padStart(4, '0')}`;
  }

  // Obtener fecha de entrada original para un medicamento
  private async getOriginalEntryDate(medicationId: ID): Promise<string | null> {
    try {
      const result = await queryOne<{ fecha_creacion?: string }>(`
        SELECT TOP 1 e.fecha_creacion
        FROM entradas e
        INNER JOIN entrada_items ei ON e.id = ei.entrada_id
        WHERE ei.medicamento_id = @medicationId
        ORDER BY e.fecha_creacion ASC
      `, { medicationId });
      return result?.fecha_creacion || null;
    } catch (error) {
      console.error('Error obteniendo fecha de entrada original:', error);
      return null;
    }
  }

  // Listar según el tipo
  async listEntryRequests(filters?: EntryFilters): Promise<EntryRequest[]> {
    const { type } = filters || {};
    
    if (!type || type === "todos") {
      // Combinar todas las tablas
      const [entradas, salidas, caducidades] = await Promise.all([
        this.listEntradas(),
        this.listSalidas(),
        this.listCaducidades()
      ]);
      return [...entradas, ...salidas, ...caducidades].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    
    if (type === "entrada") return this.listEntradas();
    if (type === "salida") return this.listSalidas(filters?.patientId);
    if (type === "caducidad") return this.listCaducidades();
    
    return [];
  }

  private async listEntradas(): Promise<EntryRequest[]> {
    const entries = await query<any>(`
      SELECT 
        id,
        folio,
        fecha_creacion as createdAt,
        estado as status,
        comentario as comment
      FROM entradas
      ORDER BY fecha_creacion DESC
    `);
    
    const result: EntryRequest[] = [];
    for (const entry of entries) {
      const items = await this.getEntradaItems(entry.id);
      result.push({
        id: entry.id,
        folio: entry.folio,
        type: "entrada",
        patientId: "", // Entradas no tienen paciente
        createdAt: entry.createdAt,
        items,
        status: entry.status,
        comment: entry.comment
      });
    }
    return result;
  }

  private async listSalidas(patientId?: ID): Promise<EntryRequest[]> {
    let sql = `
      SELECT 
        s.id,
        s.folio,
        s.paciente_id as patientId,
        s.fecha_creacion as createdAt,
        s.estado as status,
        s.fecha_vencimiento as dueDate,
        s.comentario as comment
      FROM salidas s
    `;
    const params: Record<string, any> = {};
    
    if (patientId) {
      sql += ` WHERE s.paciente_id = @patientId`;
      params.patientId = patientId;
    }
    
    sql += ` ORDER BY s.fecha_creacion DESC`;
    
    const entries = await query<any>(sql, params);
    
    const result: EntryRequest[] = [];
    for (const entry of entries) {
      const items = await this.getSalidaItems(entry.id);
      result.push({
        id: entry.id,
        folio: entry.folio,
        type: "salida",
        patientId: entry.patientId,
        createdAt: entry.createdAt,
        items,
        status: entry.status,
        dueDate: entry.dueDate,
        comment: entry.comment
      });
    }
    return result;
  }

  private async listCaducidades(): Promise<EntryRequest[]> {
    const entries = await query<any>(`
      SELECT 
        id,
        folio,
        fecha_registro as createdAt,
        estado as status,
        comentario as comment
      FROM caducidades
      ORDER BY fecha_registro DESC
    `);
    
    const result: EntryRequest[] = [];
    for (const entry of entries) {
      const items = await this.getCaducidadItems(entry.id);
      result.push({
        id: entry.id,
        folio: entry.folio,
        type: "caducidad",
        patientId: "", // Caducidades no tienen paciente
        createdAt: entry.createdAt,
        items,
        status: entry.status,
        comment: entry.comment
      });
    }
    return result;
  }

  private async getEntradaItems(entradaId: ID) {
    return await query<{ medicationId: ID; qty: number }>(`
      SELECT 
        medicamento_id as medicationId,
        cantidad as qty
      FROM entrada_items
      WHERE entrada_id = @entradaId
    `, { entradaId });
  }

  private async getSalidaItems(salidaId: ID) {
    return await query<{ medicationId: ID; qty: number; dosisRecomendada?: string; frecuencia?: string; fechaCaducidad?: string }>(`
      SELECT 
        medicamento_id as medicationId,
        cantidad as qty,
        dosis_recomendada as dosisRecomendada,
        frecuencia as frecuencia,
        fecha_caducidad as fechaCaducidad
      FROM salida_items
      WHERE salida_id = @salidaId
    `, { salidaId });
  }

  private async getCaducidadItems(caducidadId: ID) {
    // Obtener items con la fecha de caducidad del medicamento
    return await query<{ medicationId: ID; qty: number; fechaCaducidad?: string }>(`
      SELECT 
        ci.medicamento_id as medicationId,
        ci.cantidad as qty,
        m.fecha_vencimiento as fechaCaducidad
      FROM caducidad_items ci
      INNER JOIN medications m ON ci.medicamento_id = m.id
      WHERE ci.caducidad_id = @caducidadId
    `, { caducidadId });
  }

  async getEntryRequestById(id: ID): Promise<EntryRequest | null> {
    // Buscar en todas las tablas
    const entrada = await queryOne<any>(`SELECT id, 'entrada' as type FROM entradas WHERE id = @id`, { id });
    if (entrada) {
      const entry = await queryOne<any>(`
        SELECT id, folio, fecha_creacion as createdAt, estado as status, comentario as comment
        FROM entradas WHERE id = @id
      `, { id });
      if (!entry) return null;
      const items = await this.getEntradaItems(id);
      return {
        id: entry.id,
        folio: entry.folio,
        type: "entrada",
        patientId: "",
        createdAt: entry.createdAt,
        items,
        status: entry.status,
        comment: entry.comment
      };
    }

    const salida = await queryOne<any>(`SELECT id, 'salida' as type FROM salidas WHERE id = @id`, { id });
    if (salida) {
      const entry = await queryOne<any>(`
        SELECT id, folio, paciente_id as patientId, fecha_creacion as createdAt, 
               estado as status, fecha_vencimiento as dueDate, comentario as comment
        FROM salidas WHERE id = @id
      `, { id });
      if (!entry) return null;
      const items = await this.getSalidaItems(id);
      return {
        id: entry.id,
        folio: entry.folio,
        type: "salida",
        patientId: entry.patientId,
        createdAt: entry.createdAt,
        items,
        status: entry.status,
        dueDate: entry.dueDate,
        comment: entry.comment
      };
    }

    const caducidad = await queryOne<any>(`SELECT id, 'caducidad' as type FROM caducidades WHERE id = @id`, { id });
    if (caducidad) {
      const entry = await queryOne<any>(`
        SELECT id, folio, fecha_registro as createdAt, estado as status, comentario as comment
        FROM caducidades WHERE id = @id
      `, { id });
      if (!entry) return null;
      const items = await this.getCaducidadItems(id);
      return {
        id: entry.id,
        folio: entry.folio,
        type: "caducidad",
        patientId: "",
        createdAt: entry.createdAt,
        items,
        status: entry.status,
        comment: entry.comment
      };
    }

    return null;
  }

  async getEntryRequestByFolio(folio: string): Promise<EntryRequest | null> {
    // Buscar en todas las tablas
    const entrada = await queryOne<any>(`SELECT id FROM entradas WHERE folio = @folio`, { folio });
    if (entrada) return this.getEntryRequestById(entrada.id);

    const salida = await queryOne<any>(`SELECT id FROM salidas WHERE folio = @folio`, { folio });
    if (salida) return this.getEntryRequestById(salida.id);

    const caducidad = await queryOne<any>(`SELECT id FROM caducidades WHERE folio = @folio`, { folio });
    if (caducidad) return this.getEntryRequestById(caducidad.id);

    return null;
  }

  async createEntryRequest(data: Omit<EntryRequest, 'id' | 'folio' | 'createdAt'> & { userId?: ID; comment?: string }): Promise<EntryRequest> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const folio = await this.getNextFolio(data.type);

    // Validar inventario para salidas y caducidad
    if (data.type === 'salida' || data.type === 'caducidad') {
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

    if (data.type === 'entrada') {
      // Crear entrada
      await execute(`
        INSERT INTO entradas (id, folio, fecha_creacion, estado, comentario, creado_por)
        VALUES (@id, @folio, @createdAt, @status, @comment, @userId)
      `, {
        id,
        folio,
        createdAt: now,
        status: data.status,
        comment: data.comment || null,
        userId: data.userId || null
      });

      // Crear items de entrada
      for (const item of data.items) {
        await execute(`
          INSERT INTO entrada_items (id, entrada_id, medicamento_id, cantidad)
          VALUES (@itemId, @entradaId, @medicationId, @qty)
        `, {
          itemId: uuidv4(),
          entradaId: id,
          medicationId: item.medicationId,
          qty: item.qty
        });

        // Aumentar cantidad del medicamento
        await execute(`
          UPDATE medications
          SET cantidad = cantidad + @qty, fecha_actualizacion = @updatedAt
          WHERE id = @medicationId
        `, { medicationId: item.medicationId, qty: item.qty, updatedAt: now });
      }
    } else if (data.type === 'salida') {
      // Validar que tenga paciente
      if (!data.patientId) {
        throw new Error('patientId es requerido para salidas');
      }

      // Crear salida
      await execute(`
        INSERT INTO salidas (id, folio, paciente_id, fecha_creacion, estado, fecha_vencimiento, comentario, creado_por)
        VALUES (@id, @folio, @patientId, @createdAt, @status, @dueDate, @comment, @userId)
      `, {
        id,
        folio,
        patientId: data.patientId,
        createdAt: now,
        status: data.status,
        dueDate: data.dueDate || null,
        comment: data.comment || null,
        userId: data.userId || null
      });

      // Crear items de salida
      for (const item of data.items) {
        await execute(`
          INSERT INTO salida_items (id, salida_id, medicamento_id, cantidad, dosis_recomendada, frecuencia, fecha_caducidad)
          VALUES (@itemId, @salidaId, @medicationId, @qty, @dosis, @frecuencia, @fechaCaducidad)
        `, {
          itemId: uuidv4(),
          salidaId: id,
          medicationId: item.medicationId,
          qty: item.qty,
          dosis: item.dosisRecomendada || null,
          frecuencia: item.frecuencia || null,
          fechaCaducidad: item.fechaCaducidad || null
        });

        // Disminuir cantidad del medicamento
        await execute(`
          UPDATE medications
          SET cantidad = cantidad - @qty, fecha_actualizacion = @updatedAt
          WHERE id = @medicationId
        `, { medicationId: item.medicationId, qty: item.qty, updatedAt: now });

        // Registrar en patient_medications si tiene dosis y frecuencia
        if (item.dosisRecomendada && item.frecuencia) {
          try {
            await patientMedicationService.assignMedication({
              patientId: data.patientId!,
              medicationId: item.medicationId,
              dosage: item.dosisRecomendada,
              frequency: item.frecuencia,
              prescribedAt: now,
              prescribedBy: data.userId || undefined,
              cantidad: item.qty
            });
          } catch (error) {
            console.error('Error al registrar medicamento en patient_medications:', error);
          }
        }
      }
    } else if (data.type === 'caducidad') {
      // Caducidad NO requiere paciente
      
      // Crear caducidad (fecha_registro se establece automáticamente con GETDATE())
      await execute(`
        INSERT INTO caducidades (id, folio, fecha_registro, estado, comentario, creado_por)
        VALUES (@id, @folio, @fechaRegistro, @status, @comment, @userId)
      `, {
        id,
        folio,
        fechaRegistro: now,
        status: data.status,
        comment: data.comment || null,
        userId: data.userId || null
      });

      // Crear items de caducidad (la fecha de caducidad se obtiene del medicamento)
      for (const item of data.items) {
        // Obtener la fecha de caducidad del medicamento
        const medication = await queryOne<{ expiresAt: string }>(
          'SELECT fecha_vencimiento as expiresAt FROM medications WHERE id = @id',
          { id: item.medicationId }
        );
        
        await execute(`
          INSERT INTO caducidad_items (id, caducidad_id, medicamento_id, cantidad, fecha_caducidad)
          VALUES (@itemId, @caducidadId, @medicationId, @qty, @fechaCaducidad)
        `, {
          itemId: uuidv4(),
          caducidadId: id,
          medicationId: item.medicationId,
          qty: item.qty,
          fechaCaducidad: medication?.expiresAt || item.fechaCaducidad || null
        });

        // Disminuir cantidad del medicamento
        await execute(`
          UPDATE medications
          SET cantidad = cantidad - @qty, fecha_actualizacion = @updatedAt
          WHERE id = @medicationId
        `, { medicationId: item.medicationId, qty: item.qty, updatedAt: now });
      }
    }

    return await this.getEntryRequestById(id)!;
  }

  async updateEntryRequest(id: ID, data: Partial<EntryRequest>): Promise<EntryRequest | null> {
    const existing = await this.getEntryRequestById(id);
    if (!existing) return null;

    if (existing.type === 'entrada') {
      await execute(`
        UPDATE entradas 
        SET estado = COALESCE(@status, estado),
            comentario = COALESCE(@comment, comentario)
        WHERE id = @id
      `, {
        status: data.status || null,
        comment: (data as any).comment || null,
        id
      });
    } else if (existing.type === 'salida') {
      await execute(`
        UPDATE salidas 
        SET paciente_id = COALESCE(@patientId, paciente_id),
            estado = COALESCE(@status, estado),
            fecha_vencimiento = COALESCE(@dueDate, fecha_vencimiento),
            comentario = COALESCE(@comment, comentario)
        WHERE id = @id
      `, {
        patientId: data.patientId || null,
        status: data.status || null,
        dueDate: data.dueDate || null,
        comment: (data as any).comment || null,
        id
      });
    } else if (existing.type === 'caducidad') {
      await execute(`
        UPDATE caducidades 
        SET estado = COALESCE(@status, estado),
            comentario = COALESCE(@comment, comentario)
        WHERE id = @id
      `, {
        status: data.status || null,
        comment: (data as any).comment || null,
        id
      });
    }

    if (data.items) {
      // Eliminar items existentes y crear nuevos
      if (existing.type === 'entrada') {
        await execute('DELETE FROM entrada_items WHERE entrada_id = @id', { id });
        for (const item of data.items) {
          await execute(`
            INSERT INTO entrada_items (id, entrada_id, medicamento_id, cantidad)
            VALUES (@itemId, @entradaId, @medicationId, @qty)
          `, {
            itemId: uuidv4(),
            entradaId: id,
            medicationId: item.medicationId,
            qty: item.qty
          });
        }
      } else if (existing.type === 'salida') {
        await execute('DELETE FROM salida_items WHERE salida_id = @id', { id });
        for (const item of data.items) {
          await execute(`
            INSERT INTO salida_items (id, salida_id, medicamento_id, cantidad, dosis_recomendada, frecuencia, fecha_caducidad)
            VALUES (@itemId, @salidaId, @medicationId, @qty, @dosis, @frecuencia, @fechaCaducidad)
          `, {
            itemId: uuidv4(),
            salidaId: id,
            medicationId: item.medicationId,
            qty: item.qty,
            dosis: item.dosisRecomendada || null,
            frecuencia: item.frecuencia || null,
            fechaCaducidad: item.fechaCaducidad || null
          });
        }
      } else if (existing.type === 'caducidad') {
        await execute('DELETE FROM caducidad_items WHERE caducidad_id = @id', { id });
        for (const item of data.items) {
          // Obtener la fecha de caducidad del medicamento
          const medication = await queryOne<{ expiresAt: string }>(
            'SELECT fecha_vencimiento as expiresAt FROM medications WHERE id = @id',
            { id: item.medicationId }
          );
          
          await execute(`
            INSERT INTO caducidad_items (id, caducidad_id, medicamento_id, cantidad, fecha_caducidad)
            VALUES (@itemId, @caducidadId, @medicationId, @qty, @fechaCaducidad)
          `, {
            itemId: uuidv4(),
            caducidadId: id,
            medicationId: item.medicationId,
            qty: item.qty,
            fechaCaducidad: medication?.expiresAt || item.fechaCaducidad || null
          });
        }
      }
    }

    return await this.getEntryRequestById(id);
  }

  async deleteEntryRequest(id: ID): Promise<boolean> {
    // Intentar eliminar de cada tabla
    const entrada = await execute('DELETE FROM entradas WHERE id = @id', { id });
    if (entrada > 0) return true;

    const salida = await execute('DELETE FROM salidas WHERE id = @id', { id });
    if (salida > 0) return true;

    const caducidad = await execute('DELETE FROM caducidades WHERE id = @id', { id });
    if (caducidad > 0) return true;

    return false;
  }
}

export const separateEntryService = new SeparateEntryService();

