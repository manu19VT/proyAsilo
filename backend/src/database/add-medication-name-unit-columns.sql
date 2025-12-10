-- Script para agregar las columnas nombre_medicamento y unidad a la tabla entry_items
-- Ejecutar este script en SQL Server Management Studio o en tu herramienta de base de datos

-- Agregar columna nombre_medicamento si no existe
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'nombre_medicamento')
BEGIN
    ALTER TABLE entry_items ADD nombre_medicamento NVARCHAR(255) NULL;
    PRINT '✓ Columna nombre_medicamento agregada a entry_items';
END
ELSE
BEGIN
    PRINT 'Columna nombre_medicamento ya existe en entry_items';
END
GO

-- Agregar columna unidad si no existe
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'unidad')
BEGIN
    ALTER TABLE entry_items ADD unidad NVARCHAR(50) NULL;
    PRINT '✓ Columna unidad agregada a entry_items';
END
ELSE
BEGIN
    PRINT 'Columna unidad ya existe en entry_items';
END
GO

PRINT 'Migración completada. Las columnas nombre_medicamento y unidad han sido agregadas a entry_items.';
GO


