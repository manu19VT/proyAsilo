-- ============================================================
-- SCRIPT DE MIGRACIÓN COMPLETA PARA BASE DE DATOS REMOTA
-- ============================================================
-- Este script crea las tablas separadas (entradas, salidas, caducidades)
-- y migra los datos de las tablas antiguas (entry_requests, entry_items)
-- 
-- IMPORTANTE: Este script es idempotente, puede ejecutarse múltiples veces
-- ============================================================

USE AsiloDB;
GO

PRINT '========================================';
PRINT 'INICIANDO MIGRACIÓN COMPLETA';
PRINT '========================================';
GO

-- ============================================================
-- PASO 1: Agregar columna comentario a entry_requests si no existe
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'comentario')
BEGIN
    ALTER TABLE entry_requests ADD comentario NVARCHAR(MAX) NULL;
    PRINT '✓ Columna comentario agregada a entry_requests';
END
ELSE
BEGIN
    PRINT '✓ Columna comentario ya existe en entry_requests';
END
GO

-- ============================================================
-- PASO 2: Crear tabla ENTRADAS
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'entradas')
BEGIN
    CREATE TABLE entradas (
        id NVARCHAR(36) PRIMARY KEY,
        folio NVARCHAR(50) UNIQUE NOT NULL,
        fecha_creacion DATETIME2 NOT NULL DEFAULT GETDATE(),
        estado NVARCHAR(20) NOT NULL DEFAULT 'pendiente',
        comentario NVARCHAR(MAX) NULL,
        creado_por NVARCHAR(36) NULL,
        FOREIGN KEY (creado_por) REFERENCES users(id)
    );
    CREATE INDEX idx_entradas_fecha ON entradas(fecha_creacion);
    CREATE INDEX idx_entradas_folio ON entradas(folio);
    PRINT '✓ Tabla entradas creada';
END
ELSE
BEGIN
    PRINT '✓ Tabla entradas ya existe';
END
GO

-- ============================================================
-- PASO 3: Crear tabla ENTRADA_ITEMS
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'entrada_items')
BEGIN
    CREATE TABLE entrada_items (
        id NVARCHAR(36) PRIMARY KEY,
        entrada_id NVARCHAR(36) NOT NULL,
        medicamento_id NVARCHAR(36) NOT NULL,
        cantidad DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (entrada_id) REFERENCES entradas(id) ON DELETE CASCADE,
        FOREIGN KEY (medicamento_id) REFERENCES medications(id)
    );
    CREATE INDEX idx_entrada_items_entrada ON entrada_items(entrada_id);
    CREATE INDEX idx_entrada_items_medicamento ON entrada_items(medicamento_id);
    PRINT '✓ Tabla entrada_items creada';
END
ELSE
BEGIN
    PRINT '✓ Tabla entrada_items ya existe';
END
GO

-- ============================================================
-- PASO 4: Crear tabla SALIDAS
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'salidas')
BEGIN
    CREATE TABLE salidas (
        id NVARCHAR(36) PRIMARY KEY,
        folio NVARCHAR(50) UNIQUE NOT NULL,
        paciente_id NVARCHAR(36) NULL,
        fecha_creacion DATETIME2 NOT NULL DEFAULT GETDATE(),
        estado NVARCHAR(20) NOT NULL DEFAULT 'pendiente',
        fecha_vencimiento DATE NULL,
        comentario NVARCHAR(MAX) NULL,
        creado_por NVARCHAR(36) NULL,
        FOREIGN KEY (paciente_id) REFERENCES patients(id),
        FOREIGN KEY (creado_por) REFERENCES users(id)
    );
    CREATE INDEX idx_salidas_fecha ON salidas(fecha_creacion);
    CREATE INDEX idx_salidas_folio ON salidas(folio);
    CREATE INDEX idx_salidas_paciente ON salidas(paciente_id);
    PRINT '✓ Tabla salidas creada';
END
ELSE
BEGIN
    PRINT '✓ Tabla salidas ya existe';
END
GO

-- ============================================================
-- PASO 5: Crear tabla SALIDA_ITEMS
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'salida_items')
BEGIN
    CREATE TABLE salida_items (
        id NVARCHAR(36) PRIMARY KEY,
        salida_id NVARCHAR(36) NOT NULL,
        medicamento_id NVARCHAR(36) NOT NULL,
        cantidad DECIMAL(10,2) NOT NULL,
        dosis_recomendada NVARCHAR(200) NULL,
        frecuencia NVARCHAR(200) NULL,
        fecha_caducidad DATE NULL,
        FOREIGN KEY (salida_id) REFERENCES salidas(id) ON DELETE CASCADE,
        FOREIGN KEY (medicamento_id) REFERENCES medications(id)
    );
    CREATE INDEX idx_salida_items_salida ON salida_items(salida_id);
    CREATE INDEX idx_salida_items_medicamento ON salida_items(medicamento_id);
    PRINT '✓ Tabla salida_items creada';
