-- Script para verificar el estado de la migración de columnas
-- Muestra qué tablas tienen columnas en inglés y cuáles en español

PRINT '========================================';
PRINT 'ESTADO DE MIGRACIÓN DE COLUMNAS';
PRINT '========================================';
PRINT '';

-- Verificar tabla users
PRINT '--- Tabla users ---';
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'nombre')
    PRINT '  ✓ nombre (español)';
ELSE IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'name')
    PRINT '  ⚠️  name (inglés - necesita migración)';
ELSE
    PRINT '  ❌ No se encontró columna de nombre';

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'rol')
    PRINT '  ✓ rol (español)';
ELSE IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'role')
    PRINT '  ⚠️  role (inglés - necesita migración)';
ELSE
    PRINT '  ❌ No se encontró columna de rol';
PRINT '';

-- Verificar tabla patients
PRINT '--- Tabla patients ---';
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'nombre')
    PRINT '  ✓ nombre (español)';
ELSE IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'name')
    PRINT '  ⚠️  name (inglés - necesita migración)';
ELSE
    PRINT '  ❌ No se encontró columna de nombre';

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'estado')
    PRINT '  ✓ estado (español)';
ELSE IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'status')
    PRINT '  ⚠️  status (inglés - necesita migración)';
ELSE
    PRINT '  ❌ No se encontró columna de estado';
PRINT '';

-- Verificar tabla medications
PRINT '--- Tabla medications ---';
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'nombre')
    PRINT '  ✓ nombre (español)';
ELSE IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'name')
    PRINT '  ⚠️  name (inglés - necesita migración)';
ELSE
    PRINT '  ❌ No se encontró columna de nombre';

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'fecha_vencimiento')
    PRINT '  ✓ fecha_vencimiento (español)';
ELSE IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'expiration_date')
    PRINT '  ⚠️  expiration_date (inglés - necesita migración)';
ELSE
    PRINT '  ❌ No se encontró columna de fecha_vencimiento';
PRINT '';

PRINT '========================================';
PRINT 'RESUMEN:';
PRINT '========================================';
PRINT 'Si ves ⚠️, significa que esa columna aún está en inglés';
PRINT 'y necesitas ejecutar el script de migración (fix-users o schema.sql)';
PRINT '';

