-- ============================================
-- MIGRACIÓN: Separar entry_requests en 3 tablas
-- ============================================
-- Este script crea 3 tablas separadas: entradas, salidas, caducidades
-- y migra los datos existentes de entry_requests

-- ============================================
-- 1. CREAR TABLA DE ENTRADAS
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[entradas]') AND type in (N'U'))
BEGIN
    CREATE TABLE entradas (
        id NVARCHAR(36) PRIMARY KEY,
        folio NVARCHAR(20) NOT NULL UNIQUE,
        fecha_creacion DATETIME2 DEFAULT GETDATE(),
        estado NVARCHAR(50) NOT NULL DEFAULT 'completa',
        comentario NVARCHAR(MAX) NULL,
        creado_por NVARCHAR(36) NULL,
        CONSTRAINT FK_entradas_creado_por FOREIGN KEY (creado_por) REFERENCES users(id)
    );
    
    CREATE INDEX idx_entradas_folio ON entradas(folio);
    CREATE INDEX idx_entradas_fecha_creacion ON entradas(fecha_creacion);
    CREATE INDEX idx_entradas_estado ON entradas(estado);
END
GO

-- ============================================
-- 2. CREAR TABLA DE SALIDAS
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
        creado_por NVARCHAR(36) NULL,
        CONSTRAINT FK_salidas_paciente FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE,
        CONSTRAINT FK_salidas_creado_por FOREIGN KEY (creado_por) REFERENCES users(id)
    );
    
    CREATE INDEX idx_salidas_folio ON salidas(folio);
    CREATE INDEX idx_salidas_paciente_id ON salidas(paciente_id);
    CREATE INDEX idx_salidas_fecha_creacion ON salidas(fecha_creacion);
    CREATE INDEX idx_salidas_estado ON salidas(estado);
END
GO

-- ============================================
-- 3. CREAR TABLA DE CADUCIDADES
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[caducidades]') AND type in (N'U'))
BEGIN
    CREATE TABLE caducidades (
        id NVARCHAR(36) PRIMARY KEY,
        folio NVARCHAR(20) NOT NULL UNIQUE,
        fecha_registro DATETIME2 DEFAULT GETDATE(), -- Fecha cuando se registra la caducidad (igual que entrada y salida)
        estado NVARCHAR(50) NOT NULL DEFAULT 'completa',
        comentario NVARCHAR(MAX) NULL,
        creado_por NVARCHAR(36) NULL,
        CONSTRAINT FK_caducidades_creado_por FOREIGN KEY (creado_por) REFERENCES users(id)
    );
    
    CREATE INDEX idx_caducidades_folio ON caducidades(folio);
    CREATE INDEX idx_caducidades_fecha_registro ON caducidades(fecha_registro);
    CREATE INDEX idx_caducidades_estado ON caducidades(estado);
END
GO

-- Si la tabla ya existe, eliminar columnas antiguas y agregar fecha_registro si no existe
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[caducidades]') AND type in (N'U'))
BEGIN
    -- Eliminar fecha_creacion si existe (la quitamos)
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_creacion')
    BEGIN
        -- Eliminar índice primero si existe
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
        PRINT 'Columna fecha_registro agregada';
        
        -- Si existe fecha_registro_caducidad, copiar sus valores
        IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro_caducidad')
        BEGIN
            EXEC sp_executesql N'UPDATE caducidades SET fecha_registro = fecha_registro_caducidad WHERE fecha_registro IS NULL';
            PRINT 'Valores copiados de fecha_registro_caducidad';
        END
    END
    
    -- Eliminar columnas antiguas si existen
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_entrada_original')
    BEGIN
        ALTER TABLE caducidades DROP COLUMN fecha_entrada_original;
        PRINT 'Columna fecha_entrada_original eliminada';
    END
    
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'caducidades' AND COLUMN_NAME = 'fecha_registro_caducidad')
    BEGIN
        ALTER TABLE caducidades DROP COLUMN fecha_registro_caducidad;
        PRINT 'Columna fecha_registro_caducidad eliminada';
    END
    
    -- Crear índice de fecha_registro si no existe
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_caducidades_fecha_registro' AND object_id = OBJECT_ID('caducidades'))
    BEGIN
        CREATE INDEX idx_caducidades_fecha_registro ON caducidades(fecha_registro);
    END
END
GO

-- ============================================
-- 4. CREAR TABLAS DE ITEMS PARA CADA TIPO
-- ============================================

