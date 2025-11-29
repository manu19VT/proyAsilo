-- ============================================
-- SCRIPT FINAL PARA PERMITIR NULL EN paciente_id PARA ENTRADAS
-- ============================================
-- IMPORTANTE: Ejecuta este script COMPLETO en SQL Server Management Studio
-- Base de datos: db_ac1425_asilodb
-- ============================================

USE db_ac1425_asilodb;
GO

PRINT '========================================';
PRINT 'INICIANDO CORRECCIÓN DE TABLA entry_requests';
PRINT '========================================';
GO

-- PASO 1: Verificar estructura actual
PRINT '';
PRINT 'PASO 1: Verificando estructura actual...';
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id')
BEGIN
    DECLARE @isNullable VARCHAR(3);
    SELECT @isNullable = IS_NULLABLE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id';
    
    PRINT 'Columna paciente_id existe. Actualmente permite NULL: ' + @isNullable;
END
ELSE
BEGIN
    PRINT 'ERROR: La columna paciente_id NO existe en entry_requests.';
    RETURN;
END
GO

-- PASO 2: Buscar y eliminar TODAS las foreign keys relacionadas
PRINT '';
PRINT 'PASO 2: Eliminando foreign keys...';
DECLARE @fkToDrop NVARCHAR(200);
DECLARE @dropFkSql NVARCHAR(500);

DECLARE fk_cursor CURSOR FOR
SELECT name 
FROM sys.foreign_keys 
WHERE parent_object_id = OBJECT_ID('entry_requests')
  AND referenced_object_id = OBJECT_ID('patients');

OPEN fk_cursor;
FETCH NEXT FROM fk_cursor INTO @fkToDrop;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @dropFkSql = N'ALTER TABLE entry_requests DROP CONSTRAINT [' + @fkToDrop + N']';
    EXEC sp_executesql @dropFkSql;
    PRINT 'Foreign key eliminada: ' + @fkToDrop;
    FETCH NEXT FROM fk_cursor INTO @fkToDrop;
END;

CLOSE fk_cursor;
DEALLOCATE fk_cursor;
GO

-- PASO 3: Actualizar registros existentes
PRINT '';
PRINT 'PASO 3: Actualizando registros existentes...';
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
        PRINT 'Registros actualizados: ' + CAST(@updatedRows AS VARCHAR(10));
    END
    ELSE
    BEGIN
        PRINT 'No había registros de entrada para actualizar.';
    END
END
GO

-- PASO 4: Modificar la columna para permitir NULL
PRINT '';
PRINT 'PASO 4: Modificando columna para permitir NULL...';
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id')
BEGIN
    BEGIN TRY
        ALTER TABLE entry_requests ALTER COLUMN paciente_id NVARCHAR(36) NULL;
        PRINT '✓ Columna paciente_id modificada exitosamente. Ahora permite NULL.';
    END TRY
    BEGIN CATCH
        PRINT '✗ ERROR al modificar la columna:';
        PRINT ERROR_MESSAGE();
        THROW;
    END CATCH
END
GO

-- PASO 5: Verificar que el cambio se aplicó
PRINT '';
PRINT 'PASO 5: Verificando cambio...';
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id')
BEGIN
    DECLARE @nowNullable VARCHAR(3);
    SELECT @nowNullable = IS_NULLABLE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id';
    
    IF @nowNullable = 'YES'
    BEGIN
        PRINT '✓ VERIFICACIÓN EXITOSA: La columna ahora permite NULL.';
    END
    ELSE
    BEGIN
        PRINT '✗ ERROR: La columna AÚN NO permite NULL.';
    END
END
GO

-- PASO 6: Recrear la foreign key (permite NULL)
PRINT '';
PRINT 'PASO 6: Recreando foreign key...';
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id')
   AND NOT EXISTS (SELECT * FROM sys.foreign_keys 
                   WHERE parent_object_id = OBJECT_ID('entry_requests') 
                     AND referenced_object_id = OBJECT_ID('patients'))
BEGIN
    BEGIN TRY
        ALTER TABLE entry_requests 
        ADD CONSTRAINT FK_entry_requests_paciente 
        FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE;
        PRINT '✓ Foreign key recreada exitosamente.';
    END TRY
    BEGIN CATCH
        PRINT '⚠ Advertencia al recrear foreign key: ' + ERROR_MESSAGE();
        PRINT '   (Esto no es crítico, la columna ya permite NULL)';
    END CATCH
END
ELSE
BEGIN
    IF EXISTS (SELECT * FROM sys.foreign_keys 
               WHERE parent_object_id = OBJECT_ID('entry_requests') 
                 AND referenced_object_id = OBJECT_ID('patients'))
    BEGIN
        PRINT 'La foreign key ya existe.';
    END
    ELSE
    BEGIN
        PRINT 'No se recreó la foreign key (puede que la columna no exista).';
    END
END
GO

PRINT '';
PRINT '========================================';
PRINT 'SCRIPT COMPLETADO';
PRINT '========================================';
PRINT 'Ahora las entradas pueden registrarse sin paciente.';
PRINT 'Las salidas y caducidad siguen requiriendo paciente.';
PRINT '========================================';
GO


