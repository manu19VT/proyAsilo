-- Script para agregar la columna codigo_barras a la tabla medications
-- Ejecutar este script si la columna no existe
use db_ac1425_asilodb
go
-- Agregar columna codigo_barras si no existe
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'codigo_barras')
BEGIN
    ALTER TABLE medications ADD codigo_barras NVARCHAR(255) NULL;
    PRINT 'Columna codigo_barras agregada exitosamente a la tabla medications.';
END
ELSE
BEGIN
    PRINT 'La columna codigo_barras ya existe en la tabla medications.';
END
GO

-- Crear índice para mejorar búsquedas por código de barras
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'codigo_barras')
   AND NOT EXISTS (SELECT * FROM sys.indexes 
                   WHERE name = 'idx_medications_codigo_barras' 
                   AND object_id = OBJECT_ID('medications'))
BEGIN
    CREATE INDEX idx_medications_codigo_barras ON medications(codigo_barras);
    PRINT 'Índice idx_medications_codigo_barras creado exitosamente.';
END
ELSE
BEGIN
    PRINT 'El índice idx_medications_codigo_barras ya existe o la columna no existe.';
END
GO