-- Items de Entradas
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[entrada_items]') AND type in (N'U'))
BEGIN
    CREATE TABLE entrada_items (
        id NVARCHAR(36) PRIMARY KEY,
        entrada_id NVARCHAR(36) NOT NULL,
        medicamento_id NVARCHAR(36) NOT NULL,
        cantidad INT NOT NULL,
        CONSTRAINT FK_entrada_items_entrada FOREIGN KEY (entrada_id) REFERENCES entradas(id) ON DELETE CASCADE,
        CONSTRAINT FK_entrada_items_medicamento FOREIGN KEY (medicamento_id) REFERENCES medications(id) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_entrada_items_entrada_id ON entrada_items(entrada_id);
    CREATE INDEX idx_entrada_items_medicamento_id ON entrada_items(medicamento_id);
END
GO

-- Items de Salidas
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[salida_items]') AND type in (N'U'))
BEGIN
    CREATE TABLE salida_items (
        id NVARCHAR(36) PRIMARY KEY,
        salida_id NVARCHAR(36) NOT NULL,
        medicamento_id NVARCHAR(36) NOT NULL,
        cantidad INT NOT NULL,
        dosis_recomendada NVARCHAR(255) NULL,
        frecuencia NVARCHAR(255) NULL,
        fecha_caducidad NVARCHAR(50) NULL,
        CONSTRAINT FK_salida_items_salida FOREIGN KEY (salida_id) REFERENCES salidas(id) ON DELETE CASCADE,
        CONSTRAINT FK_salida_items_medicamento FOREIGN KEY (medicamento_id) REFERENCES medications(id) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_salida_items_salida_id ON salida_items(salida_id);
    CREATE INDEX idx_salida_items_medicamento_id ON salida_items(medicamento_id);
END
GO

-- Items de Caducidades
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[caducidad_items]') AND type in (N'U'))
BEGIN
    CREATE TABLE caducidad_items (
        id NVARCHAR(36) PRIMARY KEY,
        caducidad_id NVARCHAR(36) NOT NULL,
        medicamento_id NVARCHAR(36) NOT NULL,
        cantidad INT NOT NULL,
        fecha_caducidad NVARCHAR(50) NULL,
        CONSTRAINT FK_caducidad_items_caducidad FOREIGN KEY (caducidad_id) REFERENCES caducidades(id) ON DELETE CASCADE,
        CONSTRAINT FK_caducidad_items_medicamento FOREIGN KEY (medicamento_id) REFERENCES medications(id) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_caducidad_items_caducidad_id ON caducidad_items(caducidad_id);
    CREATE INDEX idx_caducidad_items_medicamento_id ON caducidad_items(medicamento_id);
END
GO

-- ============================================
-- 5. AGREGAR COLUMNA COMENTARIO SI NO EXISTE
-- ============================================
-- Agregar columna comentario a entry_requests si no existe (para migración)
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[entry_requests]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'comentario')
    BEGIN
        ALTER TABLE entry_requests ADD comentario NVARCHAR(MAX) NULL;
        PRINT 'Columna comentario agregada a entry_requests';
    END
END
GO

-- ============================================
-- 6. MIGRAR DATOS EXISTENTES (si existen)
-- ============================================
-- Migrar entradas
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[entry_requests]') AND type in (N'U'))
BEGIN
    -- Verificar qué columna de fecha existe
    DECLARE @fechaColumnaEntradas NVARCHAR(50) = NULL;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'fecha_creacion')
        SET @fechaColumnaEntradas = 'fecha_creacion';
    ELSE IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'created_at')
        SET @fechaColumnaEntradas = 'created_at';
    
    IF @fechaColumnaEntradas IS NOT NULL
    BEGIN
        DECLARE @sqlEntradas NVARCHAR(MAX);
        SET @sqlEntradas = N'
        INSERT INTO entradas (id, folio, fecha_creacion, estado, comentario, creado_por)
        SELECT 
            er.id,
            er.folio,
            er.' + @fechaColumnaEntradas + N' as fecha_creacion,
            er.estado,
            ISNULL(er.comentario, NULL) as comentario,
            NULL as creado_por
        FROM entry_requests er
        WHERE er.tipo = ''entrada''
        AND NOT EXISTS (SELECT 1 FROM entradas e WHERE e.id = er.id)';
        
        EXEC sp_executesql @sqlEntradas;
    END
    ELSE
    BEGIN
        -- Si no existe ninguna columna de fecha, usar GETDATE()
        INSERT INTO entradas (id, folio, fecha_creacion, estado, comentario, creado_por)
        SELECT 
            er.id,
            er.folio,
            GETDATE() as fecha_creacion,
            er.estado,
            ISNULL(er.comentario, NULL) as comentario,
            NULL as creado_por
        FROM entry_requests er
        WHERE er.tipo = 'entrada'
        AND NOT EXISTS (SELECT 1 FROM entradas e WHERE e.id = er.id);
    END
    
    -- Migrar items de entradas (solo si no existen)
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[entry_items]') AND type in (N'U'))
    BEGIN
        INSERT INTO entrada_items (id, entrada_id, medicamento_id, cantidad)
        SELECT 
            ei.id,
            ei.solicitud_id,
            ei.medicamento_id,
            ei.cantidad
        FROM entry_items ei
        INNER JOIN entry_requests er ON ei.solicitud_id = er.id
        WHERE er.tipo = 'entrada'
        AND NOT EXISTS (SELECT 1 FROM entrada_items e WHERE e.id = ei.id);
    END
END
GO

