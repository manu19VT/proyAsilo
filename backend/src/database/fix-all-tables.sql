-- Script para migrar TODAS las tablas de inglés a español
-- Ejecuta este script en SQL Server Management Studio

PRINT '========================================';
PRINT 'MIGRACIÓN COMPLETA DE TODAS LAS TABLAS';
PRINT '========================================';
PRINT '';

-- ============================================
-- TABLA PATIENTS
-- ============================================
PRINT 'Migrando tabla patients...';

-- status -> estado
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'status')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'estado')
BEGIN
    -- Eliminar constraints de status si existen
    IF EXISTS (SELECT * FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('patients') AND name = 'CK_patients_status')
    BEGIN
        ALTER TABLE patients DROP CONSTRAINT CK_patients_status;
    END
    IF EXISTS (SELECT * FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('patients') AND name = 'DF_patients_status')
    BEGIN
        ALTER TABLE patients DROP CONSTRAINT DF_patients_status;
    END
    
    EXEC sp_rename 'patients.status', 'estado', 'COLUMN';
    PRINT '  ✓ status -> estado';
    
    -- Recrear constraints
    IF NOT EXISTS (SELECT * FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('patients') AND name = 'DF_patients_estado')
    BEGIN
        DECLARE @addPatientsEstadoDefaultSql NVARCHAR(400);
        SET @addPatientsEstadoDefaultSql = N'ALTER TABLE patients ADD CONSTRAINT DF_patients_estado DEFAULT ''activo'' FOR estado';
        EXEC sp_executesql @addPatientsEstadoDefaultSql;
    END
    IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('patients') AND name = 'CK_patients_estado')
    BEGIN
        DECLARE @addPatientsEstadoCheckSql NVARCHAR(400);
        SET @addPatientsEstadoCheckSql = N'ALTER TABLE patients ADD CONSTRAINT CK_patients_estado CHECK (estado IN (''activo'', ''baja''))';
        EXEC sp_executesql @addPatientsEstadoCheckSql;
    END
END
GO

-- ============================================
-- TABLA MEDICATIONS
-- ============================================
PRINT 'Migrando tabla medications...';

-- expiration_date -> fecha_vencimiento
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'expiration_date')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'fecha_vencimiento')
BEGIN
    EXEC sp_rename 'medications.expiration_date', 'fecha_vencimiento', 'COLUMN';
    PRINT '  ✓ expiration_date -> fecha_vencimiento';
END
GO

-- quantity -> cantidad (si no existe)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'quantity')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'cantidad')
BEGIN
    EXEC sp_rename 'medications.quantity', 'cantidad', 'COLUMN';
    PRINT '  ✓ quantity -> cantidad';
END
GO

-- name -> nombre (si no existe)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'name')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'nombre')
BEGIN
    EXEC sp_rename 'medications.name', 'nombre', 'COLUMN';
    PRINT '  ✓ name -> nombre';
END
GO

-- ============================================
-- TABLA ENTRY_REQUESTS
-- ============================================
PRINT 'Migrando tabla entry_requests...';

-- status -> estado
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'status')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'estado')
BEGIN
    -- Eliminar TODOS los índices que usen la columna status
    DECLARE @indexName NVARCHAR(200);
    DECLARE @dropIndexSql NVARCHAR(400);
    
    DECLARE index_cursor CURSOR FOR
    SELECT name 
    FROM sys.indexes 
    WHERE object_id = OBJECT_ID('entry_requests')
      AND name IS NOT NULL
      AND name != '';
    
    OPEN index_cursor;
    FETCH NEXT FROM index_cursor INTO @indexName;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Verificar si el índice usa la columna status
        IF EXISTS (
            SELECT 1 
            FROM sys.index_columns ic
            INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
            WHERE ic.object_id = OBJECT_ID('entry_requests')
              AND ic.index_id = (SELECT index_id FROM sys.indexes WHERE object_id = OBJECT_ID('entry_requests') AND name = @indexName)
              AND c.name = 'status'
        )
        BEGIN
            SET @dropIndexSql = N'DROP INDEX [' + @indexName + N'] ON entry_requests';
            EXEC sp_executesql @dropIndexSql;
            PRINT '  Eliminado índice: ' + @indexName;
        END
        
        FETCH NEXT FROM index_cursor INTO @indexName;
    END
    
    CLOSE index_cursor;
    DEALLOCATE index_cursor;
    
    -- Eliminar cualquier constraint que dependa de status
    DECLARE @statusConstraintName NVARCHAR(200);
    SELECT TOP 1 @statusConstraintName = name 
    FROM sys.check_constraints 
    WHERE parent_object_id = OBJECT_ID('entry_requests') 
      AND (name LIKE '%status%' OR name LIKE '%estado%');
    
    IF @statusConstraintName IS NOT NULL
    BEGIN
        DECLARE @dropStatusConstraintSql NVARCHAR(400);
        SET @dropStatusConstraintSql = N'ALTER TABLE entry_requests DROP CONSTRAINT [' + @statusConstraintName + N']';
        EXEC sp_executesql @dropStatusConstraintSql;
        PRINT '  Eliminado constraint de status';
    END
    
    EXEC sp_rename 'entry_requests.status', 'estado', 'COLUMN';
    PRINT '  ✓ status -> estado';
    
    -- Recrear índice si es necesario
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_entry_requests_estado' AND object_id = OBJECT_ID('entry_requests'))
    BEGIN
        BEGIN TRY
            CREATE INDEX idx_entry_requests_estado ON entry_requests(estado);
            PRINT '  Recreado índice idx_entry_requests_estado';
        END TRY
        BEGIN CATCH
            -- Ignorar si falla
        END CATCH
    END
END
GO

-- type -> tipo
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'type')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'tipo')
BEGIN
    -- Eliminar constraint de type si existe
    IF EXISTS (SELECT * FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('entry_requests') AND name = 'CK_entry_requests_type')
    BEGIN
        ALTER TABLE entry_requests DROP CONSTRAINT CK_entry_requests_type;
    END
    
    EXEC sp_rename 'entry_requests.type', 'tipo', 'COLUMN';
    PRINT '  ✓ type -> tipo';
    
    -- Recrear constraint
    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('entry_requests') AND name = 'CK_entry_requests_tipo')
    BEGIN
        DECLARE @addEntryTipoCheckSql NVARCHAR(400);
        SET @addEntryTipoCheckSql = N'ALTER TABLE entry_requests ADD CONSTRAINT CK_entry_requests_tipo CHECK(tipo IN (''entrada'', ''salida''))';
        EXEC sp_executesql @addEntryTipoCheckSql;
    END
END
GO

-- patient_id -> paciente_id
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'patient_id')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id')
BEGIN
    -- Eliminar foreign key si existe
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('entry_requests') AND name = 'FK_entry_requests_patient')
    BEGIN
        ALTER TABLE entry_requests DROP CONSTRAINT FK_entry_requests_patient;
    END
    
    EXEC sp_rename 'entry_requests.patient_id', 'paciente_id', 'COLUMN';
    PRINT '  ✓ patient_id -> paciente_id';
    
    -- Recrear foreign key
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('entry_requests') AND name = 'FK_entry_requests_paciente')
    BEGIN
        ALTER TABLE entry_requests 
        ADD CONSTRAINT FK_entry_requests_paciente 
        FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE;
    END
END
GO

PRINT '';
PRINT '========================================';
PRINT 'MIGRACIÓN COMPLETADA';
PRINT '========================================';
PRINT 'Verifica que todas las columnas estén en español.';