END
ELSE
BEGIN
    PRINT '✓ Tabla salida_items ya existe';
END
GO

-- ============================================================
-- PASO 6: Crear tabla CADUCIDADES
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'caducidades')
BEGIN
    CREATE TABLE caducidades (
        id NVARCHAR(36) PRIMARY KEY,
        folio NVARCHAR(50) UNIQUE NOT NULL,
        fecha_registro DATETIME2 NOT NULL DEFAULT GETDATE(),
        estado NVARCHAR(20) NOT NULL DEFAULT 'pendiente',
        comentario NVARCHAR(MAX) NULL,
        creado_por NVARCHAR(36) NULL,
        FOREIGN KEY (creado_por) REFERENCES users(id)
    );
    CREATE INDEX idx_caducidades_fecha_registro ON caducidades(fecha_registro);
    CREATE INDEX idx_caducidades_folio ON caducidades(folio);
    PRINT '✓ Tabla caducidades creada con fecha_registro';
END
ELSE
BEGIN
    PRINT '✓ Tabla caducidades ya existe';
END
GO

-- ============================================================
-- PASO 6.1: Asegurar que fecha_registro existe en caducidades
-- ============================================================
PRINT '========================================';
PRINT 'VERIFICANDO fecha_registro EN CADUCIDADES';
PRINT '========================================';

-- Eliminar columnas antiguas si existen
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_creacion')
BEGIN
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_caducidades_fecha_creacion' AND object_id = OBJECT_ID('caducidades'))
    BEGIN
        DROP INDEX idx_caducidades_fecha_creacion ON caducidades;
    END
    ALTER TABLE caducidades DROP COLUMN fecha_creacion;
    PRINT '✓ Columna fecha_creacion eliminada de caducidades';
END

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_entrada_original')
BEGIN
    ALTER TABLE caducidades DROP COLUMN fecha_entrada_original;
    PRINT '✓ Columna fecha_entrada_original eliminada';
END

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro_caducidad')
BEGIN
    -- Eliminar constraint default si existe
    DECLARE @constraintName NVARCHAR(200);
    SELECT @constraintName = name 
    FROM sys.default_constraints 
    WHERE parent_object_id = OBJECT_ID('caducidades') 
    AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('caducidades') AND name = 'fecha_registro_caducidad');
    
    IF @constraintName IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE caducidades DROP CONSTRAINT ' + @constraintName);
        PRINT '✓ Constraint eliminado: ' + @constraintName;
    END
    
    -- Eliminar TODOS los índices que usan fecha_registro_caducidad
    -- Buscar índices que usan esta columna
    DECLARE @indexName NVARCHAR(200);
    DECLARE index_cursor CURSOR FOR
    SELECT i.name
    FROM sys.indexes i
    INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE i.object_id = OBJECT_ID('caducidades')
    AND c.name = 'fecha_registro_caducidad';
    
    OPEN index_cursor;
    FETCH NEXT FROM index_cursor INTO @indexName;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        EXEC('DROP INDEX ' + @indexName + ' ON caducidades');
        PRINT '✓ Índice eliminado: ' + @indexName;
        FETCH NEXT FROM index_cursor INTO @indexName;
    END
    
    CLOSE index_cursor;
    DEALLOCATE index_cursor;
    
    -- También eliminar índices con nombres conocidos
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_caducidades_fecha_registro_caducidad' AND object_id = OBJECT_ID('caducidades'))
    BEGIN
        DROP INDEX idx_caducidades_fecha_registro_caducidad ON caducidades;
        PRINT '✓ Índice idx_caducidades_fecha_registro_caducidad eliminado';
    END
    
    -- Eliminar índice idx_caducidades_fecha_registro si está usando fecha_registro_caducidad
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_caducidades_fecha_registro' AND object_id = OBJECT_ID('caducidades'))
    BEGIN
        -- Verificar si este índice usa fecha_registro_caducidad
        IF EXISTS (
            SELECT 1
            FROM sys.indexes i
            INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
            INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
            WHERE i.object_id = OBJECT_ID('caducidades')
            AND i.name = 'idx_caducidades_fecha_registro'
            AND c.name = 'fecha_registro_caducidad'
        )
        BEGIN
            DROP INDEX idx_caducidades_fecha_registro ON caducidades;
            PRINT '✓ Índice idx_caducidades_fecha_registro eliminado (usaba fecha_registro_caducidad)';
        END
    END
    
    -- Ahora sí eliminar la columna
    ALTER TABLE caducidades DROP COLUMN fecha_registro_caducidad;
    PRINT '✓ Columna fecha_registro_caducidad eliminada';
