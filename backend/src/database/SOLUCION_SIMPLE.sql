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


