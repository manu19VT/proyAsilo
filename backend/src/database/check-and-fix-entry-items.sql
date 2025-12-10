-- Script para verificar y agregar las columnas nombre_medicamento y unidad a entry_items
-- Ejecutar este script en SQL Server Management Studio

PRINT 'Verificando columnas en entry_items...';

-- Verificar si existe la columna nombre_medicamento
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'nombre_medicamento')
BEGIN
    PRINT 'Agregando columna nombre_medicamento...';
    ALTER TABLE entry_items ADD nombre_medicamento NVARCHAR(255) NULL;
    PRINT '✓ Columna nombre_medicamento agregada';
END
ELSE
BEGIN
    PRINT '✓ Columna nombre_medicamento ya existe';
END
GO

-- Verificar si existe la columna unidad
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'unidad')
BEGIN
    PRINT 'Agregando columna unidad...';
    ALTER TABLE entry_items ADD unidad NVARCHAR(50) NULL;
    PRINT '✓ Columna unidad agregada';
END
ELSE
BEGIN
    PRINT '✓ Columna unidad ya existe';
END
GO

-- Verificar estructura actual
PRINT '';
PRINT 'Estructura actual de entry_items:';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'entry_items'
ORDER BY ORDINAL_POSITION;
GO

PRINT '';
PRINT '✓ Verificación completada. Las columnas nombre_medicamento y unidad están listas.';
GO