END

-- Agregar fecha_registro si no existe
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro')
BEGIN
    PRINT 'Agregando columna fecha_registro...';
    ALTER TABLE caducidades ADD fecha_registro DATETIME2 NULL;
    PRINT 'Columna agregada (NULL temporalmente)';
END
ELSE
BEGIN
    PRINT '✓ Columna fecha_registro ya existe en caducidades';
END
GO

-- Asignar valores a registros existentes si la columna existe
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro')
BEGIN
    DECLARE @countRegistros INT;
    SELECT @countRegistros = COUNT(*) FROM caducidades WHERE fecha_registro IS NULL;
    IF @countRegistros > 0
    BEGIN
        UPDATE caducidades SET fecha_registro = GETDATE() WHERE fecha_registro IS NULL;
        PRINT '✓ ' + CAST(@countRegistros AS NVARCHAR(10)) + ' registros actualizados con fecha actual';
    END
END
GO

-- Hacer NOT NULL y agregar constraint
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro')
BEGIN
    -- Verificar si ya es NOT NULL
    DECLARE @isNullable NVARCHAR(3);
    SELECT @isNullable = IS_NULLABLE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro';
    
    IF @isNullable = 'YES'
    BEGIN
        ALTER TABLE caducidades ALTER COLUMN fecha_registro DATETIME2 NOT NULL;
        PRINT 'Columna configurada como NOT NULL';
    END
    
    -- Agregar default constraint si no existe
    IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('caducidades') AND name = 'DF_caducidades_fecha_registro')
    BEGIN
        ALTER TABLE caducidades ADD CONSTRAINT DF_caducidades_fecha_registro DEFAULT GETDATE() FOR fecha_registro;
        PRINT 'Default constraint agregado';
    END
    
    -- Crear índice si no existe
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_caducidades_fecha_registro' AND object_id = OBJECT_ID('caducidades'))
    BEGIN
        CREATE INDEX idx_caducidades_fecha_registro ON caducidades(fecha_registro);
        PRINT 'Índice fecha_registro creado';
    END
    
    PRINT '✓ Configuración de fecha_registro completada';
END
GO

-- ============================================================
-- PASO 7: Crear tabla CADUCIDAD_ITEMS
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'caducidad_items')
BEGIN
    CREATE TABLE caducidad_items (
        id NVARCHAR(36) PRIMARY KEY,
        caducidad_id NVARCHAR(36) NOT NULL,
        medicamento_id NVARCHAR(36) NOT NULL,
        cantidad DECIMAL(10,2) NOT NULL,
        fecha_caducidad DATE NULL,
        FOREIGN KEY (caducidad_id) REFERENCES caducidades(id) ON DELETE CASCADE,
        FOREIGN KEY (medicamento_id) REFERENCES medications(id)
    );
    CREATE INDEX idx_caducidad_items_caducidad ON caducidad_items(caducidad_id);
    CREATE INDEX idx_caducidad_items_medicamento ON caducidad_items(medicamento_id);
    PRINT '✓ Tabla caducidad_items creada';
END
ELSE
BEGIN
    PRINT '✓ Tabla caducidad_items ya existe';
END
GO

-- ============================================================
-- PASO 8: Verificar nombres de columnas (una sola vez)
-- ============================================================
PRINT '========================================';
PRINT 'VERIFICANDO NOMBRES DE COLUMNAS';
PRINT '========================================';

-- Verificar nombres de columnas en entry_requests
DECLARE @hasFechaCreacion BIT = 0;
DECLARE @hasCreatedAt BIT = 0;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'fecha_creacion')
    SET @hasFechaCreacion = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'created_at')
    SET @hasCreatedAt = 1;

-- Verificar nombres de columnas en entry_items
DECLARE @hasSolicitudId BIT = 0;
DECLARE @hasEntryRequestId BIT = 0;
DECLARE @hasMedicamentoId BIT = 0;
DECLARE @hasMedicationId BIT = 0;
DECLARE @hasCantidad BIT = 0;
DECLARE @hasQty BIT = 0;

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'solicitud_id')
    SET @hasSolicitudId = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'entry_request_id')
    SET @hasEntryRequestId = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'medicamento_id')
    SET @hasMedicamentoId = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'medication_id')
    SET @hasMedicationId = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'cantidad')
    SET @hasCantidad = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'qty')
    SET @hasQty = 1;

PRINT '✓ Verificación de columnas completada';
GO

