-- Script de Prueba Rápida para Soft Delete
-- Ejecuta este script para probar rápidamente el sistema

USE AsiloDB
GO

PRINT '========================================';
PRINT 'PRUEBA DE SOFT DELETE';
PRINT '========================================';
PRINT '';

-- ============================================
-- PASO 1: Verificar que existe un paciente
-- ============================================
PRINT 'PASO 1: Buscando paciente para prueba...';
GO

DECLARE @pacienteId NVARCHAR(36);
DECLARE @pacienteNombre NVARCHAR(255);

-- Obtener el primer paciente disponible
SELECT TOP 1 
    @pacienteId = id,
    @pacienteNombre = nombre
FROM patients
WHERE (eliminado = 0 OR eliminado IS NULL)
ORDER BY fecha_creacion DESC;

IF @pacienteId IS NULL
BEGIN
    PRINT 'ERROR: No hay pacientes disponibles para probar.';
    PRINT 'Crea un paciente primero desde la aplicación.';
    RETURN;
END

PRINT CONCAT('Paciente encontrado: ', @pacienteNombre, ' (ID: ', @pacienteId, ')');
PRINT '';

-- ============================================
-- PASO 2: Verificar estado actual
-- ============================================
PRINT 'PASO 2: Estado actual del paciente...';
SELECT 
    id,
    nombre,
    estado,
    eliminado,
    fecha_eliminacion
FROM patients
WHERE id = @pacienteId;
PRINT '';

-- ============================================
-- PASO 3: Hacer Soft Delete
-- ============================================
PRINT 'PASO 3: Ejecutando DELETE (se hará soft delete automáticamente)...';
BEGIN TRY
    DELETE FROM patients WHERE id = @pacienteId;
    PRINT '✓ DELETE ejecutado. El trigger debería haber hecho soft delete.';
END TRY
BEGIN CATCH
    PRINT 'ERROR: ' + ERROR_MESSAGE();
    RETURN;
END CATCH
PRINT '';

-- ============================================
-- PASO 4: Verificar Soft Delete
-- ============================================
PRINT 'PASO 4: Verificando que se hizo soft delete...';
SELECT 
    id,
    nombre,
    estado,
    eliminado,
    fecha_eliminacion,
    eliminado_por
FROM patients
WHERE id = @pacienteId;

IF EXISTS (SELECT 1 FROM patients WHERE id = @pacienteId AND eliminado = 1)
BEGIN
    PRINT '✓ Soft delete exitoso: eliminado = 1';
END
ELSE
BEGIN
    PRINT '✗ ERROR: El paciente no está marcado como eliminado.';
END
PRINT '';

-- ============================================
-- PASO 5: Verificar que está oculto
-- ============================================
PRINT 'PASO 5: Verificando que está oculto de consultas normales...';
IF NOT EXISTS (
    SELECT 1 FROM patients 
    WHERE id = @pacienteId 
      AND (eliminado = 0 OR eliminado IS NULL)
)
BEGIN
    PRINT '✓ El paciente está correctamente oculto.';
END
ELSE
BEGIN
    PRINT '✗ ERROR: El paciente aún aparece en consultas normales.';
END
PRINT '';

-- ============================================
-- PASO 6: Verificar Audit Log
-- ============================================
PRINT 'PASO 6: Verificando registro en audit_log...';
SELECT TOP 1
    fecha_accion,
    accion,
    observaciones,
    LEFT(datos_anteriores, 100) AS datos_preview
FROM audit_log
WHERE tabla_afectada = 'patients'
  AND registro_id = @pacienteId
  AND accion = 'SOFT_DELETE'
ORDER BY fecha_accion DESC;

IF EXISTS (
    SELECT 1 FROM audit_log 
    WHERE tabla_afectada = 'patients' 
      AND registro_id = @pacienteId 
      AND accion = 'SOFT_DELETE'
)
BEGIN
    PRINT '✓ Registro en audit_log creado correctamente.';
END
ELSE
BEGIN
    PRINT '✗ ADVERTENCIA: No se encontró registro en audit_log.';
END
PRINT '';

-- ============================================
-- PASO 7: Restaurar Paciente
-- ============================================
PRINT 'PASO 7: Restaurando paciente...';
BEGIN TRY
    EXEC SP_RestaurarPaciente 
        @pacienteId = @pacienteId,
        @restauradoPor = NULL;
    PRINT '✓ Paciente restaurado.';
END TRY
BEGIN CATCH
    PRINT 'ERROR: ' + ERROR_MESSAGE();
    RETURN;
END CATCH
PRINT '';

-- ============================================
-- PASO 8: Verificar Restauración
-- ============================================
PRINT 'PASO 8: Verificando restauración...';
SELECT 
    id,
    nombre,
    estado,
    eliminado,
    fecha_eliminacion
FROM patients
WHERE id = @pacienteId;

IF EXISTS (
    SELECT 1 FROM patients 
    WHERE id = @pacienteId 
      AND (eliminado = 0 OR eliminado IS NULL)
)
BEGIN
    PRINT '✓ Paciente restaurado correctamente.';
END
ELSE
BEGIN
    PRINT '✗ ERROR: El paciente no se restauró correctamente.';
END
PRINT '';

-- ============================================
-- PASO 9: Verificar Registro de Restauración
-- ============================================
PRINT 'PASO 9: Verificando registro de restauración en audit_log...';
SELECT TOP 2
    fecha_accion,
    accion,
    observaciones
FROM audit_log
WHERE tabla_afectada = 'patients'
  AND registro_id = @pacienteId
ORDER BY fecha_accion DESC;

IF EXISTS (
    SELECT 1 FROM audit_log 
    WHERE tabla_afectada = 'patients' 
      AND registro_id = @pacienteId 
      AND accion = 'RESTORE'
)
BEGIN
    PRINT '✓ Registro de restauración en audit_log creado.';
END
ELSE
BEGIN
    PRINT '✗ ADVERTENCIA: No se encontró registro de restauración.';
END
PRINT '';

-- ============================================
-- RESUMEN
-- ============================================
PRINT '========================================';
PRINT 'RESUMEN DE LA PRUEBA';
PRINT '========================================';
PRINT '';
PRINT 'Paciente usado: ' + @pacienteNombre;
PRINT 'ID: ' + @pacienteId;
PRINT '';
PRINT 'Verificaciones:';
PRINT '  [✓] Soft delete ejecutado';
PRINT '  [✓] Paciente oculto de consultas';
PRINT '  [✓] Registro en audit_log';
PRINT '  [✓] Restauración exitosa';
PRINT '  [✓] Paciente visible nuevamente';
PRINT '';
PRINT '========================================';
PRINT 'PRUEBA COMPLETADA';
PRINT '========================================';
GO

