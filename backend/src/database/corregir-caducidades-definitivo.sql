-- Script definitivo para corregir la tabla caducidades
-- Ejecuta este script para agregar fecha_creacion y eliminar columnas antiguas

-- Verificar qué columnas tiene actualmente
PRINT 'Columnas actuales de caducidades:';
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'caducidades'
ORDER BY ORDINAL_POSITION;
GO

-- Agregar fecha_creacion si no existe
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_creacion')
BEGIN
    ALTER TABLE caducidades ADD fecha_creacion DATETIME2 DEFAULT GETDATE();
    PRINT '✓ Columna fecha_creacion agregada';
    
    -- Si existe fecha_registro_caducidad, copiar valores
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro_caducidad')
    BEGIN
        EXEC sp_executesql N'UPDATE caducidades SET fecha_creacion = fecha_registro_caducidad WHERE fecha_creacion IS NULL';
        PRINT '✓ Valores copiados de fecha_registro_caducidad';
    END
    -- Si no existe fecha_registro_caducidad, usar GETDATE() para registros existentes
    ELSE
    BEGIN
        UPDATE caducidades SET fecha_creacion = GETDATE() WHERE fecha_creacion IS NULL;
        PRINT '✓ Fecha actual asignada a registros existentes';
    END
END
ELSE
BEGIN
    PRINT '✓ Columna fecha_creacion ya existe';
END
GO

-- Eliminar columnas antiguas si existen
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_entrada_original')
BEGIN
    ALTER TABLE caducidades DROP COLUMN fecha_entrada_original;
    PRINT '✓ Columna fecha_entrada_original eliminada';
END

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro_caducidad')
BEGIN
    ALTER TABLE caducidades DROP COLUMN fecha_registro_caducidad;
    PRINT '✓ Columna fecha_registro_caducidad eliminada';
END
GO

-- Actualizar índices
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_caducidades_fecha_registro' AND object_id = OBJECT_ID('caducidades'))
BEGIN
    DROP INDEX idx_caducidades_fecha_registro ON caducidades;
    PRINT '✓ Índice antiguo eliminado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_caducidades_fecha_creacion' AND object_id = OBJECT_ID('caducidades'))
BEGIN
    CREATE INDEX idx_caducidades_fecha_creacion ON caducidades(fecha_creacion);
    PRINT '✓ Índice fecha_creacion creado';
END
GO

-- Verificar estructura final
PRINT '========================================';
PRINT 'Estructura final de caducidades:';
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
PRINT '========================================';