-- ============================================================
-- PASO 9: Migrar datos de ENTRADAS
-- ============================================================
PRINT '========================================';
PRINT 'MIGRANDO DATOS DE ENTRADAS';
PRINT '========================================';

-- Verificar nombres de columnas en entry_requests (re-declarar después de GO)
DECLARE @hasFechaCreacion BIT = 0;
DECLARE @hasCreatedAt BIT = 0;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'fecha_creacion')
    SET @hasFechaCreacion = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'created_at')
    SET @hasCreatedAt = 1;

-- Verificar nombres de columnas en entry_items (re-declarar después de GO)
DECLARE @hasSolicitudId BIT = 0;
DECLARE @hasEntryRequestId BIT = 0;
DECLARE @hasMedicamentoId BIT = 0;
DECLARE @hasMedicationId BIT = 0;
DECLARE @hasCantidad BIT = 0;
DECLARE @hasQty BIT = 0;

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'solicitud_id')
    SET @hasSolicitudId = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'entry_request_id')
    SET @hasEntryRequestId = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'medicamento_id')
    SET @hasMedicamentoId = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'medication_id')
    SET @hasMedicationId = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'cantidad')
    SET @hasCantidad = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'qty')
    SET @hasQty = 1;

-- Verificar si creado_por existe en entry_requests
DECLARE @hasCreadoPor BIT = 0;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'creado_por')
    SET @hasCreadoPor = 1;

DECLARE @sqlEntradas NVARCHAR(MAX);
IF @hasFechaCreacion = 1 AND @hasCreadoPor = 1
BEGIN
    SET @sqlEntradas = N'
    INSERT INTO entradas (id, folio, fecha_creacion, estado, comentario, creado_por)
    SELECT 
        er.id,
        er.folio,
        er.fecha_creacion,
        COALESCE(er.estado, ''pendiente''),
        er.comentario,
        er.creado_por
    FROM entry_requests er
    WHERE er.tipo = ''entrada''
    AND NOT EXISTS (SELECT 1 FROM entradas WHERE entradas.id = er.id)';
END
ELSE IF @hasFechaCreacion = 1 AND @hasCreadoPor = 0
BEGIN
    SET @sqlEntradas = N'
    INSERT INTO entradas (id, folio, fecha_creacion, estado, comentario, creado_por)
    SELECT 
        er.id,
        er.folio,
        er.fecha_creacion,
        COALESCE(er.estado, ''pendiente''),
        er.comentario,
        NULL
    FROM entry_requests er
    WHERE er.tipo = ''entrada''
    AND NOT EXISTS (SELECT 1 FROM entradas WHERE entradas.id = er.id)';
END
ELSE IF @hasCreatedAt = 1 AND @hasCreadoPor = 1
BEGIN
    SET @sqlEntradas = N'
    INSERT INTO entradas (id, folio, fecha_creacion, estado, comentario, creado_por)
    SELECT 
        er.id,
        er.folio,
        er.created_at,
        COALESCE(er.estado, ''pendiente''),
        er.comentario,
        er.creado_por
    FROM entry_requests er
    WHERE er.tipo = ''entrada''
    AND NOT EXISTS (SELECT 1 FROM entradas WHERE entradas.id = er.id)';
END
ELSE IF @hasCreatedAt = 1 AND @hasCreadoPor = 0
BEGIN
    SET @sqlEntradas = N'
    INSERT INTO entradas (id, folio, fecha_creacion, estado, comentario, creado_por)
    SELECT 
        er.id,
        er.folio,
        er.created_at,
        COALESCE(er.estado, ''pendiente''),
        er.comentario,
        NULL
    FROM entry_requests er
    WHERE er.tipo = ''entrada''
    AND NOT EXISTS (SELECT 1 FROM entradas WHERE entradas.id = er.id)';
END
ELSE
BEGIN
    SET @sqlEntradas = N'
    INSERT INTO entradas (id, folio, fecha_creacion, estado, comentario, creado_por)
    SELECT 
        er.id,
        er.folio,
        GETDATE(),
        COALESCE(er.estado, ''pendiente''),
        er.comentario,
        NULL
    FROM entry_requests er
    WHERE er.tipo = ''entrada''
    AND NOT EXISTS (SELECT 1 FROM entradas WHERE entradas.id = er.id)';
END

IF @sqlEntradas IS NOT NULL
BEGIN
    EXEC sp_executesql @sqlEntradas;
    PRINT '✓ Datos de entradas migrados';
END

