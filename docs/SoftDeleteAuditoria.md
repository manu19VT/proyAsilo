# Soft Delete + Auditoría


## Ventajas de Soft Delete

### Recuperación Inmediata
- Los datos nunca se pierden realmente
- Restauración con un solo comando
- Sin necesidad de restaurar backups

### Integridad Referencial
- Las relaciones (doctor_id, enfermero_id) se mantienen
- No hay problemas con foreign keys
- Historial completo preservado

### Cumplimiento Legal
- Datos médicos deben conservarse por ley
- Trazabilidad completa
- Auditorías sin problemas

### Seguridad
- Eliminaciones accidentales son reversibles
- Período de gracia para recuperar
- Sin pérdida de datos históricos

## Comparación de Estrategias

| Característica | DELETE Físico | Soft Delete | Híbrido (Recomendado) |
|---------------|---------------|-------------|----------------------|
| Recuperación | Solo desde backup | Inmediata | Inmediata (90 días) |
| Espacio BD | Menor | Mayor | Controlado |
| Integridad | Puede romperse | Se mantiene | Se mantiene |
| Velocidad | Rápida | Rápida | Rápida |
| Seguridad | Baja | Alta | Muy Alta |
| Cumplimiento | Difícil | Fácil | Fácil |

## Arquitectura Recomendada

```
┌─────────────────────────────────────┐
│   Usuario solicita eliminar         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Diálogo de Confirmación           │
│   (ConfirmDeleteDialog)             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Trigger intercepta DELETE          │
│   (TRG_patients_before_delete)      │
└──────────────┬──────────────────────┘
               │
               ├──────────────────────┐
               ▼                       ▼
┌──────────────────────┐   ┌──────────────────────┐
│   Soft Delete        │   │   Audit Log          │
│   UPDATE eliminado=1 │   │   Registro completo  │
└──────────────────────┘   └──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Datos ocultos de consultas        │
│   (WHERE eliminado = 0)             │
└─────────────────────────────────────┘
               │
               ▼ (Después de 90 días)
┌─────────────────────────────────────┐
│   Eliminación Física                │
│   (SP_EliminarRegistrosAntiguos)    │
└─────────────────────────────────────┘
```

## Flujo de Trabajo

### Eliminación Normal
```sql
-- Usuario hace clic en "Eliminar"
DELETE FROM patients WHERE id = 'xxx'
  ↓
-- Trigger intercepta
  ↓
-- Soft Delete: UPDATE eliminado = 1
  ↓
-- Registro en audit_log
  ↓
-- Paciente oculto de consultas normales
```

### Restauración
```sql
-- Administrador restaura
EXEC SP_RestaurarPaciente @pacienteId = 'xxx'
  ↓
-- UPDATE eliminado = 0
  ↓
-- Registro en audit_log
  ↓
-- Paciente visible nuevamente
```

### Limpieza Periódica
```sql
-- Job programado (cada mes)
EXEC SP_EliminarRegistrosAntiguos @diasRetencion = 90
  ↓
-- Elimina físicamente registros > 90 días
  ↓
-- Solo si no tienen referencias activas
```

## Implementación Paso a Paso

### Ejecutar Script de Soft Delete
```sql
-- Ejecutar en SQL Server Management Studio
-- backend/src/database/soft_delete_implementation.sql
```

### Actualizar Consultas
Todas las consultas deben filtrar `eliminado = 0`:
```sql
SELECT * FROM patients 
WHERE eliminado = 0  -- ← Agregar esto
```

### Configurar Período de Retención
```sql
-- Por defecto: 90 días
-- Ajustar según políticas de la institución
EXEC SP_EliminarRegistrosAntiguos @diasRetencion = 90
```

### Programar Limpieza Automática
```sql
-- Crear SQL Server Agent Job
-- Ejecutar mensualmente
EXEC SP_EliminarRegistrosAntiguos @diasRetencion = 90
```

## Casos de Uso

### Caso 1: Eliminación Accidental
```
Usuario elimina paciente por error
  ↓
Administrador consulta audit_log
  ↓
Restaura con SP_RestaurarPaciente
  ↓
Paciente recuperado en segundos
```

### Caso 2: Eliminación Legítima
```
Usuario elimina paciente (fallecido, dado de alta)
  ↓
Soft delete: marcado como eliminado
  ↓
Oculto de consultas normales
  ↓
Después de 90 días: eliminación física
```

### Caso 3: Auditoría
```
Regulador solicita historial
  ↓
Consultar audit_log
  ↓
Ver todas las eliminaciones con datos completos
  ↓
Cumplimiento garantizado
```

## Configuración Recomendada

### Para Pacientes
- **Soft Delete**:  Siempre
- **Período Retención**: 90-180 días
- **Eliminación Física**: Solo después de período

### Para Usuarios
- **Soft Delete**:  Siempre
- **Validación**: No eliminar si tiene pacientes asignados
- **Período Retención**: 30-60 días

### Para Medicamentos
- **Soft Delete**: Opcional (menos crítico)
- **DELETE Físico**: Aceptable si no tiene prescripciones

### Para Contactos
- **DELETE Físico**: Aceptable (datos menos críticos)
- **CASCADE**: Ya implementado

## Métricas a Monitorear

```sql
-- Pacientes eliminados esperando limpieza
SELECT COUNT(*) 
FROM patients 
WHERE eliminado = 1 
  AND fecha_eliminacion < DATEADD(DAY, -90, GETDATE());

-- Espacio ocupado por registros eliminados
SELECT 
  tabla_afectada,
  COUNT(*) as registros_eliminados,
  SUM(DATALENGTH(datos_anteriores)) as tamaño_bytes
FROM audit_log
WHERE accion = 'SOFT_DELETE'
GROUP BY tabla_afectada;
```

## Checklist de Implementación

- [x] Script de soft delete creado
- [x] Triggers actualizados
- [x] Procedimientos de restauración
- [x] Procedimiento de limpieza periódica
- [ ] Actualizar todas las consultas (filtrar eliminado = 0)
- [ ] Crear interfaz de restauración en frontend
- [ ] Programar job de limpieza automática
- [ ] Documentar políticas de retención
- [ ] Capacitar administradores

## Próximos Pasos

1. **Ejecutar el script** `soft_delete_implementation.sql`
2. **Actualizar servicios** para filtrar `eliminado = 0`
3. **Crear página de administración** para ver/restaurar eliminados
4. **Programar limpieza automática** (SQL Server Agent)
5. **Documentar políticas** de retención para el equipo

## Conclusión

**Soft Delete + Auditoría** es la mejor opción para tu sistema porque:
- Protege datos críticos
- Permite recuperación rápida
- Cumple normativas
- Mantiene integridad
- Es reversible
- Tiene trazabilidad completa

**Recomendación final**: Implementa soft delete para pacientes y usuarios, mantén DELETE físico para datos menos críticos (contactos, objetos personales).

