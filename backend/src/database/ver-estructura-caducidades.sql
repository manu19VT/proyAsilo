-- Script para ver qué columnas tiene realmente la tabla caducidades

-- Ver todas las columnas de la tabla caducidades
SELECT 
    COLUMN_NAME as 'Columna',
    DATA_TYPE as 'Tipo de Dato',
    IS_NULLABLE as 'Permite NULL',
    COLUMN_DEFAULT as 'Valor por Defecto'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'caducidades'
ORDER BY ORDINAL_POSITION;

PRINT '========================================';
PRINT 'Columnas que tiene la tabla caducidades';
PRINT '========================================';


