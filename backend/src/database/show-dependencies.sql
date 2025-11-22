-- Script para mostrar todas las dependencias de entry_requests.status
-- Ejecuta este script primero para ver qué está bloqueando la migración

PRINT '========================================';
PRINT 'DEPENDENCIAS DE entry_requests.status';
PRINT '========================================';
PRINT '';

-- Verificar si la columna existe
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'status')
BEGIN
    PRINT '✓ La columna status existe';
    PRINT '';
    
    -- Mostrar todos los índices que usan status
    PRINT '--- ÍNDICES que usan la columna status ---';
    SELECT 
        i.name AS index_name,
        i.type_desc AS index_type,
        STRING_AGG(c.name, ', ') AS columns
    FROM sys.indexes i
    INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE i.object_id = OBJECT_ID('entry_requests')
      AND c.name = 'status'
      AND i.name IS NOT NULL
    GROUP BY i.name, i.type_desc;
    
    IF @@ROWCOUNT = 0
        PRINT '  No se encontraron índices';
    PRINT '';
    
    -- Mostrar todos los constraints
    PRINT '--- CONSTRAINTS en entry_requests ---';
    SELECT 
        name AS constraint_name,
        type_desc AS constraint_type,
        definition
    FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID('entry_requests');
    
    IF @@ROWCOUNT = 0
        PRINT '  No se encontraron check constraints';
    PRINT '';
    
    -- Mostrar foreign keys
    PRINT '--- FOREIGN KEYS en entry_requests ---';
    SELECT 
        fk.name AS foreign_key_name,
        OBJECT_NAME(fk.parent_object_id) AS table_name,
        COL_NAME(fc.parent_object_id, fc.parent_column_id) AS column_name,
        OBJECT_NAME(fk.referenced_object_id) AS referenced_table,
        COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS referenced_column
    FROM sys.foreign_keys fk
    INNER JOIN sys.foreign_key_columns fc ON fk.object_id = fc.constraint_object_id
    WHERE fk.parent_object_id = OBJECT_ID('entry_requests');
    
    IF @@ROWCOUNT = 0
        PRINT '  No se encontraron foreign keys';
    PRINT '';
    
    -- Mostrar default constraints
    PRINT '--- DEFAULT CONSTRAINTS en entry_requests ---';
    SELECT 
        dc.name AS constraint_name,
        COL_NAME(dc.parent_object_id, dc.parent_column_id) AS column_name,
        dc.definition
    FROM sys.default_constraints dc
    WHERE dc.parent_object_id = OBJECT_ID('entry_requests')
      AND COL_NAME(dc.parent_object_id, dc.parent_column_id) = 'status';
    
    IF @@ROWCOUNT = 0
        PRINT '  No se encontraron default constraints en status';
    PRINT '';
    
    PRINT '========================================';
    PRINT 'Para eliminar estas dependencias, ejecuta:';
    PRINT 'fix-entry-requests-status.sql';
    PRINT '========================================';
END
ELSE
BEGIN
    PRINT '⚠️  La columna status no existe en entry_requests';
    PRINT '   (Puede que ya esté migrada a estado)';
END
GO

