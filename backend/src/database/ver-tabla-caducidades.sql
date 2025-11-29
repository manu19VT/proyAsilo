-- Script para ver la tabla de caducidades

-- 1. Ver la estructura de la tabla (columnas)
SELECT 
    COLUMN_NAME as 'Columna',
    DATA_TYPE as 'Tipo de Dato',
    IS_NULLABLE as 'Permite NULL',
    COLUMN_DEFAULT as 'Valor por Defecto'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'caducidades'
ORDER BY ORDINAL_POSITION;

PRINT '========================================';
PRINT 'Estructura de la tabla caducidades';
PRINT '========================================';
GO

-- 2. Ver todos los registros de caducidades
SELECT 
    id,
    folio,
    fecha_registro,
    estado,
    comentario,
    creado_por
FROM caducidades
ORDER BY fecha_registro DESC;

PRINT '========================================';
PRINT 'Registros en la tabla caducidades';
PRINT '========================================';
GO

-- 3. Ver los items de caducidades (medicamentos) con fecha de caducidad del medicamento
SELECT 
    ci.id,
    ci.caducidad_id,
    ci.medicamento_id,
    m.nombre as 'Medicamento',
    ci.cantidad,
    COALESCE(ci.fecha_caducidad, m.fecha_vencimiento) as 'Fecha Caducidad',
    c.folio as 'Folio Caducidad',
    c.fecha_registro as 'Fecha Registro'
FROM caducidad_items ci
INNER JOIN caducidades c ON ci.caducidad_id = c.id
INNER JOIN medications m ON ci.medicamento_id = m.id
ORDER BY c.fecha_registro DESC;

PRINT '========================================';
PRINT 'Items (medicamentos) de caducidades';
PRINT '========================================';
GO

-- 4. Resumen: Contar registros
SELECT 
    'caducidades' as tabla,
    COUNT(*) as total_registros
FROM caducidades
UNION ALL
SELECT 
    'caducidad_items',
    COUNT(*)
FROM caducidad_items;

PRINT '========================================';
PRINT 'Resumen de registros';
PRINT '========================================';

