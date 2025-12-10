-- Script para hacer que paciente_id sea NULL para entradas
use db_ac1425_asilodb
go

-- Primero, eliminar la foreign key constraint si existe
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_entry_requests_paciente')
BEGIN
    ALTER TABLE entry_requests DROP CONSTRAINT FK_entry_requests_paciente;
    PRINT 'Foreign key FK_entry_requests_paciente eliminada.';
END
GO

-- Hacer que paciente_id pueda ser NULL
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id')
BEGIN
    ALTER TABLE entry_requests ALTER COLUMN paciente_id NVARCHAR(36) NULL;
    PRINT 'Columna paciente_id ahora permite NULL.';
END
GO

-- Recrear la foreign key pero permitiendo NULL
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id')
   AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_entry_requests_paciente')
BEGIN
    ALTER TABLE entry_requests 
    ADD CONSTRAINT FK_entry_requests_paciente 
    FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE;
    PRINT 'Foreign key FK_entry_requests_paciente recreada (permite NULL).';
END
GO




