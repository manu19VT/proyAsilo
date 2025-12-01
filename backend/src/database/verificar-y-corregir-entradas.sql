-- ============================================================
-- SCRIPT PARA VERIFICAR Y CORREGIR LA TABLA ENTRADAS
-- ============================================================
-- Este script verifica que la tabla entradas NO tenga columna paciente_id
-- y la elimina si existe
-- ============================================================

USE db_ac1425_asilodb;
GO

PRINT '========================================';
PRINT 'VERIFICANDO ESTRUCTURA DE TABLA ENTRADAS';
PRINT '========================================';
GO

-- Verificar si existe la columna paciente_id en entradas
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'entradas' AND COLUMN_NAME = 'paciente_id')
BEGIN
    PRINT '⚠ ADVERTENCIA: La tabla entradas tiene columna paciente_id';
    PRINT '   Esta columna NO debería existir. Eliminándola...';
    
    -- Eliminar foreign keys relacionadas primero
    DECLARE @fkName NVARCHAR(200);
    DECLARE @dropFkSql NVARCHAR(500);
    
    DECLARE fk_cursor CURSOR FOR
    SELECT name 
    FROM sys.foreign_keys 
    WHERE parent_object_id = OBJECT_ID('entradas')
      AND referenced_object_id = OBJECT_ID('patients');
    
    OPEN fk_cursor;
    FETCH NEXT FROM fk_cursor INTO @fkName;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @dropFkSql = N'ALTER TABLE entradas DROP CONSTRAINT [' + @fkName + N']';
        EXEC sp_executesql @dropFkSql;
        PRINT '   ✓ Foreign key eliminada: ' + @fkName;
        FETCH NEXT FROM fk_cursor INTO @fkName;
    END;
    
    CLOSE fk_cursor;
    DEALLOCATE fk_cursor;
    
    -- Eliminar índices relacionados
    DECLARE @idxName NVARCHAR(200);
    DECLARE @dropIdxSql NVARCHAR(500);
    
    DECLARE idx_cursor CURSOR FOR
    SELECT name 
    FROM sys.indexes 
    WHERE object_id = OBJECT_ID('entradas')
      AND name LIKE '%paciente%';
    
    OPEN idx_cursor;
    FETCH NEXT FROM idx_cursor INTO @idxName;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @dropIdxSql = N'DROP INDEX [' + @idxName + N'] ON entradas';
        EXEC sp_executesql @dropIdxSql;
        PRINT '   ✓ Índice eliminado: ' + @idxName;
        FETCH NEXT FROM idx_cursor INTO @idxName;
    END;
    
    CLOSE idx_cursor;
    DEALLOCATE idx_cursor;
    
    -- Eliminar la columna
    BEGIN TRY
        ALTER TABLE entradas DROP COLUMN paciente_id;
        PRINT '   ✓ Columna paciente_id eliminada de entradas';
    END TRY
    BEGIN CATCH
        PRINT '   ✗ ERROR al eliminar columna:';
        PRINT '     ' + ERROR_MESSAGE();
    END CATCH
END
ELSE
BEGIN
    PRINT '✓ La tabla entradas NO tiene columna paciente_id (correcto)';
END
GO

-- Verificar estructura final
PRINT '';
PRINT '========================================';
PRINT 'ESTRUCTURA FINAL DE LA TABLA ENTRADAS';
PRINT '========================================';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'entradas'
ORDER BY ORDINAL_POSITION;
GO

PRINT '';
PRINT '========================================';
PRINT 'VERIFICACIÓN COMPLETADA';
PRINT '========================================';
PRINT 'La tabla entradas NO debe tener columna paciente_id';
PRINT '========================================';
GO

