-- Script para agregar índices que mejoran el rendimiento de las consultas de entradas
-- Ejecutar este script en la base de datos de producción

-- Índice en entry_requests para filtros por tipo
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_entry_requests_tipo' AND object_id = OBJECT_ID('entry_requests'))
BEGIN
    CREATE INDEX IX_entry_requests_tipo ON entry_requests(tipo);
    PRINT '✓ Índice IX_entry_requests_tipo creado';
END
GO

-- Índice en entry_requests para ordenamiento por fecha
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_entry_requests_fecha_creacion' AND object_id = OBJECT_ID('entry_requests'))
BEGIN
    CREATE INDEX IX_entry_requests_fecha_creacion ON entry_requests(fecha_creacion DESC);
    PRINT '✓ Índice IX_entry_requests_fecha_creacion creado';
END
GO

-- Índice compuesto para tipo y fecha (optimiza consultas filtradas por tipo)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_entry_requests_tipo_fecha' AND object_id = OBJECT_ID('entry_requests'))
BEGIN
    CREATE INDEX IX_entry_requests_tipo_fecha ON entry_requests(tipo, fecha_creacion DESC);
    PRINT '✓ Índice IX_entry_requests_tipo_fecha creado';
END
GO

-- Índice en entry_items para la relación con entry_requests (muy importante para JOINs)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_entry_items_solicitud_id' AND object_id = OBJECT_ID('entry_items'))
BEGIN
    CREATE INDEX IX_entry_items_solicitud_id ON entry_items(solicitud_id);
    PRINT '✓ Índice IX_entry_items_solicitud_id creado';
END
GO

-- Índice en entry_requests para paciente_id (si se filtra por paciente)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_entry_requests_paciente_id' AND object_id = OBJECT_ID('entry_requests'))
BEGIN
    CREATE INDEX IX_entry_requests_paciente_id ON entry_requests(paciente_id);
    PRINT '✓ Índice IX_entry_requests_paciente_id creado';
END
GO

PRINT '✓ Todos los índices han sido creados o ya existían';

