-- Script para migrar TODAS las columnas de patients de inglés a español
-- Ejecuta este script en SQL Server Management Studio

PRINT '========================================';
PRINT 'MIGRACIÓN COMPLETA: Tabla patients';
PRINT '========================================';
PRINT '';

-- Verificar columnas actuales
PRINT 'Columnas actuales en patients:';
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'patients'
ORDER BY ORDINAL_POSITION;
PRINT '';

-- name -> nombre
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'name')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'nombre')
BEGIN
    EXEC sp_rename 'patients.name', 'nombre', 'COLUMN';
    PRINT '✓ name -> nombre';
END
ELSE IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'nombre')
BEGIN
    PRINT '✓ nombre ya existe';
END
GO

-- birth_date -> fecha_nacimiento
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'birth_date')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'fecha_nacimiento')
BEGIN
    EXEC sp_rename 'patients.birth_date', 'fecha_nacimiento', 'COLUMN';
    PRINT '✓ birth_date -> fecha_nacimiento';
END
GO

-- birth_place -> lugar_nacimiento
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'birth_place')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'lugar_nacimiento')
BEGIN
    EXEC sp_rename 'patients.birth_place', 'lugar_nacimiento', 'COLUMN';
    PRINT '✓ birth_place -> lugar_nacimiento';
END
GO

-- age -> edad (ya debería estar, pero por si acaso)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'age')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'edad')
BEGIN
    EXEC sp_rename 'patients.age', 'edad', 'COLUMN';
    PRINT '✓ age -> edad';
END
GO

-- address -> direccion
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'address')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'direccion')
BEGIN
    EXEC sp_rename 'patients.address', 'direccion', 'COLUMN';
    PRINT '✓ address -> direccion';
END
GO

-- admission_date -> fecha_ingreso
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'admission_date')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'fecha_ingreso')
BEGIN
    EXEC sp_rename 'patients.admission_date', 'fecha_ingreso', 'COLUMN';
    PRINT '✓ admission_date -> fecha_ingreso';
END
GO

-- notes -> notas
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'notes')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'notas')
BEGIN
    EXEC sp_rename 'patients.notes', 'notas', 'COLUMN';
    PRINT '✓ notes -> notas';
END
GO

-- status -> estado (ya debería estar migrado, pero por si acaso)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'status')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'estado')
BEGIN
    -- Eliminar constraints primero
    IF EXISTS (SELECT * FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('patients') AND name = 'CK_patients_status')
    BEGIN
        ALTER TABLE patients DROP CONSTRAINT CK_patients_status;
    END
    IF EXISTS (SELECT * FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('patients') AND name = 'DF_patients_status')
    BEGIN
        ALTER TABLE patients DROP CONSTRAINT DF_patients_status;
    END
    
    EXEC sp_rename 'patients.status', 'estado', 'COLUMN';
    PRINT '✓ status -> estado';
    
    -- Recrear constraints
    IF NOT EXISTS (SELECT * FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('patients') AND name = 'DF_patients_estado')
    BEGIN
        DECLARE @addDefaultSql NVARCHAR(400);
        SET @addDefaultSql = N'ALTER TABLE patients ADD CONSTRAINT DF_patients_estado DEFAULT ''activo'' FOR estado';
        EXEC sp_executesql @addDefaultSql;
    END
    IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('patients') AND name = 'CK_patients_estado')
    BEGIN
        DECLARE @addCheckSql NVARCHAR(400);
        SET @addCheckSql = N'ALTER TABLE patients ADD CONSTRAINT CK_patients_estado CHECK (estado IN (''activo'', ''baja''))';
        EXEC sp_executesql @addCheckSql;
    END
END
GO

-- discharge_date -> fecha_baja
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'discharge_date')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'fecha_baja')
BEGIN
    EXEC sp_rename 'patients.discharge_date', 'fecha_baja', 'COLUMN';
    PRINT '✓ discharge_date -> fecha_baja';
END
GO

-- discharge_reason -> motivo_baja
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'discharge_reason')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'motivo_baja')
BEGIN
    EXEC sp_rename 'patients.discharge_reason', 'motivo_baja', 'COLUMN';
    PRINT '✓ discharge_reason -> motivo_baja';
END
GO

-- created_at -> fecha_creacion
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'created_at')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'fecha_creacion')
BEGIN
    EXEC sp_rename 'patients.created_at', 'fecha_creacion', 'COLUMN';
    PRINT '✓ created_at -> fecha_creacion';
END
GO

-- updated_at -> fecha_actualizacion
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'updated_at')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'fecha_actualizacion')
BEGIN
    EXEC sp_rename 'patients.updated_at', 'fecha_actualizacion', 'COLUMN';
    PRINT '✓ updated_at -> fecha_actualizacion';
END
GO

-- created_by -> creado_por
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'created_by')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'creado_por')
BEGIN
    -- Eliminar foreign key si existe
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('patients') AND name = 'FK_patients_created_by')
    BEGIN
        ALTER TABLE patients DROP CONSTRAINT FK_patients_created_by;
    END
    
    EXEC sp_rename 'patients.created_by', 'creado_por', 'COLUMN';
    PRINT '✓ created_by -> creado_por';
    
    -- Recrear foreign key
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('patients') AND name = 'FK_patients_creado_por')
    BEGIN
        ALTER TABLE patients 
        ADD CONSTRAINT FK_patients_creado_por 
        FOREIGN KEY (creado_por) REFERENCES users(id);
    END
END
GO

-- updated_by -> actualizado_por
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'updated_by')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'actualizado_por')
BEGIN
    -- Eliminar foreign key si existe
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('patients') AND name = 'FK_patients_updated_by')
    BEGIN
        ALTER TABLE patients DROP CONSTRAINT FK_patients_updated_by;
    END
    
    EXEC sp_rename 'patients.updated_by', 'actualizado_por', 'COLUMN';
    PRINT '✓ updated_by -> actualizado_por';
    
    -- Recrear foreign key
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('patients') AND name = 'FK_patients_actualizado_por')
    BEGIN
        ALTER TABLE patients 
        ADD CONSTRAINT FK_patients_actualizado_por 
        FOREIGN KEY (actualizado_por) REFERENCES users(id);
    END
END
GO

PRINT '';
PRINT '========================================';
PRINT 'VERIFICACIÓN FINAL';
PRINT '========================================';
PRINT 'Columnas finales en patients:';
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'patients'
ORDER BY ORDINAL_POSITION;
PRINT '';
PRINT '✓ Migración completada';

