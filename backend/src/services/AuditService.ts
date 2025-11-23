import { v4 as uuidv4 } from 'uuid';
import { query, execute } from '../database/database';

export interface AuditLog {
  id: string;
  tabla_afectada: string;
  registro_id: string;
  accion: 'DELETE' | 'UPDATE' | 'SOFT_DELETE' | 'RESTORE' | 'CREATE';
  datos_anteriores?: string;
  usuario_id?: string;
  usuario_nombre?: string;
  fecha_accion: string;
  ip_address?: string;
  observaciones?: string;
}

export class AuditService {
  // Registrar una acción en el log de auditoría
  async logAction(data: {
    tabla_afectada: string;
    registro_id: string;
    accion: AuditLog['accion'];
    datos_anteriores?: any;
    usuario_id?: string;
    usuario_nombre?: string;
    ip_address?: string;
    observaciones?: string;
  }): Promise<void> {
    const id = uuidv4();
    const datosJson = data.datos_anteriores 
      ? JSON.stringify(data.datos_anteriores)
      : null;

    await execute(`
      INSERT INTO audit_log (
        id, tabla_afectada, registro_id, accion, datos_anteriores,
        usuario_id, usuario_nombre, fecha_accion, ip_address, observaciones
      )
      VALUES (
        @id, @tabla, @registroId, @accion, @datos,
        @usuarioId, @usuarioNombre, GETDATE(), @ip, @observaciones
      )
    `, {
      id,
      tabla: data.tabla_afectada,
      registroId: data.registro_id,
      accion: data.accion,
      datos: datosJson,
      usuarioId: data.usuario_id || null,
      usuarioNombre: data.usuario_nombre || null,
      ip: data.ip_address || null,
      observaciones: data.observaciones || null
    });
  }

  // Obtener logs de auditoría
  async getLogs(filters?: {
    tabla?: string;
    usuario_id?: string;
    accion?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    let sql = `
      SELECT 
        id,
        tabla_afectada,
        registro_id,
        accion,
        datos_anteriores,
        usuario_id,
        usuario_nombre,
        fecha_accion,
        ip_address,
        observaciones
      FROM audit_log
      WHERE 1=1
    `;
    const params: Record<string, any> = {};

    if (filters?.tabla) {
      sql += ' AND tabla_afectada = @tabla';
      params.tabla = filters.tabla;
    }

    if (filters?.usuario_id) {
      sql += ' AND usuario_id = @usuarioId';
      params.usuarioId = filters.usuario_id;
    }

    if (filters?.accion) {
      sql += ' AND accion = @accion';
      params.accion = filters.accion;
    }

    if (filters?.fecha_desde) {
      sql += ' AND fecha_accion >= @fechaDesde';
      params.fechaDesde = filters.fecha_desde;
    }

    if (filters?.fecha_hasta) {
      sql += ' AND fecha_accion <= @fechaHasta';
      params.fechaHasta = filters.fecha_hasta;
    }

    sql += ' ORDER BY fecha_accion DESC';

    if (filters?.limit) {
      sql += ` OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY`;
      params.limit = filters.limit;
    } else {
      sql += ` OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY`;
    }

    const logs = await query<AuditLog>(sql, params);
    return logs;
  }

  // Obtener log específico por ID de registro
  async getLogsByRecordId(tabla: string, registroId: string): Promise<AuditLog[]> {
    return this.getLogs({ tabla, limit: 50 });
  }
}

export const auditService = new AuditService();

