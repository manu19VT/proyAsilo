-- Script para verificar qué columnas tiene la tabla entry_requests
-- Ejecuta este script primero para ver qué columnas existen

SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'entry_requests'
ORDER BY ORDINAL_POSITION;

-- Verificar específicamente las columnas de fecha
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'fecha_creacion')
        THEN '✓ Existe: fecha_creacion'
        ELSE '✗ No existe: fecha_creacion'
    END as estado_fecha_creacion
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'created_at')
        THEN '✓ Existe: created_at'
        ELSE '✗ No existe: created_at'
    END as estado_created_at;


