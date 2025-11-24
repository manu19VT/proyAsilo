-- Script para agregar las columnas faltantes en la tabla patients
-- Ejecutar este script si faltan doctor_id y enfermero_id

USE db_ac1425_asilodb;
GO

-- Agregar doctor_id si no existe
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'doctor_id')
BEGIN
    ALTER TABLE patients ADD doctor_id NVARCHAR(36) NULL;
    PRINT 'Columna doctor_id agregada';
END
ELSE
BEGIN
    PRINT 'Columna doctor_id ya existe';
END
GO

-- Agregar enfermero_id si no existe
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'enfermero_id')
BEGIN
    ALTER TABLE patients ADD enfermero_id NVARCHAR(36) NULL;
    PRINT 'Columna enfermero_id agregada';
END
ELSE
BEGIN
    PRINT 'Columna enfermero_id ya existe';
END
GO

-- Agregar foreign keys si no existen
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'doctor_id')
   AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_patients_doctor')
BEGIN
    ALTER TABLE patients ADD CONSTRAINT FK_patients_doctor FOREIGN KEY (doctor_id) REFERENCES users(id);
    PRINT 'Foreign key FK_patients_doctor agregada';
END
GO

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'enfermero_id')
   AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_patients_enfermero')
BEGIN
    ALTER TABLE patients ADD CONSTRAINT FK_patients_enfermero FOREIGN KEY (enfermero_id) REFERENCES users(id);
    PRINT 'Foreign key FK_patients_enfermero agregada';
END
GO

PRINT 'Script completado. Verifica que las columnas se hayan agregado correctamente.';
GO

