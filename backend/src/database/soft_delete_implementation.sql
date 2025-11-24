-- Implementación de Soft Delete para Pacientes y Usuarios
-- Esta estrategia marca registros como eliminados en lugar de borrarlos físicamente
-- Permite recuperación y mantiene integridad referencial

USE AsiloDB
GO

-- ============================================
-- 1. AGREGAR CAMPOS PARA SOFT DELETE EN PATIENTS
-- ============================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'eliminado')
BEGIN
    ALTER TABLE patients ADD eliminado BIT NOT NULL DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'fecha_eliminacion')
BEGIN
    ALTER TABLE patients ADD fecha_eliminacion DATETIME2 NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'eliminado_por')
BEGIN
    ALTER TABLE patients ADD eliminado_por NVARCHAR(36) NULL;
    ALTER TABLE patients ADD CONSTRAINT FK_patients_eliminado_por FOREIGN KEY (eliminado_por) REFERENCES users(id);
END
GO

-- Índice para filtrar registros no eliminados
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_patients_eliminado' AND object_id = OBJECT_ID('patients'))
BEGIN
    CREATE INDEX idx_patients_eliminado ON patients(eliminado, fecha_eliminacion);
END
GO

-- ============================================
-- 2. AGREGAR CAMPOS PARA SOFT DELETE EN USERS
-- ============================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'eliminado')
BEGIN
    ALTER TABLE users ADD eliminado BIT NOT NULL DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'fecha_eliminacion')
BEGIN
    ALTER TABLE users ADD fecha_eliminacion DATETIME2 NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'eliminado_por')
BEGIN
    ALTER TABLE users ADD eliminado_por NVARCHAR(36) NULL;
    ALTER TABLE users ADD CONSTRAINT FK_users_eliminado_por FOREIGN KEY (eliminado_por) REFERENCES users(id);
END
GO

-- Índice para filtrar usuarios no eliminados
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_eliminado' AND object_id = OBJECT_ID('users'))
BEGIN
    CREATE INDEX idx_users_eliminado ON users(eliminado, fecha_eliminacion);
END
GO

-- ============================================
-- 3. ACTUALIZAR TRIGGERS PARA SOFT DELETE
-- ============================================

-- Eliminar trigger antiguo si existe
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TRG_patients_before_delete')
    DROP TRIGGER TRG_patients_before_delete;
GO

-- Nuevo trigger que hace SOFT DELETE en lugar de DELETE físico
CREATE TRIGGER TRG_patients_before_delete
ON patients
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @userId NVARCHAR(36) = NULL;
    DECLARE @userName NVARCHAR(255) = NULL;
    
    -- Intentar obtener usuario de la sesión (puede mejorarse con parámetros)
    -- Por ahora usamos SYSTEM_USER como fallback
    
    -- Registrar en audit_log
    INSERT INTO audit_log (
        tabla_afectada,
        registro_id,
        accion,
        datos_anteriores,
        usuario_id,
        usuario_nombre,
        fecha_accion,
        observaciones
    )
    SELECT 
        'patients',
        d.id,
        'SOFT_DELETE',
        (
            SELECT 
                d.id as id,
                d.nombre as nombre,
                d.fecha_nacimiento as fecha_nacimiento,
                d.edad as edad,
                d.curp as curp,
                d.rfc as rfc,
                d.fecha_ingreso as fecha_ingreso,
                d.estado as estado,
                d.doctor_id as doctor_id,
                d.enfermero_id as enfermero_id,
                d.fecha_creacion as fecha_creacion
            FOR JSON PATH
        ),
        @userId,
        @userName,
        GETDATE(),
        'Paciente marcado como eliminado (soft delete)'
    FROM deleted d;
    
    -- SOFT DELETE: Marcar como eliminado en lugar de borrar
    UPDATE p
    SET 
        eliminado = 1,
        fecha_eliminacion = GETDATE(),
        eliminado_por = @userId,
        estado = 'baja' -- También cambiar estado a baja
    FROM patients p
    INNER JOIN deleted d ON p.id = d.id
    WHERE p.eliminado = 0; -- Solo si no estaba ya eliminado
END;
GO

-- Eliminar trigger antiguo de users si existe
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TRG_users_before_delete')
    DROP TRIGGER TRG_users_before_delete;
