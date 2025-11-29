-- Script para verificar que las tablas se crearon correctamente

-- Verificar que las tablas principales existen
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'entradas') 
        THEN '✓ Tabla entradas existe' 
        ELSE '✗ Tabla entradas NO existe' 
    END as estado_entradas;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'salidas') 
        THEN '✓ Tabla salidas existe' 
        ELSE '✗ Tabla salidas NO existe' 
    END as estado_salidas;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'caducidades') 
        THEN '✓ Tabla caducidades existe' 
        ELSE '✗ Tabla caducidades NO existe' 
    END as estado_caducidades;

-- Verificar tablas de items
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'entrada_items') 
        THEN '✓ Tabla entrada_items existe' 
        ELSE '✗ Tabla entrada_items NO existe' 
    END as estado_entrada_items;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'salida_items') 
        THEN '✓ Tabla salida_items existe' 
        ELSE '✗ Tabla salida_items NO existe' 
    END as estado_salida_items;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'caducidad_items') 
        THEN '✓ Tabla caducidad_items existe' 
        ELSE '✗ Tabla caducidad_items NO existe' 
    END as estado_caducidad_items;

-- Mostrar todas las tablas relacionadas
SELECT TABLE_NAME, TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME IN ('entradas', 'salidas', 'caducidades', 'entrada_items', 'salida_items', 'caducidad_items', 'entry_requests', 'entry_items')
ORDER BY TABLE_NAME;

-- Contar registros en cada tabla (si existen)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'entradas')
BEGIN
    SELECT 'entradas' as tabla, COUNT(*) as total FROM entradas;
END

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'salidas')
BEGIN
    SELECT 'salidas' as tabla, COUNT(*) as total FROM salidas;
END

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'caducidades')
BEGIN
    SELECT 'caducidades' as tabla, COUNT(*) as total FROM caducidades;
END

