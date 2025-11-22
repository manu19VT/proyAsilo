-- Script para verificar que todos los datos siguen intactos después de la migración
-- Ejecuta este script en SQL Server Management Studio para contar los registros

PRINT '========================================';
PRINT 'VERIFICACIÓN DE DATOS DESPUÉS DE MIGRACIÓN';
PRINT '========================================';
PRINT '';

-- Contar usuarios
DECLARE @userCount INT;
SELECT @userCount = COUNT(*) FROM users;
PRINT 'Usuarios: ' + CAST(@userCount AS NVARCHAR(10));

-- Contar pacientes
DECLARE @patientCount INT;
SELECT @patientCount = COUNT(*) FROM patients;
PRINT 'Pacientes: ' + CAST(@patientCount AS NVARCHAR(10));

-- Contar contactos
DECLARE @contactCount INT;
SELECT @contactCount = COUNT(*) FROM contacts;
PRINT 'Contactos: ' + CAST(@contactCount AS NVARCHAR(10));

-- Contar medicamentos
DECLARE @medicationCount INT;
SELECT @medicationCount = COUNT(*) FROM medications;
PRINT 'Medicamentos: ' + CAST(@medicationCount AS NVARCHAR(10));

-- Contar solicitudes de entrada
DECLARE @entryRequestCount INT;
SELECT @entryRequestCount = COUNT(*) FROM entry_requests;
PRINT 'Solicitudes de entrada: ' + CAST(@entryRequestCount AS NVARCHAR(10));

-- Contar items de solicitudes
DECLARE @entryItemCount INT;
SELECT @entryItemCount = COUNT(*) FROM entry_items;
PRINT 'Items de solicitudes: ' + CAST(@entryItemCount AS NVARCHAR(10));

-- Contar medicamentos de pacientes
DECLARE @patientMedicationCount INT;
SELECT @patientMedicationCount = COUNT(*) FROM patient_medications;
PRINT 'Medicamentos asignados a pacientes: ' + CAST(@patientMedicationCount AS NVARCHAR(10));

-- Contar objetos personales
DECLARE @objectCount INT;
SELECT @objectCount = COUNT(*) FROM personal_objects;
PRINT 'Objetos personales: ' + CAST(@objectCount AS NVARCHAR(10));

PRINT '';
PRINT '========================================';
PRINT 'RESUMEN:';
PRINT '========================================';
PRINT 'Si todos los números son mayores a 0 (o iguales a lo que tenías antes),';
PRINT 'entonces NO se perdieron datos. Solo se renombraron las columnas.';
PRINT '';

-- Mostrar algunos ejemplos de datos (usando las columnas correctas)
PRINT '========================================';
PRINT 'EJEMPLOS DE DATOS (primeros 3 registros):';
PRINT '========================================';
PRINT '';

PRINT '--- Usuarios ---';
-- Verificar qué columnas existen
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'nombre')
BEGIN
    SELECT TOP 3 id, nombre, rol, email FROM users;
END
ELSE IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'name')
BEGIN
    SELECT TOP 3 id, name as nombre, role as rol, email FROM users;
END
ELSE
BEGIN
    PRINT 'Tabla users no encontrada o sin columnas de nombre';
END
PRINT '';

PRINT '--- Pacientes ---';
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'nombre')
BEGIN
    SELECT TOP 3 id, nombre, edad, estado FROM patients;
END
ELSE IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'name')
BEGIN
    SELECT TOP 3 id, name as nombre, age as edad, status as estado FROM patients;
END
ELSE
BEGIN
    PRINT 'Tabla patients no encontrada o sin columnas de nombre';
END
PRINT '';

PRINT '--- Medicamentos ---';
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'nombre')
BEGIN
    SELECT TOP 3 id, nombre, cantidad, fecha_vencimiento FROM medications;
END
ELSE IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'name')
BEGIN
    SELECT TOP 3 id, name as nombre, quantity as cantidad, expiration_date as fecha_vencimiento FROM medications;
END
ELSE
BEGIN
    PRINT 'Tabla medications no encontrada o sin columnas de nombre';
END
PRINT '';

PRINT '✓ Verificación completada';

