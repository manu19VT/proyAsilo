-- Script para permitir que las entradas NO requieran un paciente
-- Esto permite registrar medicamentos sin necesidad de crear un "paciente Almacén"
use db_ac1425_asilodb
go

-- Paso 1: Eliminar la foreign key constraint actual
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_entry_requests_paciente')
BEGIN
    ALTER TABLE entry_requests DROP CONSTRAINT FK_entry_requests_paciente;
    PRINT 'Foreign key FK_entry_requests_paciente eliminada.';
END
ELSE
BEGIN
    PRINT 'La foreign key FK_entry_requests_paciente no existe.';
END
GO

-- Paso 2: Hacer que paciente_id pueda ser NULL
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id')
BEGIN
    -- Primero actualizar los registros de entrada existentes a NULL si tienen __ALMACEN__
    UPDATE entry_requests 
    SET paciente_id = NULL 
    WHERE tipo = 'entrada' AND paciente_id = '__ALMACEN__';
    
    -- Ahora cambiar la columna para permitir NULL
    ALTER TABLE entry_requests ALTER COLUMN paciente_id NVARCHAR(36) NULL;
    PRINT 'Columna paciente_id ahora permite NULL.';
END
ELSE
BEGIN
    PRINT 'La columna paciente_id no existe.';
END
GO

-- Paso 3: Recrear la foreign key pero permitiendo NULL (solo valida cuando hay valor)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id')
   AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_entry_requests_paciente')
BEGIN
    ALTER TABLE entry_requests 
    ADD CONSTRAINT FK_entry_requests_paciente 
    FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE;
    PRINT 'Foreign key FK_entry_requests_paciente recreada (permite NULL para entradas).';
END
ELSE
BEGIN
    PRINT 'La foreign key ya existe o la columna no existe.';
END
GO

PRINT 'Script completado. Ahora las entradas pueden registrarse sin paciente.';
GO


