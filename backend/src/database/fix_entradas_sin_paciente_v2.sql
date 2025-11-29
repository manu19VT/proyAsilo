-- Script CORREGIDO para permitir que las entradas NO requieran un paciente
-- IMPORTANTE: Ejecuta este script en tu base de datos SQL Server
use db_ac1425_asilodb
go

PRINT 'Iniciando corrección de tabla entry_requests...';
GO

-- Paso 1: Verificar y eliminar la foreign key constraint actual
DECLARE @fkName NVARCHAR(200);
SELECT TOP 1 @fkName = name 
FROM sys.foreign_keys 
WHERE parent_object_id = OBJECT_ID('entry_requests') 
  AND name = 'FK_entry_requests_paciente';

IF @fkName IS NOT NULL
BEGIN
    DECLARE @dropFkSql NVARCHAR(400);
    SET @dropFkSql = N'ALTER TABLE entry_requests DROP CONSTRAINT [' + @fkName + N']';
    EXEC sp_executesql @dropFkSql;
    PRINT 'Foreign key FK_entry_requests_paciente eliminada correctamente.';
END
ELSE
BEGIN
    PRINT 'La foreign key FK_entry_requests_paciente no existe (puede tener otro nombre).';
    -- Intentar eliminar cualquier foreign key relacionada
    DECLARE @anyFkName NVARCHAR(200);
    SELECT TOP 1 @anyFkName = name 
    FROM sys.foreign_keys 
    WHERE parent_object_id = OBJECT_ID('entry_requests')
      AND referenced_object_id = OBJECT_ID('patients');
    
    IF @anyFkName IS NOT NULL
    BEGIN
        DECLARE @dropAnyFkSql NVARCHAR(400);
        SET @dropAnyFkSql = N'ALTER TABLE entry_requests DROP CONSTRAINT [' + @anyFkName + N']';
        EXEC sp_executesql @dropAnyFkSql;
        PRINT 'Foreign key relacionada eliminada: ' + @anyFkName;
    END
END
GO

-- Paso 2: Actualizar registros existentes de entrada que tengan __ALMACEN__ a NULL
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id')
BEGIN
    UPDATE entry_requests 
    SET paciente_id = NULL 
    WHERE tipo = 'entrada' AND paciente_id = '__ALMACEN__';
    
    IF @@ROWCOUNT > 0
    BEGIN
        PRINT 'Registros de entrada actualizados a NULL.';
    END
END
GO

-- Paso 3: Hacer que paciente_id pueda ser NULL
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id')
BEGIN
    BEGIN TRY
        ALTER TABLE entry_requests ALTER COLUMN paciente_id NVARCHAR(36) NULL;
        PRINT 'Columna paciente_id ahora permite NULL correctamente.';
    END TRY
    BEGIN CATCH
        PRINT 'Error al modificar la columna: ' + ERROR_MESSAGE();
        THROW;
    END CATCH
END
ELSE
BEGIN
    PRINT 'ERROR: La columna paciente_id no existe en entry_requests.';
END
GO

-- Paso 4: Recrear la foreign key pero permitiendo NULL (solo valida cuando hay valor)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id')
   AND NOT EXISTS (SELECT * FROM sys.foreign_keys 
                   WHERE parent_object_id = OBJECT_ID('entry_requests') 
                     AND name = 'FK_entry_requests_paciente')
BEGIN
    BEGIN TRY
        ALTER TABLE entry_requests 
        ADD CONSTRAINT FK_entry_requests_paciente 
        FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE;
        PRINT 'Foreign key FK_entry_requests_paciente recreada correctamente (permite NULL).';
    END TRY
    BEGIN CATCH
        PRINT 'Error al recrear foreign key: ' + ERROR_MESSAGE();
        -- No es crítico, continuar
    END CATCH
END
ELSE
BEGIN
    IF EXISTS (SELECT * FROM sys.foreign_keys 
               WHERE parent_object_id = OBJECT_ID('entry_requests') 
                 AND name = 'FK_entry_requests_paciente')
    BEGIN
        PRINT 'La foreign key FK_entry_requests_paciente ya existe.';
    END
    ELSE
    BEGIN
        PRINT 'No se pudo recrear la foreign key (la columna puede no existir).';
    END
END
GO

PRINT '';
PRINT '========================================';
PRINT 'Script completado.';
PRINT 'Ahora las entradas pueden registrarse sin paciente (paciente_id = NULL).';
PRINT 'Las salidas y caducidad siguen requiriendo paciente.';
PRINT '========================================';
GO


