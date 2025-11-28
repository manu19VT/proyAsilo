-- Script para agregar la columna eliminado (soft delete) a la tabla personal_objects
-- Esta columna es necesaria para el filtrado de registros eliminados

USE db_ac1425_asilodb;
GO

-- Agregar columna eliminado si no existe
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'personal_objects' AND COLUMN_NAME = 'eliminado')
BEGIN
    ALTER TABLE personal_objects ADD eliminado BIT DEFAULT 0 NOT NULL;
    PRINT 'Columna eliminado agregada a la tabla personal_objects';
END
ELSE
BEGIN
    PRINT 'Columna eliminado ya existe en la tabla personal_objects';
END
GO

-- Agregar columna fecha_eliminacion si no existe
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'personal_objects' AND COLUMN_NAME = 'fecha_eliminacion')
BEGIN
    ALTER TABLE personal_objects ADD fecha_eliminacion DATETIME2 NULL;
    PRINT 'Columna fecha_eliminacion agregada a la tabla personal_objects';
END
ELSE
BEGIN
    PRINT 'Columna fecha_eliminacion ya existe en la tabla personal_objects';
END
GO

-- Actualizar todos los registros existentes a eliminado = 0 (no eliminados)
UPDATE personal_objects SET eliminado = 0 WHERE eliminado IS NULL;
GO

-- Crear índice para mejorar rendimiento de consultas
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_personal_objects_eliminado' AND object_id = OBJECT_ID('personal_objects'))
BEGIN
    CREATE INDEX idx_personal_objects_eliminado ON personal_objects(eliminado, fecha_eliminacion);
    PRINT 'Índice idx_personal_objects_eliminado creado';
END
GO

PRINT 'Script completado. La columna eliminado ha sido agregada a personal_objects.';
GO

