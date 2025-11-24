# Explicación: Cómo Funciona Soft Delete desde la Aplicación

## Flujo Completo Paso a Paso

### Cuando Eliminas un Paciente desde la Aplicación

```
┌─────────────────────────────────────────────────────────────┐
│  1. USUARIO hace clic en "Eliminar" en el frontend          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  2. FRONTEND llama a:                                       │
│     api.deletePatient(id, userId, userName)                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  3. BACKEND recibe petición DELETE /api/patients/:id       │
│     En: backend/src/routes/patients.ts                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  4. BACKEND llama a:                                        │
│     patientService.deletePatient(id, userId, userName)      │
│     En: backend/src/services/PatientService.ts             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  5. SERVICIO hace dos cosas:                                │
│     a) Guarda datos en audit_log                            │
│     b) Ejecuta: UPDATE patients SET eliminado = 1          │
│        (NO hace DELETE físico)                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  6. BASE DE DATOS:                                          │
│     - El registro SIGUE EXISTIENDO                         │
│     - Solo cambia: eliminado = 1                            │
│     - Se guarda: fecha_eliminacion = ahora                  │
│     - Se guarda: eliminado_por = userId                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  7. Cuando consultas pacientes:                             │
│     SELECT * FROM patients                                  │
│     WHERE (eliminado = 0 OR eliminado IS NULL)              │
│     ← El paciente NO aparece aquí                           │
└─────────────────────────────────────────────────────────────┘
```

## Qué Significa "Se Guarda"

### ANTES (DELETE Físico):
```
Usuario elimina → DELETE FROM patients →  REGISTRO DESAPARECE
                                        
Resultado: No hay forma de recuperar (solo desde backup)
```

### AHORA (Soft Delete):
```
Usuario elimina → UPDATE eliminado = 1 → REGISTRO SIGUE EXISTIENDO
                                        
Resultado: 
- El registro está en la BD
- Pero está "marcado" como eliminado
- No aparece en consultas normales
- Se puede restaurar fácilmente
```

## Ejemplo Visual

### Estado ANTES de eliminar:
```sql
SELECT * FROM patients WHERE id = 'abc-123';

id          | nombre      | eliminado | fecha_eliminacion
------------|-------------|-----------|------------------
abc-123     | Juan Pérez  | 0         | NULL
```

### Estado DESPUÉS de eliminar (desde la app):
```sql
SELECT * FROM patients WHERE id = 'abc-123';

id          | nombre      | eliminado | fecha_eliminacion    | eliminado_por
------------|-------------|-----------|----------------------|---------------
abc-123     | Juan Pérez  | 1         | 2024-01-15 10:30:00  | user-456
```

**Nota:** El registro SIGUE EXISTIENDO, solo cambió `eliminado = 1`

### Cuando consultas pacientes (lo que ve la app):
```sql
SELECT * FROM patients 
WHERE (eliminado = 0 OR eliminado IS NULL);
-- Este paciente NO aparece aquí porque eliminado = 1
```

## Lo que Pasa en Cada Capa

### 1. **Frontend (React)**
```typescript
// Cuando haces clic en "Eliminar"
await api.deletePatient(patientId, user?.id, user?.name);
// ↑ Esto envía una petición HTTP DELETE al backend
```

### 2. **Backend Route (Express)**
```typescript
// backend/src/routes/patients.ts
router.delete('/:id', async (req, res) => {
  const { userId, userName } = req.body;
  await patientService.deletePatient(id, userId, userName);
  // ↑ Llama al servicio
});
```

### 3. **Backend Service (Lógica de Negocio)**
```typescript
// backend/src/services/PatientService.ts
async deletePatient(id, userId, userName) {
  // 1. Guarda en audit_log
  await auditService.logAction({...});
  
  // 2. Hace SOFT DELETE (UPDATE, no DELETE)
  UPDATE patients 
  SET eliminado = 1, 
      fecha_eliminacion = GETDATE(),
      eliminado_por = userId
  WHERE id = @id;
}
```

### 4. **Base de Datos (SQL Server)**
```sql
-- El trigger también puede interceptar (opcional)
-- Pero el servicio ya hace el soft delete directamente
-- El registro queda con eliminado = 1
```

## Flujo de Restauración

### Para Restaurar un Paciente Eliminado:

```
┌─────────────────────────────────────────────────────────────┐
│  1. Administrador ejecuta:                                  │
│     EXEC SP_RestaurarPaciente @pacienteId = 'abc-123'       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Base de Datos ejecuta:                                  │
│     UPDATE patients                                          │
│     SET eliminado = 0,                                      │
│         fecha_eliminacion = NULL,                           │
│         estado = 'activo'                                   │
│     WHERE id = 'abc-123'                                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  3. El paciente vuelve a aparecer en consultas normales     │
│     porque ahora eliminado = 0                              │
└─────────────────────────────────────────────────────────────┘
```

## Resumen: Dónde se Guarda

### SÍ se Guarda
1. **En la tabla `patients`**: El registro sigue ahí, solo con `eliminado = 1`
2. **En la tabla `audit_log`**: Registro completo de quién, cuándo y qué datos tenía
3. **Relaciones**: Se mantienen (doctor_id, enfermero_id, etc.)

### NO se Borra
- El registro del paciente
- Los contactos relacionados
- Los medicamentos asignados
- El historial

### Se Oculta
- De las consultas normales (por el filtro `eliminado = 0`)
- De la lista en la aplicación
- Pero sigue accesible para administradores

## Prueba Rápida

### 1. Eliminar desde la App:
```typescript
// En el frontend, cuando haces clic en eliminar
await api.deletePatient('abc-123', userId, userName);
```

### 2. Verificar en la BD:
```sql
-- Ver que el registro sigue existiendo
SELECT id, nombre, eliminado, fecha_eliminacion
FROM patients
WHERE id = 'abc-123';
-- Deberías ver: eliminado = 1
```

### 3. Verificar que está oculto:
```sql
-- Esta consulta NO debería mostrarlo
SELECT * FROM patients 
WHERE (eliminado = 0 OR eliminado IS NULL)
  AND id = 'abc-123';
-- Resultado: 0 filas
```

### 4. Restaurar:
```sql
EXEC SP_RestaurarPaciente @pacienteId = 'abc-123';
```

### 5. Verificar que volvió:
```sql
-- Ahora SÍ debería aparecer
SELECT * FROM patients 
WHERE (eliminado = 0 OR eliminado IS NULL)
  AND id = 'abc-123';
-- Resultado: 1 fila
```

## Puntos Clave

1. **El registro NO se borra físicamente** - Solo se marca como eliminado
2. **Se guarda en audit_log** - Para tener historial completo
3. **Se oculta de consultas** - Pero sigue en la base de datos
4. **Se puede restaurar** - En cualquier momento
5. **Las relaciones se mantienen** - No se rompen foreign keys

## Conclusión

**SÍ, cuando eliminas desde la aplicación:**
- Se "guarda" en la base de datos (el registro sigue ahí)
- Se marca como eliminado (`eliminado = 1`)
- Se registra en `audit_log` (quién, cuándo, qué datos)
- Se oculta de la aplicación (no aparece en listas)
- Se puede restaurar fácilmente

**Es como "archivar" en lugar de "tirar a la basura"**

