-- ============================================================
-- SCRIPT PARA CORREGIR LA TABLA ENTRADAS EN BASE DE DATOS REMOTA
-- ============================================================
-- Este script asegura que la tabla entradas NO tenga columna paciente_id
-- y que tenga la estructura correcta
-- ============================================================

USE db_ac1425_asilodb;
GO

PRINT '========================================';
PRINT 'CORRIGIENDO ESTRUCTURA DE TABLA ENTRADAS';
PRINT '========================================';
GO

-- PASO 1: Verificar si existe la columna paciente_id
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'entradas' AND COLUMN_NAME = 'paciente_id')
BEGIN
    PRINT '⚠ La tabla entradas tiene columna paciente_id (NO debería tenerla)';
    PRINT '   Eliminando columna paciente_id...';
    
    -- Eliminar foreign keys relacionadas
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
        BEGIN TRY
            EXEC sp_executesql @dropFkSql;
            PRINT '   ✓ Foreign key eliminada: ' + @fkName;
        END TRY
        BEGIN CATCH
            PRINT '   ⚠ No se pudo eliminar FK: ' + @fkName + ' - ' + ERROR_MESSAGE();
        END CATCH
        FETCH NEXT FROM fk_cursor INTO @fkName;
    END;
    
    CLOSE fk_cursor;
    DEALLOCATE fk_cursor;
    
    -- Eliminar índices relacionados con paciente_id
    DECLARE @idxName NVARCHAR(200);
    DECLARE @dropIdxSql NVARCHAR(500);
    
    DECLARE idx_cursor CURSOR FOR
    SELECT i.name 
    FROM sys.indexes i
    INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE i.object_id = OBJECT_ID('entradas')
      AND c.name = 'paciente_id';
    
    OPEN idx_cursor;
    FETCH NEXT FROM idx_cursor INTO @idxName;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @dropIdxSql = N'DROP INDEX [' + @idxName + N'] ON entradas';
        BEGIN TRY
            EXEC sp_executesql @dropIdxSql;
            PRINT '   ✓ Índice eliminado: ' + @idxName;
        END TRY
        BEGIN CATCH
            PRINT '   ⚠ No se pudo eliminar índice: ' + @idxName + ' - ' + ERROR_MESSAGE();
        END CATCH
        FETCH NEXT FROM idx_cursor INTO @idxName;
    END;
    
    CLOSE idx_cursor;
    DEALLOCATE idx_cursor;
    
    -- Eliminar la columna paciente_id
    BEGIN TRY
        ALTER TABLE entradas DROP COLUMN paciente_id;
        PRINT '   ✓ Columna paciente_id eliminada exitosamente';
    END TRY
    BEGIN CATCH
        PRINT '   ✗ ERROR al eliminar columna paciente_id:';
        PRINT '     ' + ERROR_MESSAGE();
        PRINT '';
        PRINT '   Intentando eliminar constraints adicionales...';
        
        -- Intentar eliminar default constraints
        DECLARE @defName NVARCHAR(200);
        DECLARE @dropDefSql NVARCHAR(500);
        
        DECLARE def_cursor CURSOR FOR
        SELECT name 
        FROM sys.default_constraints 
        WHERE parent_object_id = OBJECT_ID('entradas')
          AND parent_column_id = (SELECT column_id FROM sys.columns 
                                   WHERE object_id = OBJECT_ID('entradas') 
                                     AND name = 'paciente_id');
        
        OPEN def_cursor;
        FETCH NEXT FROM def_cursor INTO @defName;
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            SET @dropDefSql = N'ALTER TABLE entradas DROP CONSTRAINT [' + @defName + N']';
            BEGIN TRY
                EXEC sp_executesql @dropDefSql;
                PRINT '     ✓ Default constraint eliminado: ' + @defName;
            END TRY
            BEGIN CATCH
                PRINT '     ⚠ No se pudo eliminar: ' + @defName;
            END CATCH
            FETCH NEXT FROM def_cursor INTO @defName;
        END;
        
        CLOSE def_cursor;
        DEALLOCATE def_cursor;
        
        -- Intentar eliminar la columna nuevamente
        BEGIN TRY
            ALTER TABLE entradas DROP COLUMN paciente_id;
            PRINT '   ✓ Columna paciente_id eliminada en segundo intento';
        END TRY
        BEGIN CATCH
            PRINT '   ✗ ERROR PERSISTENTE: No se pudo eliminar la columna';
            PRINT '     ' + ERROR_MESSAGE();
            PRINT '';
            PRINT '   Por favor, verifica manualmente la estructura de la tabla.';
        END CATCH
    END CATCH
END
ELSE
BEGIN
    PRINT '✓ La tabla entradas NO tiene columna paciente_id (correcto)';
END
GO

-- PASO 2: Verificar estructura final
PRINT '';
PRINT '========================================';
PRINT 'ESTRUCTURA FINAL DE LA TABLA ENTRADAS';
PRINT '========================================';
SELECT 
    COLUMN_NAME as 'Columna',
    DATA_TYPE as 'Tipo',
    IS_NULLABLE as 'Permite NULL',
    COLUMN_DEFAULT as 'Valor por defecto'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'entradas'
ORDER BY ORDINAL_POSITION;
GO

-- PASO 3: Verificar que NO haya restricciones relacionadas con paciente
PRINT '';
PRINT '========================================';
PRINT 'VERIFICANDO RESTRICCIONES';
PRINT '========================================';
IF EXISTS (SELECT * FROM sys.foreign_keys 
           WHERE parent_object_id = OBJECT_ID('entradas')
             AND referenced_object_id = OBJECT_ID('patients'))
BEGIN
    PRINT '⚠ ADVERTENCIA: Aún existen foreign keys relacionadas con patients';
    SELECT name as 'Foreign Key' FROM sys.foreign_keys 
    WHERE parent_object_id = OBJECT_ID('entradas')
      AND referenced_object_id = OBJECT_ID('patients');
END
ELSE
BEGIN
    PRINT '✓ No hay foreign keys relacionadas con patients en entradas';
END
GO

PRINT '';
PRINT '========================================';
PRINT 'CORRECCIÓN COMPLETADA';
PRINT '========================================';
PRINT 'La tabla entradas debe tener solo estas columnas:';
PRINT '  - id';
PRINT '  - folio';
PRINT '  - fecha_creacion';
PRINT '  - estado';
PRINT '  - comentario';
PRINT '  - creado_por';
PRINT '';
PRINT 'NO debe tener columna paciente_id';
PRINT '========================================';
GO



