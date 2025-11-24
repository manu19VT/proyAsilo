-- Tabla de Auditoría para registrar todas las eliminaciones y cambios importantes
-- Esta tabla registra quién hizo qué acción y cuándo
use AsiloDB
go
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[audit_log]') AND type in (N'U'))
BEGIN
    CREATE TABLE audit_log (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        tabla_afectada NVARCHAR(100) NOT NULL, -- 'patients', 'users', 'medications', etc.
        registro_id NVARCHAR(36) NOT NULL, -- ID del registro eliminado/modificado
        accion NVARCHAR(50) NOT NULL, -- 'DELETE', 'UPDATE', 'SOFT_DELETE', 'RESTORE'
        datos_anteriores NVARCHAR(MAX) NULL, -- JSON con los datos antes de la eliminación
        usuario_id NVARCHAR(36) NULL, -- ID del usuario que realizó la acción
        usuario_nombre NVARCHAR(255) NULL, -- Nombre del usuario
        fecha_accion DATETIME2 DEFAULT GETDATE(),
        ip_address NVARCHAR(50) NULL,
        observaciones NVARCHAR(MAX) NULL,
        CONSTRAINT FK_audit_log_usuario FOREIGN KEY (usuario_id) REFERENCES users(id)
    );
    
    -- Índices para mejorar búsquedas
    CREATE INDEX idx_audit_log_tabla ON audit_log(tabla_afectada);
    CREATE INDEX idx_audit_log_registro ON audit_log(registro_id);
    CREATE INDEX idx_audit_log_usuario ON audit_log(usuario_id);
    CREATE INDEX idx_audit_log_fecha ON audit_log(fecha_accion);
    CREATE INDEX idx_audit_log_accion ON audit_log(accion);
END
GO

-- Trigger para backup automático antes de eliminar pacientes
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TRG_patients_before_delete')
    DROP TRIGGER TRG_patients_before_delete;
GO

CREATE TRIGGER TRG_patients_before_delete
ON patients
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Insertar en audit_log antes de eliminar
    INSERT INTO audit_log (
        tabla_afectada,
        registro_id,
        accion,
        datos_anteriores,
        usuario_id,
        fecha_accion
    )
    SELECT 
        'patients',
        d.id,
        'DELETE',
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
        SYSTEM_USER, -- Usuario de la sesión (puede mejorarse)
        GETDATE()
    FROM deleted d;
    
    -- Ahora sí eliminar físicamente
    DELETE p FROM patients p
    INNER JOIN deleted d ON p.id = d.id;
END;
GO

-- Trigger para backup antes de eliminar usuarios
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TRG_users_before_delete')
    DROP TRIGGER TRG_users_before_delete;
GO

CREATE TRIGGER TRG_users_before_delete
ON users
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar si el usuario tiene pacientes asignados
    IF EXISTS (SELECT 1 FROM patients WHERE doctor_id IN (SELECT id FROM deleted) OR enfermero_id IN (SELECT id FROM deleted))
    BEGIN
        RAISERROR('No se puede eliminar el usuario porque tiene pacientes asignados. Primero reasigna los pacientes.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;
    
    -- Insertar en audit_log
    INSERT INTO audit_log (
        tabla_afectada,
        registro_id,
        accion,
        datos_anteriores,
        usuario_id,
        fecha_accion
    )
    SELECT 
        'users',
        d.id,
        'DELETE',
        (
            SELECT 
                d.id as id,
                d.nombre as nombre,
                d.rol as rol,
                d.email as email,
                d.fecha_creacion as fecha_creacion
            FOR JSON PATH
        ),
        SYSTEM_USER,
        GETDATE()
    FROM deleted d;
    
    -- Eliminar físicamente
    DELETE u FROM users u
    INNER JOIN deleted d ON u.id = d.id;
END;
GO

PRINT 'Tabla de auditoría y triggers creados correctamente.';
PRINT 'NOTA: Los triggers previenen eliminaciones y registran en audit_log.';
GO

