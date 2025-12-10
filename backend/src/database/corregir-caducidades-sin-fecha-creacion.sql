-- Script para corregir la tabla caducidades: quitar fecha_creacion y usar fecha_registro
-- La fecha de caducidad se obtiene del medicamento (no se guarda en esta tabla)

PRINT '========================================';
PRINT 'Corrigiendo tabla caducidades';
PRINT '========================================';

-- Eliminar fecha_creacion si existe
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_creacion')
BEGIN
    -- Eliminar índice primero
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_caducidades_fecha_creacion' AND object_id = OBJECT_ID('caducidades'))
    BEGIN
        DROP INDEX idx_caducidades_fecha_creacion ON caducidades;
        PRINT '✓ Índice fecha_creacion eliminado';
    END
    
    ALTER TABLE caducidades DROP COLUMN fecha_creacion;
    PRINT '✓ Columna fecha_creacion eliminada';
END
ELSE
BEGIN
    PRINT '✓ Columna fecha_creacion no existe (ya está eliminada)';
END
GO

-- Agregar fecha_registro si no existe
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro')
BEGIN
    ALTER TABLE caducidades ADD fecha_registro DATETIME2 DEFAULT GETDATE();
    PRINT '✓ Columna fecha_registro agregada';
    
    -- Si existe fecha_registro_caducidad, copiar valores
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro_caducidad')
    BEGIN
        UPDATE caducidades SET fecha_registro = fecha_registro_caducidad WHERE fecha_registro IS NULL;
        ALTER TABLE caducidades DROP COLUMN fecha_registro_caducidad;
        PRINT '✓ Valores copiados y columna fecha_registro_caducidad eliminada';
    END
    ELSE
    BEGIN
        UPDATE caducidades SET fecha_registro = GETDATE() WHERE fecha_registro IS NULL;
        PRINT '✓ Fecha actual asignada a registros existentes';
    END
END
ELSE
BEGIN
    PRINT '✓ Columna fecha_registro ya existe';
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

-- Crear índice de fecha_registro si no existe
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_caducidades_fecha_registro' AND object_id = OBJECT_ID('caducidades'))
BEGIN
    CREATE INDEX idx_caducidades_fecha_registro ON caducidades(fecha_registro);
    PRINT '✓ Índice fecha_registro creado';
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
PRINT 'La fecha de caducidad se obtiene del medicamento (medications.fecha_vencimiento)';
PRINT '========================================';