-- Migrar items de entradas
DECLARE @sqlEntradaItems NVARCHAR(MAX);
IF @hasSolicitudId = 1 AND @hasMedicamentoId = 1 AND @hasCantidad = 1
BEGIN
    SET @sqlEntradaItems = N'
    INSERT INTO entrada_items (id, entrada_id, medicamento_id, cantidad)
    SELECT 
        ei.id,
        ei.solicitud_id,
        ei.medicamento_id,
        ei.cantidad
    FROM entry_items ei
    INNER JOIN entradas e ON ei.solicitud_id = e.id
    WHERE NOT EXISTS (SELECT 1 FROM entrada_items WHERE entrada_items.id = ei.id)';
END
ELSE IF @hasEntryRequestId = 1 AND @hasMedicationId = 1 AND @hasQty = 1
BEGIN
    SET @sqlEntradaItems = N'
    INSERT INTO entrada_items (id, entrada_id, medicamento_id, cantidad)
    SELECT 
        ei.id,
        ei.entry_request_id,
        ei.medication_id,
        ei.qty
    FROM entry_items ei
    INNER JOIN entradas e ON ei.entry_request_id = e.id
    WHERE NOT EXISTS (SELECT 1 FROM entrada_items WHERE entrada_items.id = ei.id)';
END

IF @sqlEntradaItems IS NOT NULL
BEGIN
    EXEC sp_executesql @sqlEntradaItems;
    PRINT '✓ Items de entradas migrados';
END
ELSE
BEGIN
    PRINT '⚠ No se pudo migrar items de entradas: nombres de columnas no reconocidos';
END
GO

-- ============================================================
-- PASO 10: Migrar datos de SALIDAS
-- ============================================================
PRINT '========================================';
PRINT 'MIGRANDO DATOS DE SALIDAS';
PRINT '========================================';

-- Re-declarar variables después de GO
DECLARE @hasFechaCreacionSalidas BIT = 0;
DECLARE @hasCreatedAtSalidas BIT = 0;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'fecha_creacion')
    SET @hasFechaCreacionSalidas = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'created_at')
    SET @hasCreatedAtSalidas = 1;

DECLARE @hasSolicitudId BIT = 0;
DECLARE @hasEntryRequestId BIT = 0;
DECLARE @hasMedicamentoId BIT = 0;
DECLARE @hasMedicationId BIT = 0;
DECLARE @hasCantidad BIT = 0;
DECLARE @hasQty BIT = 0;

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'solicitud_id')
    SET @hasSolicitudId = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'entry_request_id')
    SET @hasEntryRequestId = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'medicamento_id')
    SET @hasMedicamentoId = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'medication_id')
    SET @hasMedicationId = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'cantidad')
    SET @hasCantidad = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'qty')
    SET @hasQty = 1;

-- Verificar si creado_por existe en entry_requests
DECLARE @hasCreadoPorSalidas BIT = 0;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'creado_por')
    SET @hasCreadoPorSalidas = 1;

DECLARE @sqlSalidas NVARCHAR(MAX);
IF @hasFechaCreacionSalidas = 1 AND @hasCreadoPorSalidas = 1
BEGIN
    SET @sqlSalidas = N'
    INSERT INTO salidas (id, folio, paciente_id, fecha_creacion, estado, fecha_vencimiento, comentario, creado_por)
    SELECT 
        er.id,
        er.folio,
        er.paciente_id,
        er.fecha_creacion,
        COALESCE(er.estado, ''pendiente''),
        er.fecha_vencimiento,
        er.comentario,
        er.creado_por
    FROM entry_requests er
    WHERE er.tipo = ''salida''
    AND NOT EXISTS (SELECT 1 FROM salidas WHERE salidas.id = er.id)';
END
ELSE IF @hasFechaCreacionSalidas = 1 AND @hasCreadoPorSalidas = 0
BEGIN
    SET @sqlSalidas = N'
    INSERT INTO salidas (id, folio, paciente_id, fecha_creacion, estado, fecha_vencimiento, comentario, creado_por)
    SELECT 
        er.id,
        er.folio,
        er.paciente_id,
        er.fecha_creacion,
        COALESCE(er.estado, ''pendiente''),
        er.fecha_vencimiento,
        er.comentario,
        NULL
    FROM entry_requests er
    WHERE er.tipo = ''salida''
    AND NOT EXISTS (SELECT 1 FROM salidas WHERE salidas.id = er.id)';
END
ELSE IF @hasCreatedAtSalidas = 1 AND @hasCreadoPorSalidas = 1
BEGIN
    SET @sqlSalidas = N'
    INSERT INTO salidas (id, folio, paciente_id, fecha_creacion, estado, fecha_vencimiento, comentario, creado_por)
    SELECT 
        er.id,
        er.folio,
        er.paciente_id,
        er.created_at,
        COALESCE(er.estado, ''pendiente''),
        er.fecha_vencimiento,
        er.comentario,
        er.creado_por
    FROM entry_requests er
    WHERE er.tipo = ''salida''
    AND NOT EXISTS (SELECT 1 FROM salidas WHERE salidas.id = er.id)';
