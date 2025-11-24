-- Script para migrar patients.status -> estado
-- Ejecuta este script en SQL Server Management Studio

PRINT '========================================';
PRINT 'MIGRACIÓN: patients.status -> estado';
PRINT '========================================';
PRINT '';

-- Verificar si necesita migración
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'status')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'estado')
BEGIN
    PRINT 'Paso 1: Eliminando constraints que usan la columna status...';
    
    -- Eliminar check constraint si existe
    IF EXISTS (SELECT * FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('patients') AND name = 'CK_patients_status')
    BEGIN
        ALTER TABLE patients DROP CONSTRAINT CK_patients_status;
        PRINT '   Eliminado: CK_patients_status';
    END
    
    -- Eliminar default constraint si existe
    IF EXISTS (SELECT * FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('patients') AND name = 'DF_patients_status')
    BEGIN
        ALTER TABLE patients DROP CONSTRAINT DF_patients_status;
        PRINT '   Eliminado: DF_patients_status';
    END
    
    -- Buscar y eliminar cualquier otro constraint relacionado con status
    DECLARE @constraintName NVARCHAR(200);
    DECLARE constraint_cursor CURSOR FOR
    SELECT name 
    FROM sys.check_constraints 
    WHERE parent_object_id = OBJECT_ID('patients')
      AND (name LIKE '%status%' OR name LIKE '%estado%');
    
    OPEN constraint_cursor;
    FETCH NEXT FROM constraint_cursor INTO @constraintName;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        DECLARE @dropConstraintSql NVARCHAR(400);
        SET @dropConstraintSql = N'ALTER TABLE patients DROP CONSTRAINT [' + @constraintName + N']';
        BEGIN TRY
            EXEC sp_executesql @dropConstraintSql;
            PRINT '   Eliminado constraint: ' + @constraintName;
        END TRY
        BEGIN CATCH
            -- Ignorar errores
        END CATCH
        
        FETCH NEXT FROM constraint_cursor INTO @constraintName;
    END
    
    CLOSE constraint_cursor;
    DEALLOCATE constraint_cursor;
    
    -- Eliminar default constraints relacionados
    DECLARE @defaultConstraintName NVARCHAR(200);
    DECLARE default_cursor CURSOR FOR
    SELECT name 
    FROM sys.default_constraints 
    WHERE parent_object_id = OBJECT_ID('patients')
      AND (name LIKE '%status%' OR name LIKE '%estado%');
    
    OPEN default_cursor;
    FETCH NEXT FROM default_cursor INTO @defaultConstraintName;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        DECLARE @dropDefaultSql NVARCHAR(400);
        SET @dropDefaultSql = N'ALTER TABLE patients DROP CONSTRAINT [' + @defaultConstraintName + N']';
        BEGIN TRY
            EXEC sp_executesql @dropDefaultSql;
            PRINT '   Eliminado default constraint: ' + @defaultConstraintName;
        END TRY
        BEGIN CATCH
            -- Ignorar errores
        END CATCH
        
        FETCH NEXT FROM default_cursor INTO @defaultConstraintName;
    END
    
    CLOSE default_cursor;
    DEALLOCATE default_cursor;
    
    PRINT '';
    PRINT 'Paso 2: Renombrando columna status -> estado...';
    
    BEGIN TRY
        EXEC sp_rename 'patients.status', 'estado', 'COLUMN';
        PRINT '   status -> estado (renombrado exitosamente)';
    END TRY
    BEGIN CATCH
        PRINT '   Error al renombrar: ' + ERROR_MESSAGE();
        RETURN;
    END CATCH
    
    PRINT '';
    PRINT 'Paso 3: Recreando constraints...';
    
    -- Recrear default constraint
    IF NOT EXISTS (SELECT * FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('patients') AND name = 'DF_patients_estado')
    BEGIN
        BEGIN TRY
            DECLARE @addDefaultSql NVARCHAR(400);
            SET @addDefaultSql = N'ALTER TABLE patients ADD CONSTRAINT DF_patients_estado DEFAULT ''activo'' FOR estado';
            EXEC sp_executesql @addDefaultSql;
            PRINT '   Recreado default constraint: DF_patients_estado';
        END TRY
        BEGIN CATCH
            PRINT '    No se pudo recrear el default constraint';
        END CATCH
    END
    
    -- Recrear check constraint
    IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('patients') AND name = 'CK_patients_estado')
    BEGIN
        BEGIN TRY
            DECLARE @addCheckSql NVARCHAR(400);
            SET @addCheckSql = N'ALTER TABLE patients ADD CONSTRAINT CK_patients_estado CHECK (estado IN (''activo'', ''baja''))';
            EXEC sp_executesql @addCheckSql;
            PRINT '   Recreado check constraint: CK_patients_estado';
        END TRY
        BEGIN CATCH
            PRINT '    No se pudo recrear el check constraint';
        END CATCH
    END
    
    PRINT '';
    PRINT '========================================';
    PRINT 'MIGRACIÓN COMPLETADA';
    PRINT '========================================';
END
ELSE IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'estado')
BEGIN
    PRINT ' La columna ya está migrada (estado existe)';
END
ELSE
BEGIN
    PRINT '  La columna status no existe en patients';
END
GO

