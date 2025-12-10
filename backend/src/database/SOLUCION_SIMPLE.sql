-- ============================================
-- SOLUCIÓN SIMPLE - EJECUTA ESTE SCRIPT
-- ============================================
-- Copia y pega esto en SQL Server Management Studio
-- ============================================

USE db_ac1425_asilodb;
GO

-- Eliminar la foreign key
ALTER TABLE entry_requests DROP CONSTRAINT FK_entry_requests_paciente;
GO

-- Permitir NULL en paciente_id
ALTER TABLE entry_requests ALTER COLUMN paciente_id NVARCHAR(36) NULL;
GO

PRINT 'Listo! Ahora paciente_id permite NULL.';
GO


USE db_ac1425_asilodb;
GO

-- Verificar si paciente_id permite NULL
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'entry_requests' 
  AND COLUMN_NAME = 'paciente_id';
GO

-- Ver entradas
SELECT TOP 10 * FROM entry_requests ORDER BY fecha_creacion DESC;

-- Ver medicamentos
SELECT TOP 10 * FROM medications ORDER BY fecha_creacion DESC;

