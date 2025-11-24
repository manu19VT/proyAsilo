-- Script para eliminar TODOS los datos de las tablas
-- Mantiene la estructura de las tablas, solo elimina los registros
-- Ejecutar este script para empezar desde cero con datos vacíos

USE db_ac1425_asilodb;
GO

-- Eliminar datos en orden (respetando foreign keys)
-- Primero las tablas que tienen foreign keys, luego las principales

-- Tablas con foreign keys primero
DELETE FROM patient_medications;
PRINT 'Datos de patient_medications eliminados';
GO

DELETE FROM entry_items;
PRINT 'Datos de entry_items eliminados';
GO

DELETE FROM contacts;
PRINT 'Datos de contacts eliminados';
GO

DELETE FROM personal_objects;
PRINT 'Datos de personal_objects eliminados';
GO

DELETE FROM entry_requests;
PRINT 'Datos de entry_requests eliminados';
GO

-- Tablas principales
DELETE FROM medications;
PRINT 'Datos de medications eliminados';
GO

DELETE FROM patients;
PRINT 'Datos de patients eliminados';
GO

DELETE FROM users;
PRINT 'Datos de users eliminados';
GO

PRINT 'Todos los datos han sido eliminados. Las tablas están vacías y listas para usar.';
PRINT 'NOTA: El usuario admin se creará automáticamente cuando ejecutes el schema.sql o cuando inicies la aplicación.';
GO

