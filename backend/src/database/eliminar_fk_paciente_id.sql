-- ============================================
-- SCRIPT PARA ELIMINAR FK DE paciente_id Y PERMITIR NULL
-- ============================================
-- Esta es la solución más simple: eliminar la FK y permitir NULL
-- ============================================

USE db_ac1425_asilodb;
GO

PRINT '========================================';
PRINT 'ELIMINANDO FK DE paciente_id';
PRINT '========================================';
GO

-- PASO 1: Eliminar TODAS las foreign keys relacionadas con paciente_id
PRINT '';
PRINT 'PASO 1: Eliminando foreign keys...';

DECLARE @fkName NVARCHAR(200);
DECLARE @dropFkSql NVARCHAR(500);

-- Buscar todas las FKs que relacionan entry_requests con patients
DECLARE fk_cursor CURSOR FOR
SELECT name 
FROM sys.foreign_keys 
WHERE parent_object_id = OBJECT_ID('entry_requests')
  AND referenced_object_id = OBJECT_ID('patients');

OPEN fk_cursor;
FETCH NEXT FROM fk_cursor INTO @fkName;

IF @@FETCH_STATUS = 0
BEGIN
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @dropFkSql = N'ALTER TABLE entry_requests DROP CONSTRAINT [' + @fkName + N']';
        BEGIN TRY
            EXEC sp_executesql @dropFkSql;
            PRINT '✓ Foreign key eliminada: ' + @fkName;
        END TRY
        BEGIN CATCH
            PRINT '✗ Error al eliminar ' + @fkName + ': ' + ERROR_MESSAGE();
        END CATCH
        FETCH NEXT FROM fk_cursor INTO @fkName;
    END
END
ELSE
BEGIN
    PRINT 'No se encontraron foreign keys para eliminar.';
END

CLOSE fk_cursor;
DEALLOCATE fk_cursor;
GO

-- PASO 2: Actualizar registros existentes de entrada a NULL
PRINT '';
PRINT 'PASO 2: Actualizando registros existentes...';
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id')
BEGIN
    DECLARE @updatedRows INT;
    UPDATE entry_requests 
    SET paciente_id = NULL 
    WHERE tipo = 'entrada' AND paciente_id IS NOT NULL;
    
    SET @updatedRows = @@ROWCOUNT;
    IF @updatedRows > 0
    BEGIN
        PRINT '✓ Registros actualizados: ' + CAST(@updatedRows AS VARCHAR(10));
    END
    ELSE
    BEGIN
        PRINT 'No había registros para actualizar.';
    END
END
GO

-- PASO 3: Modificar la columna para permitir NULL
PRINT '';
PRINT 'PASO 3: Modificando columna para permitir NULL...';
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id')
BEGIN
    BEGIN TRY
        ALTER TABLE entry_requests ALTER COLUMN paciente_id NVARCHAR(36) NULL;
        PRINT '✓ Columna paciente_id ahora permite NULL.';
    END TRY
    BEGIN CATCH
        PRINT '✗ ERROR: ' + ERROR_MESSAGE();
        THROW;
    END CATCH
END
ELSE
BEGIN
    PRINT '✗ ERROR: La columna paciente_id no existe.';
END
GO

-- PASO 4: Verificación final
PRINT '';
PRINT 'PASO 4: Verificación final...';
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id')
BEGIN
    DECLARE @isNullable VARCHAR(3);
    SELECT @isNullable = IS_NULLABLE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id';
    
    IF @isNullable = 'YES'
    BEGIN
        PRINT '✓ VERIFICACIÓN EXITOSA: paciente_id permite NULL.';
    END
    ELSE
    BEGIN
        PRINT '✗ ERROR: paciente_id AÚN NO permite NULL.';
    END
    
    -- Verificar que no hay FK
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys 
                   WHERE parent_object_id = OBJECT_ID('entry_requests') 
                     AND referenced_object_id = OBJECT_ID('patients'))
    BEGIN
        PRINT '✓ VERIFICACIÓN EXITOSA: No hay foreign key a patients.';
    END
    ELSE
    BEGIN
        PRINT '⚠ ADVERTENCIA: Aún existe una foreign key a patients.';
    END
END
GO

PRINT '';
PRINT '========================================';
PRINT 'SCRIPT COMPLETADO';
PRINT '========================================';
PRINT 'Ahora:';
PRINT '- paciente_id puede ser NULL (para entradas)';
PRINT '- No hay foreign key, así que no requiere validación';
PRINT '- Las salidas y caducidad pueden seguir usando paciente_id';
PRINT '========================================';
GO




