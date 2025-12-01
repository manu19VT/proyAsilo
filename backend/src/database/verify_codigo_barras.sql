-- Script para verificar y crear el índice de codigo_barras
use db_ac1425_asilodb
go

-- Verificar si la columna existe
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'codigo_barras')
BEGIN
    PRINT 'La columna codigo_barras existe.';
    
    -- Verificar si el índice existe
    IF EXISTS (SELECT * FROM sys.indexes 
               WHERE name = 'idx_medications_codigo_barras' 
               AND object_id = OBJECT_ID('medications'))
    BEGIN
        PRINT 'El índice idx_medications_codigo_barras ya existe.';
    END
    ELSE
    BEGIN
        PRINT 'Creando índice idx_medications_codigo_barras...';
        CREATE INDEX idx_medications_codigo_barras ON medications(codigo_barras);
        PRINT 'Índice creado exitosamente.';
    END
END
ELSE
BEGIN
    PRINT 'ERROR: La columna codigo_barras NO existe.';
END
GO