END
ELSE IF @hasCreatedAtSalidas = 1 AND @hasCreadoPorSalidas = 0
BEGIN
    SET @sqlSalidas = N'
    INSERT INTO salidas (id, folio, paciente_id, fecha_creacion, estado, fecha_vencimiento, comentario, creado_por)
    SELECT 
        er.id,
        er.folio,
        er.paciente_id,
        er.created_at,
        COALESCE(er.estado, ''pendiente''),
        er.fecha_vencimiento,
        er.comentario,
        NULL
    FROM entry_requests er
    WHERE er.tipo = ''salida''
    AND NOT EXISTS (SELECT 1 FROM salidas WHERE salidas.id = er.id)';
END
ELSE
BEGIN
    SET @sqlSalidas = N'
    INSERT INTO salidas (id, folio, paciente_id, fecha_creacion, estado, fecha_vencimiento, comentario, creado_por)
    SELECT 
        er.id,
        er.folio,
        er.paciente_id,
        GETDATE(),
        COALESCE(er.estado, ''pendiente''),
        er.fecha_vencimiento,
        er.comentario,
        NULL
    FROM entry_requests er
    WHERE er.tipo = ''salida''
    AND NOT EXISTS (SELECT 1 FROM salidas WHERE salidas.id = er.id)';
END

IF @sqlSalidas IS NOT NULL
BEGIN
    EXEC sp_executesql @sqlSalidas;
    PRINT '✓ Datos de salidas migrados';
END

-- Migrar items de salidas (verificar nombres de columnas)
DECLARE @sqlSalidaItems NVARCHAR(MAX);
IF @hasSolicitudId = 1 AND @hasMedicamentoId = 1 AND @hasCantidad = 1
BEGIN
    SET @sqlSalidaItems = N'
    INSERT INTO salida_items (id, salida_id, medicamento_id, cantidad, dosis_recomendada, frecuencia, fecha_caducidad)
    SELECT 
        ei.id,
        ei.solicitud_id,
        ei.medicamento_id,
        ei.cantidad,
        ei.dosis_recomendada,
        ei.frecuencia,
        ei.fecha_caducidad
    FROM entry_items ei
    INNER JOIN salidas s ON ei.solicitud_id = s.id
    WHERE NOT EXISTS (SELECT 1 FROM salida_items WHERE salida_items.id = ei.id)';
END
ELSE IF @hasEntryRequestId = 1 AND @hasMedicationId = 1 AND @hasQty = 1
BEGIN
    SET @sqlSalidaItems = N'
    INSERT INTO salida_items (id, salida_id, medicamento_id, cantidad, dosis_recomendada, frecuencia, fecha_caducidad)
    SELECT 
        ei.id,
        ei.entry_request_id,
        ei.medication_id,
        ei.qty,
        ei.dosis_recomendada,
        ei.frecuencia,
        ei.fecha_caducidad
    FROM entry_items ei
    INNER JOIN salidas s ON ei.entry_request_id = s.id
    WHERE NOT EXISTS (SELECT 1 FROM salida_items WHERE salida_items.id = ei.id)';
END

IF @sqlSalidaItems IS NOT NULL
BEGIN
    EXEC sp_executesql @sqlSalidaItems;
    PRINT '✓ Items de salidas migrados';
END
ELSE
BEGIN
    PRINT '⚠ No se pudo migrar items de salidas: nombres de columnas no reconocidos';
END
GO

