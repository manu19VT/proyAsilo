#  Eliminación de Datos

## Resumen

Este documento describe las mejores prácticas implementadas para manejar eliminaciones de datos de forma segura en el sistema.

## Estrategias Implementadas

### Sistema de Auditoría

Se ha creado una tabla `audit_log` que registra:
- **Quién** eliminó (usuario_id, usuario_nombre)
- **Qué** se eliminó (tabla_afectada, registro_id)
- **Cuándo** se eliminó (fecha_accion)
- **Datos anteriores** (backup en JSON antes de eliminar)
- **IP y observaciones** adicionales

**Ventajas:**
- Trazabilidad completa de eliminaciones
- Posibilidad de recuperar información eliminada
- Cumplimiento de normativas de auditoría
- Detección de eliminaciones no autorizadas

### Triggers de Seguridad

Se implementaron triggers en SQL Server que:
- **Interceptan** eliminaciones antes de ejecutarse
- **Registran** automáticamente en audit_log
- **Validan** dependencias (ej: no eliminar usuario con pacientes asignados)
- **Previenen** eliminaciones peligrosas

**Ejemplo:** No se puede eliminar un usuario si tiene pacientes asignados.

### Diálogos de Confirmación Mejorados

Componente `ConfirmDeleteDialog` que muestra:
- Información detallada del elemento a eliminar
- Advertencias claras
- Lista de datos relacionados que se eliminarán
- Confirmación explícita requerida

### Soft Delete (Recomendado para Futuro)

Para datos críticos como pacientes, considerar implementar "soft delete":
- En lugar de `DELETE`, usar `UPDATE estado = 'eliminado'`
- Mantener datos para recuperación
- Filtrar automáticamente en consultas

## Cómo Usar

### Para Desarrolladores

#### Registrar Eliminaciones con Auditoría

```typescript
// En los servicios
async deletePatient(id: ID, userId?: string, userName?: string): Promise<boolean> {
  // Obtener datos antes de eliminar
  const patient = await this.getPatientById(id);
  
  // Registrar en auditoría
  await auditService.logAction({
    tabla_afectada: 'patients',
    registro_id: id,
    accion: 'DELETE',
    datos_anteriores: patient,
    usuario_id: userId,
    usuario_nombre: userName
  });
  
  // Eliminar
  await execute('DELETE FROM patients WHERE id = @id', { id });
}
```

#### Usar Diálogo de Confirmación

```typescript
import ConfirmDeleteDialog from '../components/ConfirmDeleteDialog';

const [deleteDialog, setDeleteDialog] = useState(false);
const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

<ConfirmDeleteDialog
  open={deleteDialog}
  onClose={() => setDeleteDialog(false)}
  onConfirm={handleConfirmDelete}
  title="Eliminar Paciente"
  itemName={patientToDelete?.name || ''}
  itemType="Paciente"
  warningMessage="Se eliminarán también todos los contactos, medicamentos y registros relacionados."
  details={[
    { label: 'ID', value: patientToDelete?.id || '' },
    { label: 'CURP', value: patientToDelete?.curp || '-' },
    { label: 'Estado', value: patientToDelete?.status || '' }
  ]}
/>
```

### Para Administradores

#### Consultar Logs de Auditoría

```sql
-- Ver todas las eliminaciones recientes
SELECT 
  fecha_accion,
  usuario_nombre,
  tabla_afectada,
  registro_id,
  observaciones
FROM audit_log
WHERE accion = 'DELETE'
ORDER BY fecha_accion DESC;

-- Ver eliminaciones de un usuario específico
SELECT * FROM audit_log
WHERE usuario_id = 'ID_DEL_USUARIO'
ORDER BY fecha_accion DESC;

-- Recuperar datos de un paciente eliminado
SELECT datos_anteriores
FROM audit_log
WHERE tabla_afectada = 'patients'
  AND registro_id = 'ID_DEL_PACIENTE'
  AND accion = 'DELETE';
```

## Recomendaciones Adicionales

### Backups Regulares
- Realizar backups diarios de la base de datos
- Mantener backups por al menos 30 días
- Probar restauración periódicamente

### Permisos Granulares
- Solo administradores pueden eliminar pacientes
- Doctores pueden eliminar solo sus propios registros
- Enfermeros no pueden eliminar pacientes

### Soft Delete para Datos Críticos
Considerar cambiar de DELETE físico a soft delete:
```sql
-- En lugar de DELETE
UPDATE patients 
SET estado = 'eliminado', 
    fecha_eliminacion = GETDATE(),
    eliminado_por = @userId
WHERE id = @id;
```

### Período de Retención
- Mantener datos "eliminados" por 90 días antes de eliminación física
- Permitir recuperación durante este período

### Notificaciones
- Enviar email al administrador cuando se elimine un paciente
- Registrar en log del sistema

## Rollback

### Opción 1: Desde Audit Log
```sql
-- Recuperar datos del log
DECLARE @jsonData NVARCHAR(MAX);
SELECT @jsonData = datos_anteriores
FROM audit_log
WHERE registro_id = 'ID_DEL_PACIENTE'
  AND accion = 'DELETE'
ORDER BY fecha_accion DESC
OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY;

-- Parsear JSON y restaurar (requiere script adicional)
```

### Opción 2: Desde Backup
```sql
-- Restaurar desde backup de base de datos
RESTORE DATABASE proyAsilo
FROM DISK = 'ruta/al/backup.bak'
WITH REPLACE;
```

## Métricas Recomendadas

Monitorear:
- Número de eliminaciones por día
- Usuarios que más eliminan
- Tipos de datos más eliminados
- Eliminaciones fuera de horario laboral

## Checklist de Implementación

- [x] Tabla de auditoría creada
- [x] Servicio de auditoría implementado
- [x] Triggers de seguridad creados
- [x] Diálogo de confirmación mejorado
- [ ] Soft delete para pacientes (opcional)
- [ ] Dashboard de auditoría (futuro)
- [ ] Notificaciones por email (futuro)
- [ ] Script de recuperación automática (futuro)

## Próximos Pasos

1. **Ejecutar el script de auditoría:**
   ```bash
   # En SQL Server Management Studio
   # Ejecutar: backend/src/database/audit_log.sql
   ```

2. **Actualizar eliminaciones existentes** para usar el nuevo sistema

3. **Capacitar usuarios** sobre el nuevo sistema de confirmación

4. **Monitorear logs** durante las primeras semanas

---

**Nota:** Este sistema proporciona una capa adicional de seguridad, pero no reemplaza los backups regulares ni las políticas de retención de datos.

