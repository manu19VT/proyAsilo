-- Script para limpiar la base de datos completamente
-- ⚠️  ADVERTENCIA: Esto eliminará TODOS los datos
-- Ejecuta este script en SQL Server Management Studio

PRINT '========================================';
PRINT '⚠️  ADVERTENCIA: Esto eliminará TODOS los datos';
PRINT '========================================';
PRINT '';

-- Eliminar tablas en orden inverso de dependencias
PRINT 'Eliminando tablas...';

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[entry_items]') AND type in (N'U'))
BEGIN
    DROP TABLE entry_items;
    PRINT '✓ Eliminada tabla: entry_items';
END
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[entry_requests]') AND type in (N'U'))
BEGIN
    DROP TABLE entry_requests;
    PRINT '✓ Eliminada tabla: entry_requests';
END
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[patient_medications]') AND type in (N'U'))
BEGIN
    DROP TABLE patient_medications;
    PRINT '✓ Eliminada tabla: patient_medications';
END
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[personal_objects]') AND type in (N'U'))
BEGIN
    DROP TABLE personal_objects;
    PRINT '✓ Eliminada tabla: personal_objects';
END
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[contacts]') AND type in (N'U'))
BEGIN
    DROP TABLE contacts;
    PRINT '✓ Eliminada tabla: contacts';
END
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[medications]') AND type in (N'U'))
BEGIN
    DROP TABLE medications;
    PRINT '✓ Eliminada tabla: medications';
END
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[patients]') AND type in (N'U'))
BEGIN
    DROP TABLE patients;
    PRINT '✓ Eliminada tabla: patients';
END
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    DROP TABLE users;
    PRINT '✓ Eliminada tabla: users';
END
GO

PRINT '';
PRINT '========================================';
PRINT 'Base de datos limpiada';
PRINT '========================================';
PRINT '';
PRINT 'Ahora ejecuta el script schema.sql completo para recrear las tablas.';
PRINT 'O ejecuta: npm run migrate';
PRINT '';
PRINT '✓ Proceso completado';