-- ============================================================
-- PASO 11: Asegurar que fecha_registro existe en caducidades (ya se hizo en PASO 6.1)
-- Este paso se mantiene por compatibilidad pero ya no es necesario
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro')
BEGIN
    -- Eliminar columnas antiguas si existen
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_creacion')
    BEGIN
        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_caducidades_fecha_creacion' AND object_id = OBJECT_ID('caducidades'))
        BEGIN
            DROP INDEX idx_caducidades_fecha_creacion ON caducidades;
        END
        ALTER TABLE caducidades DROP COLUMN fecha_creacion;
        PRINT '✓ Columna fecha_creacion eliminada';
    END
    
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_entrada_original')
    BEGIN
        ALTER TABLE caducidades DROP COLUMN fecha_entrada_original;
        PRINT '✓ Columna fecha_entrada_original eliminada';
    END
    
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro_caducidad')
    BEGIN
        DECLARE @constraintNameCaducidad NVARCHAR(200);
        SELECT @constraintNameCaducidad = name 
        FROM sys.default_constraints 
        WHERE parent_object_id = OBJECT_ID('caducidades') 
        AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('caducidades') AND name = 'fecha_registro_caducidad');
        
        IF @constraintNameCaducidad IS NOT NULL
        BEGIN
            EXEC('ALTER TABLE caducidades DROP CONSTRAINT ' + @constraintNameCaducidad);
        END
        
        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_caducidades_fecha_registro_caducidad' AND object_id = OBJECT_ID('caducidades'))
        BEGIN
            DROP INDEX idx_caducidades_fecha_registro_caducidad ON caducidades;
        END
        
        ALTER TABLE caducidades DROP COLUMN fecha_registro_caducidad;
        PRINT '✓ Columna fecha_registro_caducidad eliminada';
    END
    
    -- Agregar fecha_registro
    ALTER TABLE caducidades ADD fecha_registro DATETIME2 NULL;
    UPDATE caducidades SET fecha_registro = GETDATE() WHERE fecha_registro IS NULL;
    ALTER TABLE caducidades ALTER COLUMN fecha_registro DATETIME2 NOT NULL;
    ALTER TABLE caducidades ADD CONSTRAINT DF_caducidades_fecha_registro DEFAULT GETDATE() FOR fecha_registro;
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_caducidades_fecha_registro' AND object_id = OBJECT_ID('caducidades'))
    BEGIN
        CREATE INDEX idx_caducidades_fecha_registro ON caducidades(fecha_registro);
    END
    
    PRINT '✓ Columna fecha_registro agregada a caducidades';
END
ELSE
BEGIN
    PRINT '✓ Columna fecha_registro ya existe en caducidades';
END
GO

-- ============================================================
-- PASO 12: Migrar datos de CADUCIDADES
-- ============================================================
PRINT '========================================';
PRINT 'MIGRANDO DATOS DE CADUCIDADES';
PRINT '========================================';

-- Re-declarar variables después de GO
DECLARE @hasFechaCreacionCaducidades BIT = 0;
DECLARE @hasCreatedAtCaducidades BIT = 0;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'fecha_creacion')
    SET @hasFechaCreacionCaducidades = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'created_at')
    SET @hasCreatedAtCaducidades = 1;

DECLARE @hasSolicitudId BIT = 0;
DECLARE @hasEntryRequestId BIT = 0;
DECLARE @hasMedicamentoId BIT = 0;
DECLARE @hasMedicationId BIT = 0;
DECLARE @hasCantidad BIT = 0;
DECLARE @hasQty BIT = 0;

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'solicitud_id')
    SET @hasSolicitudId = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'entry_request_id')
    SET @hasEntryRequestId = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'medicamento_id')
    SET @hasMedicamentoId = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'medication_id')
    SET @hasMedicationId = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'cantidad')
    SET @hasCantidad = 1;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'qty')
    SET @hasQty = 1;

-- Verificar si creado_por existe en entry_requests
DECLARE @hasCreadoPorCaducidades BIT = 0;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'creado_por')
    SET @hasCreadoPorCaducidades = 1;

DECLARE @sqlCaducidades NVARCHAR(MAX);
IF @hasFechaCreacionCaducidades = 1 AND @hasCreadoPorCaducidades = 1
BEGIN
    SET @sqlCaducidades = N'
    INSERT INTO caducidades (id, folio, fecha_registro, estado, comentario, creado_por)
    SELECT 
        er.id,
        er.folio,
        er.fecha_creacion,
        COALESCE(er.estado, ''pendiente''),
        er.comentario,
        er.creado_por
    FROM entry_requests er
    WHERE er.tipo = ''caducidad''
    AND NOT EXISTS (SELECT 1 FROM caducidades WHERE caducidades.id = er.id)';
END
ELSE IF @hasFechaCreacionCaducidades = 1 AND @hasCreadoPorCaducidades = 0
BEGIN
    SET @sqlCaducidades = N'
    INSERT INTO caducidades (id, folio, fecha_registro, estado, comentario, creado_por)
    SELECT 
        er.id,
        er.folio,
        er.fecha_creacion,
        COALESCE(er.estado, ''pendiente''),
        er.comentario,
        NULL
    FROM entry_requests er
    WHERE er.tipo = ''caducidad''
    AND NOT EXISTS (SELECT 1 FROM caducidades WHERE caducidades.id = er.id)';
