-- Script para eliminar todas las tablas y empezar desde cero
-- Ejecutar este script ANTES de ejecutar schema.sql de nuevo

USE db_ac1425_asilodb;
GO

-- Eliminar tablas en orden (respetando foreign keys)
-- Primero las tablas que tienen foreign keys, luego las principales

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'patient_medications')
BEGIN
    DROP TABLE patient_medications;
    PRINT 'Tabla patient_medications eliminada';
END
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'entry_items')
BEGIN
    DROP TABLE entry_items;
    PRINT 'Tabla entry_items eliminada';
END
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'contacts')
BEGIN
    DROP TABLE contacts;
    PRINT 'Tabla contacts eliminada';
END
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'personal_objects')
BEGIN
    DROP TABLE personal_objects;
    PRINT 'Tabla personal_objects eliminada';
END
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'entry_requests')
BEGIN
    DROP TABLE entry_requests;
    PRINT 'Tabla entry_requests eliminada';
END
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'medications')
BEGIN
    DROP TABLE medications;
    PRINT 'Tabla medications eliminada';
END
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'patients')
BEGIN
    DROP TABLE patients;
    PRINT 'Tabla patients eliminada';
END
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    DROP TABLE users;
    PRINT 'Tabla users eliminada';
END
GO

PRINT 'Todas las tablas han sido eliminadas. Ahora puedes ejecutar schema.sql de nuevo.';
GO

