-- Script para agregar la columna eliminado (soft delete) a la tabla patients
-- Esta columna es necesaria para el filtrado de registros eliminados

USE db_ac1425_asilodb;
GO

-- Agregar columna eliminado si no existe
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'eliminado')
BEGIN
    ALTER TABLE patients ADD eliminado BIT DEFAULT 0 NOT NULL;
    PRINT 'Columna eliminado agregada a la tabla patients';
END
ELSE
BEGIN
    PRINT 'Columna eliminado ya existe en la tabla patients';
END
GO


-- Actualizar todos los registros existentes a eliminado = 0 (no eliminados)
UPDATE patients SET eliminado = 0 WHERE eliminado IS NULL;
GO

PRINT 'Script completado. La columna eliminado ha sido agregada.';
GO

