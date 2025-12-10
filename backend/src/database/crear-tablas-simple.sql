-- Script simplificado para crear las tablas si no existen
-- Ejecuta este script en la base de datos que está usando tu backend

USE [AsiloDB];  -- Cambia esto por el nombre de tu base de datos
GO

-- ============================================
-- CREAR TABLA DE ENTRADAS
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[entradas]') AND type in (N'U'))
BEGIN
    CREATE TABLE entradas (
        id NVARCHAR(36) PRIMARY KEY,
        folio NVARCHAR(20) NOT NULL UNIQUE,
        fecha_creacion DATETIME2 DEFAULT GETDATE(),
        estado NVARCHAR(50) NOT NULL DEFAULT 'completa',
        comentario NVARCHAR(MAX) NULL,
        creado_por NVARCHAR(36) NULL
    );
    PRINT 'Tabla entradas creada';
END
ELSE
BEGIN
    PRINT 'Tabla entradas ya existe';
END
GO

-- ============================================
-- CREAR TABLA DE SALIDAS
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[salidas]') AND type in (N'U'))
BEGIN
    CREATE TABLE salidas (
        id NVARCHAR(36) PRIMARY KEY,
        folio NVARCHAR(20) NOT NULL UNIQUE,
        paciente_id NVARCHAR(36) NOT NULL,
        fecha_creacion DATETIME2 DEFAULT GETDATE(),
        estado NVARCHAR(50) NOT NULL DEFAULT 'completa',
        fecha_vencimiento NVARCHAR(50) NULL,
        comentario NVARCHAR(MAX) NULL,
        creado_por NVARCHAR(36) NULL
    );
    PRINT 'Tabla salidas creada';
END
ELSE
BEGIN
    PRINT 'Tabla salidas ya existe';
END
GO

-- ============================================
-- CREAR TABLA DE CADUCIDADES
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[caducidades]') AND type in (N'U'))
BEGIN
    CREATE TABLE caducidades (
        id NVARCHAR(36) PRIMARY KEY,
        folio NVARCHAR(20) NOT NULL UNIQUE,
        fecha_registro DATETIME2 DEFAULT GETDATE(), -- Fecha cuando se registra la caducidad
        estado NVARCHAR(50) NOT NULL DEFAULT 'completa',
        comentario NVARCHAR(MAX) NULL,
        creado_por NVARCHAR(36) NULL
    );
    PRINT 'Tabla caducidades creada';
END
ELSE
BEGIN
    PRINT 'Tabla caducidades ya existe';
    -- Eliminar fecha_creacion si existe (la quitamos)
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_creacion')
    BEGIN
        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_caducidades_fecha_creacion' AND object_id = OBJECT_ID('caducidades'))
        BEGIN
            DROP INDEX idx_caducidades_fecha_creacion ON caducidades;
        END
        ALTER TABLE caducidades DROP COLUMN fecha_creacion;
        PRINT 'Columna fecha_creacion eliminada';
    END
    
    -- Agregar fecha_registro si no existe
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro')
    BEGIN
        ALTER TABLE caducidades ADD fecha_registro DATETIME2 DEFAULT GETDATE();
        -- Si existe fecha_registro_caducidad, copiar valores
        IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro_caducidad')
        BEGIN
            UPDATE caducidades SET fecha_registro = fecha_registro_caducidad WHERE fecha_registro IS NULL;
            ALTER TABLE caducidades DROP COLUMN fecha_registro_caducidad;
            PRINT 'Columna fecha_registro_caducidad actualizada a fecha_registro';
        END
        ELSE
        BEGIN
            UPDATE caducidades SET fecha_registro = GETDATE() WHERE fecha_registro IS NULL;
            PRINT 'Columna fecha_registro agregada';
        END
    END
    
    -- Eliminar columnas antiguas si existen
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_entrada_original')
    BEGIN
        ALTER TABLE caducidades DROP COLUMN fecha_entrada_original;
        PRINT 'Columna fecha_entrada_original eliminada';
    END
END
GO

-- ============================================
-- CREAR TABLA DE ITEMS DE ENTRADAS
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[entrada_items]') AND type in (N'U'))
BEGIN
    CREATE TABLE entrada_items (
        id NVARCHAR(36) PRIMARY KEY,
        entrada_id NVARCHAR(36) NOT NULL,
        medicamento_id NVARCHAR(36) NOT NULL,
        cantidad INT NOT NULL
    );
    PRINT 'Tabla entrada_items creada';
END
ELSE
BEGIN
    PRINT 'Tabla entrada_items ya existe';
END
GO

-- ============================================
-- CREAR TABLA DE ITEMS DE SALIDAS
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[salida_items]') AND type in (N'U'))
BEGIN
    CREATE TABLE salida_items (
        id NVARCHAR(36) PRIMARY KEY,
        salida_id NVARCHAR(36) NOT NULL,
        medicamento_id NVARCHAR(36) NOT NULL,
        cantidad INT NOT NULL,
        dosis_recomendada NVARCHAR(255) NULL,
        frecuencia NVARCHAR(255) NULL,
        fecha_caducidad NVARCHAR(50) NULL
    );
    PRINT 'Tabla salida_items creada';
END
ELSE
BEGIN
    PRINT 'Tabla salida_items ya existe';
END
GO

-- ============================================
-- CREAR TABLA DE ITEMS DE CADUCIDADES
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[caducidad_items]') AND type in (N'U'))
BEGIN
    CREATE TABLE caducidad_items (
        id NVARCHAR(36) PRIMARY KEY,
        caducidad_id NVARCHAR(36) NOT NULL,
        medicamento_id NVARCHAR(36) NOT NULL,
        cantidad INT NOT NULL,
        fecha_caducidad NVARCHAR(50) NULL
    );
    PRINT 'Tabla caducidad_items creada';
END
ELSE
BEGIN
    PRINT 'Tabla caducidad_items ya existe';
END
GO

-- ============================================
-- VERIFICAR QUE TODAS LAS TABLAS EXISTEN
-- ============================================
SELECT 
    TABLE_NAME,
    CASE 
        WHEN TABLE_NAME IN ('entradas', 'salidas', 'caducidades', 'entrada_items', 'salida_items', 'caducidad_items')
        THEN '✓ CREADA'
        ELSE '✗ FALTA'
    END as estado
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME IN ('entradas', 'salidas', 'caducidades', 'entrada_items', 'salida_items', 'caducidad_items')
ORDER BY TABLE_NAME;

PRINT '========================================';
PRINT 'Verificación completada';
PRINT 'Si todas las tablas muestran "✓ CREADA", las tablas están listas';
PRINT '========================================';