GO

-- Nuevo trigger para SOFT DELETE de usuarios
CREATE TRIGGER TRG_users_before_delete
ON users
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @userId NVARCHAR(36) = NULL;
    
    -- Verificar si el usuario tiene pacientes asignados
    IF EXISTS (
        SELECT 1 
        FROM patients 
        WHERE (doctor_id IN (SELECT id FROM deleted) OR enfermero_id IN (SELECT id FROM deleted))
          AND eliminado = 0
    )
    BEGIN
        RAISERROR('No se puede eliminar el usuario porque tiene pacientes asignados. Primero reasigna los pacientes.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;
    
    -- Registrar en audit_log
    INSERT INTO audit_log (
        tabla_afectada,
        registro_id,
        accion,
        datos_anteriores,
        usuario_id,
        fecha_accion,
        observaciones
    )
    SELECT 
        'users',
        d.id,
        'SOFT_DELETE',
        (
            SELECT 
                d.id as id,
                d.nombre as nombre,
                d.rol as rol,
                d.email as email,
                d.fecha_creacion as fecha_creacion
            FOR JSON PATH
        ),
        @userId,
        GETDATE(),
        'Usuario marcado como eliminado (soft delete)'
    FROM deleted d;
    
    -- SOFT DELETE: Marcar como eliminado
    UPDATE u
    SET 
        eliminado = 1,
        fecha_eliminacion = GETDATE(),
        eliminado_por = @userId
    FROM users u
    INNER JOIN deleted d ON u.id = d.id
    WHERE u.eliminado = 0;
END;
GO

-- ============================================
-- 4. PROCEDIMIENTO PARA ELIMINACIÓN FÍSICA PERIÓDICA
-- ============================================
-- Este procedimiento elimina físicamente registros marcados como eliminados
-- después de un período de retención (por defecto 90 días)
-- SOLO EJECUTAR MANUALMENTE O EN JOB PROGRAMADO

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'SP_EliminarRegistrosAntiguos')
    DROP PROCEDURE SP_EliminarRegistrosAntiguos;
GO

CREATE PROCEDURE SP_EliminarRegistrosAntiguos
    @diasRetencion INT = 90,
    @tabla NVARCHAR(100) = NULL -- 'patients' o 'users', NULL para ambas
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @fechaLimite DATETIME2 = DATEADD(DAY, -@diasRetencion, GETDATE());
    
    -- Eliminar pacientes antiguos
    IF @tabla IS NULL OR @tabla = 'patients'
    BEGIN
        -- Registrar en audit_log antes de eliminar físicamente
        INSERT INTO audit_log (
            tabla_afectada,
            registro_id,
            accion,
            datos_anteriores,
            fecha_accion,
            observaciones
        )
        SELECT 
            'patients',
            p.id,
            'DELETE',
            (
                SELECT 
                    p.id as id,
                    p.nombre as nombre,
                    p.fecha_nacimiento as fecha_nacimiento,
                    p.curp as curp,
                    p.estado as estado
                FOR JSON PATH
            ),
            GETDATE(),
            CONCAT('Eliminación física después de ', @diasRetencion, ' días de retención')
        FROM patients p
        WHERE p.eliminado = 1 
          AND p.fecha_eliminacion < @fechaLimite;
        
        -- Eliminar físicamente
        DELETE FROM patients
        WHERE eliminado = 1 
          AND fecha_eliminacion < @fechaLimite;
        
        PRINT CONCAT('Pacientes eliminados físicamente: ', @@ROWCOUNT);
    END
    
    -- Eliminar usuarios antiguos (solo si no tienen referencias)
    IF @tabla IS NULL OR @tabla = 'users'
    BEGIN
        -- Registrar en audit_log
        INSERT INTO audit_log (
            tabla_afectada,
            registro_id,
            accion,
            datos_anteriores,
            fecha_accion,
            observaciones
        )
        SELECT 
            'users',
            u.id,
            'DELETE',
            (
                SELECT 
                    u.id as id,
                    u.nombre as nombre,
                    u.rol as rol,
                    u.email as email
                FOR JSON PATH
            ),
            GETDATE(),
            CONCAT('Eliminación física después de ', @diasRetencion, ' días de retención')
        FROM users u
        WHERE u.eliminado = 1 
          AND u.fecha_eliminacion < @fechaLimite
          AND NOT EXISTS (
              SELECT 1 FROM patients 
              WHERE (doctor_id = u.id OR enfermero_id = u.id OR creado_por = u.id)
                AND eliminado = 0
          );
        
        -- Eliminar físicamente
        DELETE FROM users
        WHERE eliminado = 1 
          AND fecha_eliminacion < @fechaLimite
          AND NOT EXISTS (
              SELECT 1 FROM patients 
              WHERE (doctor_id = users.id OR enfermero_id = users.id OR creado_por = users.id)
                AND eliminado = 0
          );
        
        PRINT CONCAT('Usuarios eliminados físicamente: ', @@ROWCOUNT);
    END
