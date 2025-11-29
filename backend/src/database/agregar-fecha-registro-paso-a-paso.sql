-- Script paso a paso para agregar fecha_registro
-- Ejecuta este script completo

-- PASO 1: Ver qué columnas tiene actualmente
PRINT '========================================';
PRINT 'PASO 1: Columnas actuales';
PRINT '========================================';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'caducidades'
ORDER BY ORDINAL_POSITION;
GO

-- PASO 2: Agregar la columna fecha_registro
PRINT '========================================';
PRINT 'PASO 2: Agregando columna fecha_registro';
PRINT '========================================';

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro')
BEGIN
    PRINT 'Agregando columna fecha_registro...';
    ALTER TABLE caducidades ADD fecha_registro DATETIME2 NULL;
    PRINT '✓ Columna agregada (NULL por ahora)';
END
ELSE
BEGIN
    PRINT '✓ Columna fecha_registro ya existe';
END
GO

-- PASO 3: Asignar valores a registros existentes
PRINT '========================================';
PRINT 'PASO 3: Asignando fechas a registros existentes';
PRINT '========================================';

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro')
BEGIN
    DECLARE @count INT;
    SELECT @count = COUNT(*) FROM caducidades WHERE fecha_registro IS NULL;
    
    IF @count > 0
    BEGIN
        UPDATE caducidades SET fecha_registro = GETDATE() WHERE fecha_registro IS NULL;
        PRINT '✓ ' + CAST(@count AS NVARCHAR(10)) + ' registros actualizados con fecha actual';
    END
    ELSE
    BEGIN
        PRINT '✓ Todos los registros ya tienen fecha';
    END
END
ELSE
BEGIN
    PRINT '✗ ERROR: La columna fecha_registro no existe';
END
GO

-- PASO 4: Hacer la columna NOT NULL y agregar default
PRINT '========================================';
PRINT 'PASO 4: Configurando NOT NULL y DEFAULT';
PRINT '========================================';

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro')
BEGIN
    -- Primero hacer NOT NULL
    ALTER TABLE caducidades ALTER COLUMN fecha_registro DATETIME2 NOT NULL;
    PRINT '✓ Columna configurada como NOT NULL';
    
    -- Agregar default constraint
    IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('caducidades') AND name = 'DF_caducidades_fecha_registro')
    BEGIN
        ALTER TABLE caducidades ADD CONSTRAINT DF_caducidades_fecha_registro DEFAULT GETDATE() FOR fecha_registro;
        PRINT '✓ Default constraint agregado';
    END
    ELSE
    BEGIN
        PRINT '✓ Default constraint ya existe';
    END
END
ELSE
BEGIN
    PRINT '✗ ERROR: La columna fecha_registro no existe';
END
GO

-- PASO 5: Crear índice
PRINT '========================================';
PRINT 'PASO 5: Creando índice';
PRINT '========================================';

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_caducidades_fecha_registro' AND object_id = OBJECT_ID('caducidades'))
    BEGIN
        CREATE INDEX idx_caducidades_fecha_registro ON caducidades(fecha_registro);
        PRINT '✓ Índice creado';
    END
    ELSE
    BEGIN
        PRINT '✓ Índice ya existe';
    END
END
ELSE
BEGIN
    PRINT '✗ ERROR: La columna fecha_registro no existe, no se puede crear índice';
END
GO

-- PASO 6: Verificar resultado final
PRINT '========================================';
PRINT 'PASO 6: Verificación final';
PRINT '========================================';

SELECT 
    COLUMN_NAME as 'Columna',
    DATA_TYPE as 'Tipo',
    IS_NULLABLE as 'NULL',
    COLUMN_DEFAULT as 'Default'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'caducidades'
ORDER BY ORDINAL_POSITION;

-- Verificar que fecha_registro existe
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro')
BEGIN
    PRINT '========================================';
    PRINT '✓ ÉXITO: Columna fecha_registro existe';
    PRINT '========================================';
END
ELSE
BEGIN
    PRINT '========================================';
    PRINT '✗ ERROR: Columna fecha_registro NO existe';
    PRINT '========================================';
END

