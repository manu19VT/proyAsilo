-- ============================================
-- SCRIPT PARA ACTUALIZAR BASE DE DATOS LOCAL
-- Ejecutar este script en AsiloDB (base de datos local)
-- ============================================

USE AsiloDB;
GO

PRINT 'Iniciando actualización de la base de datos local...';
GO

-- ============================================
-- 1. AGREGAR COLUMNA codigo_barras A medications
-- ============================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'codigo_barras')
BEGIN
    ALTER TABLE medications ADD codigo_barras NVARCHAR(255) NULL;
    PRINT '✓ Columna codigo_barras agregada a la tabla medications.';
END
ELSE
BEGIN
    PRINT '→ La columna codigo_barras ya existe en medications.';
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
    PRINT '✓ Índice idx_medications_codigo_barras creado.';
END
ELSE
BEGIN
    PRINT '→ El índice idx_medications_codigo_barras ya existe.';
END
GO

-- ============================================
-- 2. PERMITIR NULL EN paciente_id DE entry_requests
-- ============================================
-- Primero, eliminar la foreign key si existe
IF EXISTS (SELECT * FROM sys.foreign_keys 
           WHERE name = 'FK_entry_requests_paciente' 
           AND parent_object_id = OBJECT_ID('entry_requests'))
BEGIN
    ALTER TABLE entry_requests DROP CONSTRAINT FK_entry_requests_paciente;
    PRINT '✓ Foreign key FK_entry_requests_paciente eliminada.';
END
ELSE
BEGIN
    PRINT '→ La foreign key FK_entry_requests_paciente no existe (o tiene otro nombre).';
END
GO

-- Verificar si hay otras foreign keys relacionadas con paciente_id
DECLARE @fkName NVARCHAR(200);
SELECT TOP 1 @fkName = name 
FROM sys.foreign_keys 
WHERE parent_object_id = OBJECT_ID('entry_requests') 
  AND referenced_object_id = OBJECT_ID('patients');

IF @fkName IS NOT NULL
BEGIN
    DECLARE @dropFkSql NVARCHAR(400);
    SET @dropFkSql = N'ALTER TABLE entry_requests DROP CONSTRAINT [' + @fkName + N']';
    EXEC sp_executesql @dropFkSql;
    PRINT '✓ Foreign key ' + @fkName + ' eliminada.';
END
GO

-- Ahora permitir NULL en paciente_id
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id')
BEGIN
    -- Verificar si ya permite NULL
    IF (SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id') = 'NO'
    BEGIN
        ALTER TABLE entry_requests ALTER COLUMN paciente_id NVARCHAR(36) NULL;
        PRINT '✓ Columna paciente_id ahora permite NULL.';
    END
    ELSE
    BEGIN
        PRINT '→ La columna paciente_id ya permite NULL.';
    END
END
ELSE
BEGIN
    PRINT '⚠ La columna paciente_id no existe en entry_requests.';
END
GO

-- ============================================
-- 3. VERIFICAR QUE LA TABLA entry_requests TENGA EL CAMPO tipo
-- ============================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'tipo')
BEGIN
    ALTER TABLE entry_requests ADD tipo NVARCHAR(20) NULL;
    PRINT '✓ Columna tipo agregada a entry_requests.';
    
    -- Actualizar registros existentes si hay datos
    UPDATE entry_requests SET tipo = 'salida' WHERE tipo IS NULL;
    
    -- Hacer NOT NULL después de actualizar
    ALTER TABLE entry_requests ALTER COLUMN tipo NVARCHAR(20) NOT NULL;
    PRINT '✓ Columna tipo configurada como NOT NULL.';
END
ELSE
BEGIN
    PRINT '→ La columna tipo ya existe en entry_requests.';
END
GO

-- ============================================
-- 4. VERIFICAR CONSTRAINT DE tipo (entrada, salida, caducidad)
-- ============================================
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'tipo')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints 
                   WHERE parent_object_id = OBJECT_ID('entry_requests') 
                   AND name = 'CK_entry_requests_tipo')
    BEGIN
        ALTER TABLE entry_requests 
        ADD CONSTRAINT CK_entry_requests_tipo 
        CHECK (tipo IN ('entrada', 'salida', 'caducidad'));
        PRINT '✓ Constraint CK_entry_requests_tipo creada.';
    END
    ELSE
    BEGIN
        PRINT '→ La constraint CK_entry_requests_tipo ya existe.';
    END
END
GO

-- ============================================
-- 5. VERIFICAR COLUMNA estado EN entry_requests
-- ============================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'estado')
BEGIN
    ALTER TABLE entry_requests ADD estado NVARCHAR(20) NULL;
    PRINT '✓ Columna estado agregada a entry_requests.';
    
    -- Actualizar registros existentes
    UPDATE entry_requests SET estado = 'completa' WHERE estado IS NULL;
    
    -- Hacer NOT NULL después de actualizar
    ALTER TABLE entry_requests ALTER COLUMN estado NVARCHAR(20) NOT NULL;
    PRINT '✓ Columna estado configurada como NOT NULL.';
END
ELSE
BEGIN
    PRINT '→ La columna estado ya existe en entry_requests.';
END
GO

-- ============================================
-- 6. VERIFICAR COLUMNA folio EN entry_requests
-- ============================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'folio')
BEGIN
    ALTER TABLE entry_requests ADD folio NVARCHAR(50) NULL;
    PRINT '✓ Columna folio agregada a entry_requests.';
END
ELSE
BEGIN
    PRINT '→ La columna folio ya existe en entry_requests.';
END
GO

-- ============================================
-- RESUMEN FINAL
-- ============================================
PRINT '';
PRINT '========================================';
PRINT 'ACTUALIZACIÓN COMPLETADA';
PRINT '========================================';
PRINT 'Verificando cambios...';
GO

-- Verificar cambios realizados
SELECT 
    'medications.codigo_barras' AS Cambio,
    CASE 
        WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'codigo_barras')
        THEN '✓ Existe'
        ELSE '✗ No existe'
    END AS Estado
UNION ALL
SELECT 
    'entry_requests.paciente_id (NULL)',
    CASE 
        WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id'
                     AND IS_NULLABLE = 'YES')
        THEN '✓ Permite NULL'
        ELSE '✗ No permite NULL'
    END
UNION ALL
SELECT 
    'entry_requests.tipo',
    CASE 
        WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'tipo')
        THEN '✓ Existe'
        ELSE '✗ No existe'
    END
UNION ALL
SELECT 
    'entry_requests.estado',
    CASE 
        WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'estado')
        THEN '✓ Existe'
        ELSE '✗ No existe'
    END
UNION ALL
SELECT 
    'entry_requests.folio',
    CASE 
        WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'folio')
        THEN '✓ Existe'
        ELSE '✗ No existe'
    END;
GO

PRINT '';
PRINT '¡Base de datos local actualizada correctamente!';
PRINT 'Ahora puedes probar los cambios en localhost.';
GO