END;
GO

-- ============================================
-- 5. PROCEDIMIENTO PARA RESTAURAR REGISTROS
-- ============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'SP_RestaurarPaciente')
    DROP PROCEDURE SP_RestaurarPaciente;
GO

CREATE PROCEDURE SP_RestaurarPaciente
    @pacienteId NVARCHAR(36),
    @restauradoPor NVARCHAR(36) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar que el paciente existe y está eliminado
    IF NOT EXISTS (SELECT 1 FROM patients WHERE id = @pacienteId AND eliminado = 1)
    BEGIN
        RAISERROR('El paciente no existe o no está eliminado.', 16, 1);
        RETURN;
    END
    
    -- Restaurar paciente
    UPDATE patients
    SET 
        eliminado = 0,
        fecha_eliminacion = NULL,
        eliminado_por = NULL,
        estado = 'activo' -- Restaurar a activo
    WHERE id = @pacienteId;
    
    -- Registrar en audit_log
    INSERT INTO audit_log (
        tabla_afectada,
        registro_id,
        accion,
        usuario_id,
        fecha_accion,
        observaciones
    )
    VALUES (
        'patients',
        @pacienteId,
        'RESTORE',
        @restauradoPor,
        GETDATE(),
        'Paciente restaurado desde soft delete'
    );
    
    PRINT 'Paciente restaurado correctamente.';
END;
GO

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'SP_RestaurarUsuario')
    DROP PROCEDURE SP_RestaurarUsuario;
GO

CREATE PROCEDURE SP_RestaurarUsuario
    @usuarioId NVARCHAR(36),
    @restauradoPor NVARCHAR(36) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar que el usuario existe y está eliminado
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = @usuarioId AND eliminado = 1)
    BEGIN
        RAISERROR('El usuario no existe o no está eliminado.', 16, 1);
        RETURN;
    END
    
    -- Restaurar usuario
    UPDATE users
    SET 
        eliminado = 0,
        fecha_eliminacion = NULL,
        eliminado_por = NULL
    WHERE id = @usuarioId;
    
    -- Registrar en audit_log
    INSERT INTO audit_log (
        tabla_afectada,
        registro_id,
        accion,
        usuario_id,
        fecha_accion,
        observaciones
    )
    VALUES (
        'users',
        @usuarioId,
        'RESTORE',
        @restauradoPor,
        GETDATE(),
        'Usuario restaurado desde soft delete'
    );
    
    PRINT 'Usuario restaurado correctamente.';
END;
GO

PRINT '========================================';
PRINT 'Soft Delete implementado correctamente.';
PRINT '========================================';
PRINT '';
PRINT 'Características:';
PRINT '- Los registros se marcan como eliminados en lugar de borrarse';
PRINT '- Se mantiene integridad referencial';
PRINT '- Se registra en audit_log automáticamente';
PRINT '- Procedimientos para restaurar registros';
PRINT '- Procedimiento para eliminación física después de período de retención';
PRINT '';
PRINT 'Uso:';
PRINT '  - Eliminar: DELETE FROM patients WHERE id = ''...'' (se hace soft delete automático)';
PRINT '  - Restaurar: EXEC SP_RestaurarPaciente @pacienteId = ''...''';
PRINT '  - Limpiar antiguos: EXEC SP_EliminarRegistrosAntiguos @diasRetencion = 90';
PRINT '';
GO

