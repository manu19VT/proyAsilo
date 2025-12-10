import { v4 as uuidv4 } from 'uuid';
import { EntryRequest, ID } from '../types';
import { query, queryOne, execute, getDatabase } from '../database/database';
import { patientMedicationService } from './PatientMedicationService';
import { medicationService } from './MedicationService';

interface EntryFilters {
  type?: "entrada" | "salida" | "caducidad";
  patientId?: ID;
}

export class EntryRequestService {
  private async getNextFolio(type: "entrada" | "salida" | "caducidad"): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = type === "entrada" ? "E" : type === "salida" ? "S" : "C";
    const result = await queryOne<{ total?: number }>(`
      SELECT COUNT(*) AS total
      FROM entry_requests
      WHERE tipo = @type AND YEAR(fecha_creacion) = @year
    `, { type, year });
    const next = (result?.total || 0) + 1;
    return `${prefix}-${year}-${String(next).padStart(4, '0')}`;
  }

  private mapRow(row: any, items: { medicationId: ID; qty: number; dosisRecomendada?: string; frecuencia?: string; fechaCaducidad?: string; medicationName?: string; unit?: string }[]): EntryRequest {
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
    // Primero obtener solo las entradas (sin items) - más eficiente
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

    // Obtener solo las entradas primero
    const entries = await query<any>(sql, params);
    
    if (entries.length === 0) {
      return [];
    }

    // Obtener todos los items de estas entradas en una sola consulta usando subconsulta
    // Esto es más eficiente que múltiples consultas
    const entryIds = entries.map(e => e.id);
    
    // Construir consulta segura usando parámetros de tabla de valores
    // Para SQL Server, usamos una tabla de valores temporal
    const pool = await getDatabase();
    const request = pool.request();
    
    // Si hay muchos IDs, dividir en lotes para evitar problemas de rendimiento
    const BATCH_SIZE = 100;
    const itemsMap = new Map<string, { medicationId: ID; qty: number; dosisRecomendada?: string; frecuencia?: string; fechaCaducidad?: string; medicationName?: string; unit?: string }[]>();
    
    // Inicializar el mapa con arrays vacíos para todas las entradas
    entryIds.forEach(id => {
      itemsMap.set(id, []);
    });
    
    for (let i = 0; i < entryIds.length; i += BATCH_SIZE) {
      const batch = entryIds.slice(i, i + BATCH_SIZE);
      // Escapar comillas simples para prevenir SQL injection
      const batchIds = batch.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
      
      // Seleccionar con JOIN a medications para obtener nombre y unidad si no están en entry_items
      let itemsSql = `
        SELECT 
          ei.solicitud_id as entryRequestId,
          ei.medicamento_id as medicationId,
          ei.cantidad as qty,
          ei.dosis_recomendada as dosisRecomendada,
          ei.frecuencia as frecuencia,
          ei.fecha_caducidad as fechaCaducidad,
          COALESCE(ei.nombre_medicamento, m.nombre) as medicationName,
          COALESCE(ei.unidad, m.unidad) as unit
        FROM entry_items ei
        LEFT JOIN medications m ON ei.medicamento_id = m.id
        WHERE ei.solicitud_id IN (${batchIds})
        ORDER BY ei.solicitud_id, ei.medicamento_id
      `;

      try {
        const itemsResult = await request.query(itemsSql);
        const itemsRows = itemsResult.recordset;
        
        for (const item of itemsRows) {
          const entryId = item.entryRequestId;
          if (itemsMap.has(entryId)) {
            itemsMap.get(entryId)!.push({
              medicationId: item.medicationId,
              qty: item.qty,
              dosisRecomendada: item.dosisRecomendada || undefined,
              frecuencia: item.frecuencia || undefined,
              fechaCaducidad: item.fechaCaducidad || undefined,
              medicationName: item.medicationName || undefined,
              unit: item.unit || undefined
            });
          }
        }
      } catch (error: any) {
        // Si falla por columnas faltantes, intentar sin nombre_medicamento y unidad
        if (error.message && (error.message.includes('nombre_medicamento') || error.message.includes('unidad') || error.message.includes('Invalid column name'))) {
          console.warn('⚠️ Columnas nombre_medicamento o unidad no existen. Recuperando sin ellas. Ejecuta el script SQL para agregarlas.');
          const fallbackSql = `
            SELECT 
              solicitud_id as entryRequestId,
              medicamento_id as medicationId,
              cantidad as qty,
              dosis_recomendada as dosisRecomendada,
              frecuencia as frecuencia,
              fecha_caducidad as fechaCaducidad
            FROM entry_items
            WHERE solicitud_id IN (${batchIds})
            ORDER BY solicitud_id, medicamento_id
          `;
          try {
            const itemsResult = await request.query(fallbackSql);
            const itemsRows = itemsResult.recordset;
            
            for (const item of itemsRows) {
              const entryId = item.entryRequestId;
              if (itemsMap.has(entryId)) {
                itemsMap.get(entryId)!.push({
                  medicationId: item.medicationId,
                  qty: item.qty,
                  dosisRecomendada: item.dosisRecomendada || undefined,
                  frecuencia: item.frecuencia || undefined,
                  fechaCaducidad: item.fechaCaducidad || undefined,
                  medicationName: undefined,
                  unit: undefined
                });
              }
            }
          } catch (fallbackError: any) {
            console.error(`Error obteniendo items para lote ${i}-${i + BATCH_SIZE}:`, fallbackError);
          }
        } else {
          console.error(`Error obteniendo items para lote ${i}-${i + BATCH_SIZE}:`, error);
        }
      }
    }

    // Combinar entradas con sus items
    return entries.map(entry => {
      const items = itemsMap.get(entry.id) || [];
      return this.mapRow(entry, items);
    });
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

    // Para entradas, no se requiere paciente (paciente_id será NULL)

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

    // Para entradas, no se usa paciente_id (será NULL). Para salidas y caducidad, es requerido.
    if (data.type === 'entrada') {
      // Para entradas, insertar sin paciente_id (será NULL)
      await execute(`
        INSERT INTO entry_requests (id, folio, tipo, paciente_id, fecha_creacion, estado, fecha_vencimiento)
        VALUES (@id, @folio, @type, NULL, @createdAt, @status, @dueDate)
      `, {
        id,
        folio,
        type: data.type,
        createdAt: now,
        status: data.status,
        dueDate: data.dueDate || null
      });
    } else {
      // Para salidas y caducidad, paciente_id es obligatorio
      if (!data.patientId) {
        throw new Error('patientId es requerido para salidas y caducidad');
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
    }
    
    for (const item of data.items) {
      // Para entradas: si hay medicationName pero el medicationId es temporal o no existe,
      // buscar o crear el medicamento primero
      let actualMedicationId = item.medicationId;
      if (data.type === 'entrada' && (item as any).medicationName) {
        const medicationName = (item as any).medicationName;
        const medicationUnit = (item as any).unit || '';
        
        // Buscar si ya existe un medicamento con ese nombre
        const existingMed = await queryOne<{ id: string }>(`
          SELECT id FROM medications WHERE LOWER(nombre) = LOWER(@name)
        `, { name: medicationName });
        
        if (existingMed) {
          // Usar el ID del medicamento existente
          actualMedicationId = existingMed.id;
        } else {
          // Crear un nuevo medicamento
          const newMedication = await medicationService.createMedication({
            name: medicationName,
            qty: 0, // Se actualizará después con la cantidad de la entrada
            unit: medicationUnit,
            expiresAt: (item as any).fechaCaducidad || new Date().toISOString(),
            createdBy: data.userId
          });
          actualMedicationId = newMedication.id;
        }
      }
      
      // Para entradas, siempre guardar el nombre y unidad del medicamento
      // incluso si el medicamento ya existe (para mantener el historial)
      let medicationNameToSave = (item as any).medicationName;
      let unitToSave = (item as any).unit;
      
      // Si no se proporcionó medicationName pero el medicamento existe, obtenerlo de la tabla medications
      if (data.type === 'entrada' && !medicationNameToSave && actualMedicationId) {
        const medInfo = await queryOne<{ nombre: string; unidad: string }>(`
          SELECT nombre, unidad FROM medications WHERE id = @id
        `, { id: actualMedicationId });
        if (medInfo) {
          medicationNameToSave = medInfo.nombre;
          unitToSave = medInfo.unidad || unitToSave;
        }
      }
      
      // Log para depuración
      if (data.type === 'entrada') {
        console.log('[createEntryRequest] Guardando item de entrada:', {
          medicationId: actualMedicationId,
          medicationName: medicationNameToSave,
          unit: unitToSave,
          qty: item.qty,
          fechaCaducidad: item.fechaCaducidad,
          itemOriginal: item
        });
      }
      
      await this.createEntryItem({
        entryRequestId: id,
        medicationId: actualMedicationId,
        qty: item.qty,
        dosisRecomendada: item.dosisRecomendada,
        frecuencia: item.frecuencia,
        fechaCaducidad: item.fechaCaducidad,
        medicationName: medicationNameToSave,
        unit: unitToSave
      });

      if (data.type === 'salida') {
        // Actualizar inventario
        await execute(`
          UPDATE medications
          SET cantidad = cantidad - @qty, fecha_actualizacion = @updatedAt
          WHERE id = @medicationId
        `, { medicationId: actualMedicationId, qty: item.qty, updatedAt: now });

        // Registrar medicamento en patient_medications si tiene dosis y frecuencia
        if (item.dosisRecomendada && item.frecuencia && data.patientId) {
          try {
            await patientMedicationService.assignMedication({
              patientId: data.patientId,
              medicationId: actualMedicationId,
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
      } else if (data.type === 'entrada') {
        // Para entradas, aumentar la cantidad
        await execute(`
          UPDATE medications
          SET cantidad = cantidad + @qty, fecha_actualizacion = @updatedAt
          WHERE id = @medicationId
        `, { medicationId: actualMedicationId, qty: item.qty, updatedAt: now });
      } else if (data.type === 'caducidad') {
        // Para caducidad, disminuir la cantidad
        await execute(`
          UPDATE medications
          SET cantidad = cantidad - @qty, fecha_actualizacion = @updatedAt
          WHERE id = @medicationId
        `, { medicationId: actualMedicationId, qty: item.qty, updatedAt: now });
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
          fechaCaducidad: item.fechaCaducidad,
          medicationName: (item as any).medicationName,
          unit: (item as any).unit
        });
      }
    }
    
    return await this.getEntryRequestById(id);
  }

  async deleteEntryRequest(id: ID): Promise<boolean> {
    const rowsAffected = await execute('DELETE FROM entry_requests WHERE id = @id', { id });
    return rowsAffected > 0;
  }

  async getItemsByEntryId(entryRequestId: ID): Promise<{ medicationId: ID; qty: number; dosisRecomendada?: string; frecuencia?: string; fechaCaducidad?: string; medicationName?: string; unit?: string }[]> {
    try {
      const items = await query<{ medicationId: ID; qty: number; dosisRecomendada?: string; frecuencia?: string; fechaCaducidad?: string; medicationName?: string; unit?: string }>(`
        SELECT 
          ei.medicamento_id as medicationId,
          ei.cantidad as qty,
          ei.dosis_recomendada as dosisRecomendada,
          ei.frecuencia as frecuencia,
          ei.fecha_caducidad as fechaCaducidad,
          COALESCE(ei.nombre_medicamento, m.nombre) as medicationName,
          COALESCE(ei.unidad, m.unidad) as unit
        FROM entry_items ei
        LEFT JOIN medications m ON ei.medicamento_id = m.id
        WHERE ei.solicitud_id = @entryRequestId
      `, { entryRequestId });
      return items;
    } catch (error: any) {
      // Si falla por columnas faltantes, intentar sin nombre_medicamento y unidad pero con JOIN
      if (error.message && (error.message.includes('nombre_medicamento') || error.message.includes('unidad') || error.message.includes('Invalid column name'))) {
        console.warn('⚠️ Columnas nombre_medicamento o unidad no existen. Recuperando desde medications.');
        const items = await query<{ medicationId: ID; qty: number; dosisRecomendada?: string; frecuencia?: string; fechaCaducidad?: string; medicationName?: string; unit?: string }>(`
          SELECT 
            ei.medicamento_id as medicationId,
            ei.cantidad as qty,
            ei.dosis_recomendada as dosisRecomendada,
            ei.frecuencia as frecuencia,
            ei.fecha_caducidad as fechaCaducidad,
            m.nombre as medicationName,
            m.unidad as unit
          FROM entry_items ei
          LEFT JOIN medications m ON ei.medicamento_id = m.id
          WHERE ei.solicitud_id = @entryRequestId
        `, { entryRequestId });
        return items;
      }
      throw error;
    }
  }

  async createEntryItem(data: { entryRequestId: ID; medicationId: ID; qty: number; dosisRecomendada?: string; frecuencia?: string; fechaCaducidad?: string; medicationName?: string; unit?: string }): Promise<void> {
    const id = uuidv4();
    
    // Log para depuración
    console.log('[createEntryItem] Insertando item:', {
      medicationId: data.medicationId,
      medicationName: data.medicationName,
      unit: data.unit,
      qty: data.qty,
      fechaCaducidad: data.fechaCaducidad
    });
    
    try {
      await execute(`
        INSERT INTO entry_items (id, solicitud_id, medicamento_id, cantidad, dosis_recomendada, frecuencia, fecha_caducidad, nombre_medicamento, unidad)
        VALUES (@id, @entryRequestId, @medicationId, @qty, @dosisRecomendada, @frecuencia, @fechaCaducidad, @medicationName, @unit)
      `, {
        id,
        entryRequestId: data.entryRequestId,
        medicationId: data.medicationId,
        qty: data.qty,
        dosisRecomendada: data.dosisRecomendada || null,
        frecuencia: data.frecuencia || null,
        fechaCaducidad: data.fechaCaducidad || null,
        medicationName: data.medicationName || null,
        unit: data.unit || null
      });
      console.log('[createEntryItem] ✓ Item insertado correctamente');
    } catch (error: any) {
      console.error('[createEntryItem] ❌ Error al insertar:', error.message);
      // Si falla por columnas faltantes, intentar sin nombre_medicamento y unidad
      if (error.message && (error.message.includes('nombre_medicamento') || error.message.includes('unidad') || error.message.includes('Invalid column name'))) {
        console.warn('⚠️ Columnas nombre_medicamento o unidad no existen. Insertando sin ellas. Ejecuta el script SQL para agregarlas.');
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
      } else {
        throw error;
      }
    }
  }
}

export const entryRequestService = new EntryRequestService();
