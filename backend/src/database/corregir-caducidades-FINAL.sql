-- Script FINAL para corregir la tabla caducidades
-- Maneja constraints y elimina/agrega columnas correctamente

PRINT '========================================';
PRINT 'Corrigiendo tabla caducidades';
PRINT '========================================';

-- Primero ver qué columnas tiene actualmente
PRINT 'Columnas actuales:';
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'caducidades'
ORDER BY ORDINAL_POSITION;
GO

-- Paso 1: Eliminar fecha_creacion si existe
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_creacion')
BEGIN
    -- Eliminar índice primero
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_caducidades_fecha_creacion' AND object_id = OBJECT_ID('caducidades'))
    BEGIN
        DROP INDEX idx_caducidades_fecha_creacion ON caducidades;
    END
    
    ALTER TABLE caducidades DROP COLUMN fecha_creacion;
    PRINT '✓ Columna fecha_creacion eliminada';
END
ELSE
BEGIN
    PRINT '✓ Columna fecha_creacion no existe';
END
GO

-- Paso 2: Eliminar fecha_entrada_original si existe
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_entrada_original')
BEGIN
    ALTER TABLE caducidades DROP COLUMN fecha_entrada_original;
    PRINT '✓ Columna fecha_entrada_original eliminada';
END
ELSE
BEGIN
    PRINT '✓ Columna fecha_entrada_original no existe';
END
GO

-- Paso 3: Manejar fecha_registro_caducidad (eliminar constraint primero)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro_caducidad')
BEGIN
    -- Buscar y eliminar constraints/defaults asociados
    DECLARE @constraintName NVARCHAR(200);
    
    -- Buscar default constraint
    SELECT TOP 1 @constraintName = name
    FROM sys.default_constraints
    WHERE parent_object_id = OBJECT_ID('caducidades')
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('caducidades') AND name = 'fecha_registro_caducidad');
    
    IF @constraintName IS NOT NULL
    BEGIN
        DECLARE @dropConstraintSql NVARCHAR(MAX);
        SET @dropConstraintSql = N'ALTER TABLE caducidades DROP CONSTRAINT [' + @constraintName + N']';
        EXEC sp_executesql @dropConstraintSql;
        PRINT '✓ Constraint eliminado: ' + @constraintName;
    END
    
    -- Ahora eliminar la columna
    ALTER TABLE caducidades DROP COLUMN fecha_registro_caducidad;
    PRINT '✓ Columna fecha_registro_caducidad eliminada';
END
ELSE
BEGIN
    PRINT '✓ Columna fecha_registro_caducidad no existe';
END
GO

-- Paso 4: Agregar fecha_registro si no existe
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro')
BEGIN
    ALTER TABLE caducidades ADD fecha_registro DATETIME2 NULL;
    PRINT '✓ Columna fecha_registro agregada (sin default primero)';
    
    -- Asignar fecha actual a registros existentes
    UPDATE caducidades SET fecha_registro = GETDATE() WHERE fecha_registro IS NULL;
    PRINT '✓ Fecha actual asignada a registros existentes';
    
    -- Agregar default después
    ALTER TABLE caducidades ALTER COLUMN fecha_registro DATETIME2 NOT NULL;
    ALTER TABLE caducidades ADD CONSTRAINT DF_caducidades_fecha_registro DEFAULT GETDATE() FOR fecha_registro;
    PRINT '✓ Default agregado a fecha_registro';
END
ELSE
BEGIN
    PRINT '✓ Columna fecha_registro ya existe';
END
GO

-- Paso 5: Crear/actualizar índices
-- Eliminar índices antiguos si existen
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_caducidades_fecha_creacion' AND object_id = OBJECT_ID('caducidades'))
BEGIN
    DROP INDEX idx_caducidades_fecha_creacion ON caducidades;
    PRINT '✓ Índice fecha_creacion eliminado';
END

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_caducidades_fecha_registro' AND object_id = OBJECT_ID('caducidades'))
BEGIN
    DROP INDEX idx_caducidades_fecha_registro ON caducidades;
    PRINT '✓ Índice fecha_registro antiguo eliminado';
END

-- Crear índice de fecha_registro solo si la columna existe
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_caducidades_fecha_registro' AND object_id = OBJECT_ID('caducidades'))
    BEGIN
        CREATE INDEX idx_caducidades_fecha_registro ON caducidades(fecha_registro);
        PRINT '✓ Índice fecha_registro creado';
    END
    ELSE
    BEGIN
        PRINT '✓ Índice fecha_registro ya existe';
    END
END
ELSE
BEGIN
    PRINT '✗ ERROR: Columna fecha_registro no existe, no se puede crear índice';
END
GO

-- Verificar estructura final
PRINT '========================================';
PRINT 'Estructura FINAL de caducidades:';
PRINT '========================================';
SELECT 
    COLUMN_NAME as 'Columna',
    DATA_TYPE as 'Tipo',
    IS_NULLABLE as 'NULL',
    COLUMN_DEFAULT as 'Default'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'caducidades'
ORDER BY ORDINAL_POSITION;

PRINT '========================================';
PRINT 'Corrección completada';
PRINT 'La fecha de caducidad se obtiene del medicamento';
PRINT '========================================';