-- Migrar salidas
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[entry_requests]') AND type in (N'U'))
BEGIN
    -- Verificar qué columna de fecha existe en entry_requests
    DECLARE @fechaColumnaSalidas NVARCHAR(50) = NULL;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'fecha_creacion')
        SET @fechaColumnaSalidas = 'fecha_creacion';
    ELSE IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'created_at')
        SET @fechaColumnaSalidas = 'created_at';
    
    IF @fechaColumnaSalidas IS NOT NULL
    BEGIN
        DECLARE @sqlSalidas NVARCHAR(MAX);
        SET @sqlSalidas = N'
        INSERT INTO salidas (id, folio, paciente_id, fecha_creacion, estado, fecha_vencimiento, comentario, creado_por)
        SELECT 
            er.id,
            er.folio,
            er.paciente_id,
            er.' + @fechaColumnaSalidas + N' as fecha_creacion,
            er.estado,
            er.fecha_vencimiento,
            er.comentario,
            NULL as creado_por
        FROM entry_requests er
        WHERE er.tipo = ''salida''
        AND NOT EXISTS (SELECT 1 FROM salidas s WHERE s.id = er.id)';
        
        EXEC sp_executesql @sqlSalidas;
    END
    ELSE
    BEGIN
        -- Si no existe ninguna columna de fecha, usar GETDATE()
        INSERT INTO salidas (id, folio, paciente_id, fecha_creacion, estado, fecha_vencimiento, comentario, creado_por)
        SELECT 
            er.id,
            er.folio,
            er.paciente_id,
            GETDATE() as fecha_creacion,
            er.estado,
            er.fecha_vencimiento,
            er.comentario,
            NULL as creado_por
        FROM entry_requests er
        WHERE er.tipo = 'salida'
        AND NOT EXISTS (SELECT 1 FROM salidas s WHERE s.id = er.id);
    END
    
    -- Migrar items de salidas (solo si no existen)
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[entry_items]') AND type in (N'U'))
    BEGIN
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
        INNER JOIN entry_requests er ON ei.solicitud_id = er.id
        WHERE er.tipo = 'salida'
        AND NOT EXISTS (SELECT 1 FROM salida_items s WHERE s.id = ei.id);
    END
END
GO

-- Migrar caducidades
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[entry_requests]') AND type in (N'U'))
BEGIN
    -- Verificar qué columna de fecha existe en entry_requests (dentro del bloque para evitar problemas con GO)
    DECLARE @fechaColumnaCaducidades NVARCHAR(50) = NULL;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'fecha_creacion')
        SET @fechaColumnaCaducidades = 'fecha_creacion';
    ELSE IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'created_at')
        SET @fechaColumnaCaducidades = 'created_at';
    
    IF @fechaColumnaCaducidades IS NOT NULL
    BEGIN
        DECLARE @sqlCaducidades NVARCHAR(MAX);
        SET @sqlCaducidades = N'
        INSERT INTO caducidades (id, folio, fecha_registro, estado, comentario, creado_por)
        SELECT 
            er.id,
            er.folio,
            er.' + @fechaColumnaCaducidades + N' as fecha_registro,
            er.estado,
            ISNULL(er.comentario, NULL) as comentario,
            NULL as creado_por
        FROM entry_requests er
        WHERE er.tipo = ''caducidad''
        AND NOT EXISTS (SELECT 1 FROM caducidades c WHERE c.id = er.id)';
        
        EXEC sp_executesql @sqlCaducidades;
    END
    ELSE
    BEGIN
        -- Si no existe ninguna columna de fecha, usar GETDATE()
        INSERT INTO caducidades (id, folio, fecha_registro, estado, comentario, creado_por)
        SELECT 
            er.id,
            er.folio,
            GETDATE() as fecha_registro,
            er.estado,
            ISNULL(er.comentario, NULL) as comentario,
            NULL as creado_por
        FROM entry_requests er
        WHERE er.tipo = 'caducidad'
        AND NOT EXISTS (SELECT 1 FROM caducidades c WHERE c.id = er.id);
    END
    
    -- Migrar items de caducidades (solo si no existen)
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[entry_items]') AND type in (N'U'))
    BEGIN
        -- Obtener fecha de caducidad del medicamento si no está en entry_items
        INSERT INTO caducidad_items (id, caducidad_id, medicamento_id, cantidad, fecha_caducidad)
        SELECT 
            ei.id,
            ei.solicitud_id,
            ei.medicamento_id,
            ei.cantidad,
            COALESCE(
                ei.fecha_caducidad,
                (SELECT m.fecha_vencimiento FROM medications m WHERE m.id = ei.medicamento_id)
            ) as fecha_caducidad
        FROM entry_items ei
        INNER JOIN entry_requests er ON ei.solicitud_id = er.id
        WHERE er.tipo = 'caducidad'
        AND NOT EXISTS (SELECT 1 FROM caducidad_items c WHERE c.id = ei.id);
    END
END
GO

PRINT 'Migración completada. Las nuevas tablas han sido creadas y los datos migrados.';
PRINT 'NOTA: Las tablas antiguas (entry_requests, entry_items) se mantienen por seguridad.';
PRINT 'Puedes eliminarlas después de verificar que todo funciona correctamente.';

