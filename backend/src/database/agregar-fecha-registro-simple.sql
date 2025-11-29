-- Script simple para agregar fecha_registro a caducidades
-- Ejecuta este script si fecha_registro no existe

-- Verificar columnas actuales
PRINT 'Columnas actuales de caducidades:';
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'caducidades'
ORDER BY ORDINAL_POSITION;
GO

-- Agregar fecha_registro si no existe
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro')
BEGIN
    ALTER TABLE caducidades ADD fecha_registro DATETIME2 NULL;
    PRINT '✓ Columna fecha_registro agregada';
    
    -- Asignar fecha actual a todos los registros
    UPDATE caducidades SET fecha_registro = GETDATE();
    PRINT '✓ Fecha actual asignada a todos los registros';
    
    -- Hacer la columna NOT NULL con default
    ALTER TABLE caducidades ALTER COLUMN fecha_registro DATETIME2 NOT NULL;
    
    -- Agregar default constraint
    IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('caducidades') AND name = 'DF_caducidades_fecha_registro')
    BEGIN
        ALTER TABLE caducidades ADD CONSTRAINT DF_caducidades_fecha_registro DEFAULT GETDATE() FOR fecha_registro;
        PRINT '✓ Default constraint agregado';
    END
    
    -- Crear índice
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_caducidades_fecha_registro' AND object_id = OBJECT_ID('caducidades'))
    BEGIN
        CREATE INDEX idx_caducidades_fecha_registro ON caducidades(fecha_registro);
        PRINT '✓ Índice creado';
    END
END
ELSE
BEGIN
    PRINT '✓ Columna fecha_registro ya existe';
END
GO

-- Verificar estructura final
PRINT '========================================';
PRINT 'Estructura FINAL:';
PRINT '========================================';
SELECT 
    COLUMN_NAME as 'Columna',
    DATA_TYPE as 'Tipo',
    IS_NULLABLE as 'NULL',
    COLUMN_DEFAULT as 'Default'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'caducidades'
ORDER BY ORDINAL_POSITION;