END
ELSE IF @hasCreatedAtCaducidades = 1 AND @hasCreadoPorCaducidades = 1
BEGIN
    SET @sqlCaducidades = N'
    INSERT INTO caducidades (id, folio, fecha_registro, estado, comentario, creado_por)
    SELECT 
        er.id,
        er.folio,
        er.created_at,
        COALESCE(er.estado, ''pendiente''),
        er.comentario,
        er.creado_por
    FROM entry_requests er
    WHERE er.tipo = ''caducidad''
    AND NOT EXISTS (SELECT 1 FROM caducidades WHERE caducidades.id = er.id)';
END
ELSE IF @hasCreatedAtCaducidades = 1 AND @hasCreadoPorCaducidades = 0
BEGIN
    SET @sqlCaducidades = N'
    INSERT INTO caducidades (id, folio, fecha_registro, estado, comentario, creado_por)
    SELECT 
        er.id,
        er.folio,
        er.created_at,
        COALESCE(er.estado, ''pendiente''),
        er.comentario,
        NULL
    FROM entry_requests er
    WHERE er.tipo = ''caducidad''
    AND NOT EXISTS (SELECT 1 FROM caducidades WHERE caducidades.id = er.id)';
END
ELSE
BEGIN
    SET @sqlCaducidades = N'
    INSERT INTO caducidades (id, folio, fecha_registro, estado, comentario, creado_por)
    SELECT 
        er.id,
        er.folio,
        GETDATE(),
        COALESCE(er.estado, ''pendiente''),
        er.comentario,
        NULL
    FROM entry_requests er
    WHERE er.tipo = ''caducidad''
    AND NOT EXISTS (SELECT 1 FROM caducidades WHERE caducidades.id = er.id)';
END

IF @sqlCaducidades IS NOT NULL
BEGIN
    EXEC sp_executesql @sqlCaducidades;
    PRINT '✓ Datos de caducidades migrados';
END

-- Migrar items de caducidades (con fecha de caducidad del medicamento)
DECLARE @sqlCaducidadItems NVARCHAR(MAX);
IF @hasSolicitudId = 1 AND @hasMedicamentoId = 1 AND @hasCantidad = 1
BEGIN
    SET @sqlCaducidadItems = N'
    INSERT INTO caducidad_items (id, caducidad_id, medicamento_id, cantidad, fecha_caducidad)
    SELECT 
        ei.id,
        ei.solicitud_id,
        ei.medicamento_id,
        ei.cantidad,
        m.fecha_vencimiento
    FROM entry_items ei
    INNER JOIN caducidades c ON ei.solicitud_id = c.id
    INNER JOIN medications m ON ei.medicamento_id = m.id
    WHERE NOT EXISTS (SELECT 1 FROM caducidad_items WHERE caducidad_items.id = ei.id)';
END
ELSE IF @hasEntryRequestId = 1 AND @hasMedicationId = 1 AND @hasQty = 1
BEGIN
    SET @sqlCaducidadItems = N'
    INSERT INTO caducidad_items (id, caducidad_id, medicamento_id, cantidad, fecha_caducidad)
    SELECT 
        ei.id,
        ei.entry_request_id,
        ei.medication_id,
        ei.qty,
        m.fecha_vencimiento
    FROM entry_items ei
    INNER JOIN caducidades c ON ei.entry_request_id = c.id
    INNER JOIN medications m ON ei.medication_id = m.id
    WHERE NOT EXISTS (SELECT 1 FROM caducidad_items WHERE caducidad_items.id = ei.id)';
END

IF @sqlCaducidadItems IS NOT NULL
BEGIN
    EXEC sp_executesql @sqlCaducidadItems;
    PRINT '✓ Items de caducidades migrados (con fecha de caducidad del medicamento)';
END
ELSE
BEGIN
    PRINT '⚠ No se pudo migrar items de caducidades: nombres de columnas no reconocidos';
END
GO

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
PRINT '========================================';
PRINT 'VERIFICACIÓN FINAL';
PRINT '========================================';

SELECT 'entradas' as Tabla, COUNT(*) as Registros FROM entradas
UNION ALL
SELECT 'entrada_items', COUNT(*) FROM entrada_items
UNION ALL
SELECT 'salidas', COUNT(*) FROM salidas
UNION ALL
SELECT 'salida_items', COUNT(*) FROM salida_items
UNION ALL
SELECT 'caducidades', COUNT(*) FROM caducidades
UNION ALL
SELECT 'caducidad_items', COUNT(*) FROM caducidad_items;

PRINT '========================================';
PRINT 'MIGRACIÓN COMPLETADA';
PRINT '========================================';
PRINT 'NOTA: Las tablas antiguas (entry_requests, entry_items)';
PRINT 'se mantienen por seguridad. Puedes eliminarlas después';
PRINT 'de verificar que todo funciona correctamente.';
PRINT '========================================';

