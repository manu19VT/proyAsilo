-- Script para actualizar la tabla caducidades si ya existe
-- Ejecuta este script si ya ejecutaste la migración anteriormente

-- Verificar si la tabla existe
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[caducidades]') AND type in (N'U'))
BEGIN
    PRINT 'Actualizando tabla caducidades...';
    
    -- Agregar fecha_creacion si no existe
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_creacion')
    BEGIN
        ALTER TABLE caducidades ADD fecha_creacion DATETIME2 DEFAULT GETDATE();
        PRINT 'Columna fecha_creacion agregada';
        
        -- Si existe fecha_registro_caducidad, copiar sus valores
        IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro_caducidad')
        BEGIN
            UPDATE caducidades 
            SET fecha_creacion = fecha_registro_caducidad 
            WHERE fecha_creacion IS NULL;
            PRINT 'Valores de fecha_registro_caducidad copiados a fecha_creacion';
        END
        ELSE
        BEGIN
            -- Si no existe fecha_registro_caducidad, usar GETDATE()
            UPDATE caducidades 
            SET fecha_creacion = GETDATE() 
            WHERE fecha_creacion IS NULL;
            PRINT 'Fecha actual asignada a registros sin fecha';
        END
    END
    
    -- Eliminar columnas antiguas si existen
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_entrada_original')
    BEGIN
        ALTER TABLE caducidades DROP COLUMN fecha_entrada_original;
        PRINT 'Columna fecha_entrada_original eliminada';
    END
    
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro_caducidad')
    BEGIN
        ALTER TABLE caducidades DROP COLUMN fecha_registro_caducidad;
        PRINT 'Columna fecha_registro_caducidad eliminada';
    END
    
    -- Actualizar índices
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_caducidades_fecha_registro' AND object_id = OBJECT_ID('caducidades'))
    BEGIN
        DROP INDEX idx_caducidades_fecha_registro ON caducidades;
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_caducidades_fecha_creacion' AND object_id = OBJECT_ID('caducidades'))
    BEGIN
        CREATE INDEX idx_caducidades_fecha_creacion ON caducidades(fecha_creacion);
        PRINT 'Índice idx_caducidades_fecha_creacion creado';
    END
    
    PRINT 'Tabla caducidades actualizada correctamente';
END
ELSE
BEGIN
    PRINT 'La tabla caducidades no existe. Ejecuta primero el script de migración completo.';
END
GO

-- Verificar estructura final
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'caducidades'
ORDER BY ORDINAL_POSITION;

PRINT '========================================';
PRINT 'Actualización completada';
PRINT '========================================';




