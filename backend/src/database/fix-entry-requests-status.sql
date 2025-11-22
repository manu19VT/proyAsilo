-- Script específico para migrar entry_requests.status -> estado
-- Ejecuta este script en SQL Server Management Studio

PRINT '========================================';
PRINT 'MIGRACIÓN: entry_requests.status -> estado';
PRINT '========================================';
PRINT '';

-- Verificar si necesita migración
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'status')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'estado')
BEGIN
    PRINT 'Paso 1: Eliminando índices que usan la columna status...';
    
    -- Eliminar índice idx_entry_requests_status si existe
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_entry_requests_status' AND object_id = OBJECT_ID('entry_requests'))
    BEGIN
        DROP INDEX idx_entry_requests_status ON entry_requests;
        PRINT '  ✓ Eliminado: idx_entry_requests_status';
    END
    
    -- Eliminar índice idx_entry_requests_estado si existe (por si acaso)
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_entry_requests_estado' AND object_id = OBJECT_ID('entry_requests'))
    BEGIN
        DROP INDEX idx_entry_requests_estado ON entry_requests;
        PRINT '  ✓ Eliminado: idx_entry_requests_estado';
    END
    
    -- Buscar y eliminar cualquier otro índice que use status
    DECLARE @sql NVARCHAR(MAX) = '';
    SELECT @sql = @sql + 'DROP INDEX [' + i.name + '] ON entry_requests; '
    FROM sys.indexes i
    INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE i.object_id = OBJECT_ID('entry_requests')
      AND c.name = 'status'
      AND i.name IS NOT NULL;
    
    IF @sql != ''
    BEGIN
        EXEC sp_executesql @sql;
        PRINT '  ✓ Eliminados índices adicionales';
    END
    
    PRINT '';
    PRINT 'Paso 2: Eliminando constraints que usan la columna status...';
    
    -- Eliminar todos los check constraints relacionados con status
    DECLARE @constraintName NVARCHAR(200);
    DECLARE constraint_cursor CURSOR FOR
    SELECT name 
    FROM sys.check_constraints 
    WHERE parent_object_id = OBJECT_ID('entry_requests');
    
    OPEN constraint_cursor;
    FETCH NEXT FROM constraint_cursor INTO @constraintName;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        DECLARE @dropConstraintSql NVARCHAR(400);
        SET @dropConstraintSql = N'ALTER TABLE entry_requests DROP CONSTRAINT [' + @constraintName + N']';
        BEGIN TRY
            EXEC sp_executesql @dropConstraintSql;
            PRINT '  ✓ Eliminado constraint: ' + @constraintName;
        END TRY
        BEGIN CATCH
            -- Ignorar errores
        END CATCH
        
        FETCH NEXT FROM constraint_cursor INTO @constraintName;
    END
    
    CLOSE constraint_cursor;
    DEALLOCATE constraint_cursor;
    
    PRINT '';
    PRINT 'Paso 3: Renombrando columna status -> estado...';
    
    BEGIN TRY
        EXEC sp_rename 'entry_requests.status', 'estado', 'COLUMN';
        PRINT '  ✓ status -> estado (renombrado exitosamente)';
    END TRY
    BEGIN CATCH
        PRINT '  ❌ Error al renombrar: ' + ERROR_MESSAGE();
        PRINT '  Intenta eliminar manualmente los índices y constraints antes de ejecutar este script.';
        RETURN;
    END CATCH
    
    PRINT '';
    PRINT 'Paso 4: Recreando índice...';
    
    -- Recrear índice con el nuevo nombre
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_entry_requests_estado' AND object_id = OBJECT_ID('entry_requests'))
    BEGIN
        BEGIN TRY
            CREATE INDEX idx_entry_requests_estado ON entry_requests(estado);
            PRINT '  ✓ Recreado índice: idx_entry_requests_estado';
        END TRY
        BEGIN CATCH
            PRINT '  ⚠️  No se pudo recrear el índice (puede ser normal)';
        END CATCH
    END
    
    PRINT '';
    PRINT '========================================';
    PRINT 'MIGRACIÓN COMPLETADA';
    PRINT '========================================';
END
ELSE IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'estado')
BEGIN
    PRINT '✓ La columna ya está migrada (estado existe)';
END
ELSE
BEGIN
    PRINT '⚠️  La columna status no existe en entry_requests';
END
GO

