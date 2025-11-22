-- Script para crear la base de datos desde cero con todas las columnas en español
-- Ejecuta este script DESPUÉS de haber limpiado la base de datos (reset-db)

-- ============================================
-- CREACIÓN DE TABLAS (desde cero)
-- ============================================

-- Tabla de Usuarios
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    CREATE TABLE users (
        id NVARCHAR(36) PRIMARY KEY,
        nombre NVARCHAR(255) NOT NULL,
        rol NVARCHAR(50) NOT NULL,
        email NVARCHAR(255) NULL,
        hash_contraseña NVARCHAR(255) NULL,
        cambio_contraseña_requerido BIT NOT NULL DEFAULT 1,
        fecha_creacion DATETIME2 DEFAULT GETDATE(),
        edad INT NULL,
        fecha_nacimiento NVARCHAR(50) NULL,
        CONSTRAINT CK_users_rol CHECK(rol IN ('admin', 'nurse', 'doctor', 'usuario', 'reception'))
    );
    PRINT '✓ Tabla users creada';
END
GO

-- Tabla de Pacientes
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[patients]') AND type in (N'U'))
BEGIN
    CREATE TABLE patients (
        id NVARCHAR(36) PRIMARY KEY,
        nombre NVARCHAR(255) NOT NULL,
        fecha_nacimiento NVARCHAR(50) NULL,
        lugar_nacimiento NVARCHAR(255) NULL,
        edad INT NULL,
        direccion NVARCHAR(255) NULL,
        curp NVARCHAR(18) NULL,
        rfc NVARCHAR(13) NULL,
        fecha_ingreso NVARCHAR(50) NULL,
        notas NVARCHAR(MAX) NULL,
        estado NVARCHAR(20) NOT NULL DEFAULT 'activo',
        fecha_baja NVARCHAR(50) NULL,
        motivo_baja NVARCHAR(MAX) NULL,
        fecha_creacion DATETIME2 DEFAULT GETDATE(),
        fecha_actualizacion DATETIME2 DEFAULT GETDATE(),
        creado_por NVARCHAR(36) NULL,
        actualizado_por NVARCHAR(36) NULL,
        CONSTRAINT FK_patients_creado_por FOREIGN KEY (creado_por) REFERENCES users(id),
        CONSTRAINT FK_patients_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES users(id),
        CONSTRAINT CK_patients_estado CHECK (estado IN ('activo', 'baja'))
    );
    PRINT '✓ Tabla patients creada';
END
GO

-- Tabla de Contactos
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[contacts]') AND type in (N'U'))
BEGIN
    CREATE TABLE contacts (
        id NVARCHAR(36) PRIMARY KEY,
        paciente_id NVARCHAR(36) NOT NULL,
        nombre NVARCHAR(255) NOT NULL,
        telefono NVARCHAR(50) NOT NULL,
        relacion NVARCHAR(100) NOT NULL,
        rfc NVARCHAR(13) NULL,
        edad INT NULL,
        direccion NVARCHAR(255) NULL,
        fecha_creacion DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_contacts_paciente FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE
    );
    PRINT '✓ Tabla contacts creada';
END
GO

-- Tabla de Medicamentos
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[medications]') AND type in (N'U'))
BEGIN
    CREATE TABLE medications (
        id NVARCHAR(36) PRIMARY KEY,
        nombre NVARCHAR(255) NOT NULL,
        cantidad INT NOT NULL,
        fecha_vencimiento NVARCHAR(50) NOT NULL,
        unidad NVARCHAR(50) NULL,
        dosis NVARCHAR(255) NULL,
        fecha_creacion DATETIME2 DEFAULT GETDATE(),
        fecha_actualizacion DATETIME2 DEFAULT GETDATE(),
        creado_por NVARCHAR(36) NULL,
        actualizado_por NVARCHAR(36) NULL,
        CONSTRAINT FK_medications_creado_por FOREIGN KEY (creado_por) REFERENCES users(id),
        CONSTRAINT FK_medications_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES users(id)
    );
    PRINT '✓ Tabla medications creada';
END
GO

-- Tabla de Solicitudes de Entrada
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[entry_requests]') AND type in (N'U'))
BEGIN
    CREATE TABLE entry_requests (
        id NVARCHAR(36) PRIMARY KEY,
        folio NVARCHAR(20) NOT NULL,
        tipo NVARCHAR(20) NOT NULL,
        paciente_id NVARCHAR(36) NOT NULL,
        fecha_creacion DATETIME2 DEFAULT GETDATE(),
        estado NVARCHAR(50) NOT NULL,
        fecha_vencimiento NVARCHAR(50) NULL,
        CONSTRAINT FK_entry_requests_paciente FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE,
        CONSTRAINT CK_entry_requests_tipo CHECK(tipo IN ('entrada', 'salida'))
    );
    CREATE UNIQUE INDEX idx_entry_requests_folio ON entry_requests(folio);
    PRINT '✓ Tabla entry_requests creada';
END
GO

-- Tabla de Items de Solicitudes
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[entry_items]') AND type in (N'U'))
BEGIN
    CREATE TABLE entry_items (
        id NVARCHAR(36) PRIMARY KEY,
        solicitud_id NVARCHAR(36) NOT NULL,
        medicamento_id NVARCHAR(36) NOT NULL,
        cantidad INT NOT NULL,
        CONSTRAINT FK_entry_items_solicitud FOREIGN KEY (solicitud_id) REFERENCES entry_requests(id) ON DELETE CASCADE,
        CONSTRAINT FK_entry_items_medicamento FOREIGN KEY (medicamento_id) REFERENCES medications(id) ON DELETE CASCADE
    );
    PRINT '✓ Tabla entry_items creada';
END
GO

-- Tabla de Medicamentos asignados a Pacientes
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[patient_medications]') AND type in (N'U'))
BEGIN
    CREATE TABLE patient_medications (
        id NVARCHAR(36) PRIMARY KEY,
        paciente_id NVARCHAR(36) NOT NULL,
        medicamento_id NVARCHAR(36) NOT NULL,
        dosis NVARCHAR(255) NOT NULL,
        frecuencia NVARCHAR(255) NOT NULL,
        fecha_prescripcion NVARCHAR(50) NOT NULL,
        prescrito_por NVARCHAR(36) NULL,
        CONSTRAINT FK_patient_medications_paciente FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE,
        CONSTRAINT FK_patient_medications_medicamento FOREIGN KEY (medicamento_id) REFERENCES medications(id) ON DELETE CASCADE,
        CONSTRAINT FK_patient_medications_prescrito_por FOREIGN KEY (prescrito_por) REFERENCES users(id)
    );
    PRINT '✓ Tabla patient_medications creada';
END
GO

-- Tabla de Objetos Personales
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[personal_objects]') AND type in (N'U'))
BEGIN
    CREATE TABLE personal_objects (
        id NVARCHAR(36) PRIMARY KEY,
        paciente_id NVARCHAR(36) NOT NULL,
        nombre NVARCHAR(255) NOT NULL,
        cantidad INT NOT NULL,
        fecha_recepcion DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_personal_objects_paciente FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE
    );
    PRINT '✓ Tabla personal_objects creada';
END
GO

-- ============================================
-- CREAR ÍNDICES
-- ============================================

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_patients_nombre' AND object_id = OBJECT_ID('patients'))
BEGIN
    CREATE INDEX idx_patients_nombre ON patients(nombre);
    PRINT '✓ Índice idx_patients_nombre creado';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_contacts_paciente_id' AND object_id = OBJECT_ID('contacts'))
BEGIN
    CREATE INDEX idx_contacts_paciente_id ON contacts(paciente_id);
    PRINT '✓ Índice idx_contacts_paciente_id creado';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_medications_fecha_vencimiento' AND object_id = OBJECT_ID('medications'))
BEGIN
    CREATE INDEX idx_medications_fecha_vencimiento ON medications(fecha_vencimiento);
    PRINT '✓ Índice idx_medications_fecha_vencimiento creado';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_entry_requests_paciente_id' AND object_id = OBJECT_ID('entry_requests'))
BEGIN
    CREATE INDEX idx_entry_requests_paciente_id ON entry_requests(paciente_id);
    PRINT '✓ Índice idx_entry_requests_paciente_id creado';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_entry_requests_estado' AND object_id = OBJECT_ID('entry_requests'))
BEGIN
    CREATE INDEX idx_entry_requests_estado ON entry_requests(estado);
    PRINT '✓ Índice idx_entry_requests_estado creado';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_entry_items_solicitud_id' AND object_id = OBJECT_ID('entry_items'))
BEGIN
    CREATE INDEX idx_entry_items_solicitud_id ON entry_items(solicitud_id);
    PRINT '✓ Índice idx_entry_items_solicitud_id creado';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_patient_medications_paciente_id' AND object_id = OBJECT_ID('patient_medications'))
BEGIN
    CREATE INDEX idx_patient_medications_paciente_id ON patient_medications(paciente_id);
    PRINT '✓ Índice idx_patient_medications_paciente_id creado';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_patient_medications_medicamento_id' AND object_id = OBJECT_ID('patient_medications'))
BEGIN
    CREATE INDEX idx_patient_medications_medicamento_id ON patient_medications(medicamento_id);
    PRINT '✓ Índice idx_patient_medications_medicamento_id creado';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_personal_objects_paciente_id' AND object_id = OBJECT_ID('personal_objects'))
BEGIN
    CREATE INDEX idx_personal_objects_paciente_id ON personal_objects(paciente_id);
    PRINT '✓ Índice idx_personal_objects_paciente_id creado';
END
GO

-- ============================================
-- CREAR USUARIO ADMINISTRADOR INICIAL
-- ============================================
IF NOT EXISTS (SELECT 1 FROM users)
BEGIN
    DECLARE @adminId NVARCHAR(36) = NEWID();
    DECLARE @adminEmail NVARCHAR(255) = 'admin@asilo.com';
    -- Hash SHA256 de 'admin@asilo.com::admin123' = 50f3d9310f55a9e7f2b5b521bad3b9d3e51ca501d18b6d7db566f3429f3697f5
    DECLARE @adminPasswordHash NVARCHAR(255) = '50f3d9310f55a9e7f2b5b521bad3b9d3e51ca501d18b6d7db566f3429f3697f5';
    
    INSERT INTO users (
        id,
        nombre,
        rol,
        email,
        hash_contraseña,
        cambio_contraseña_requerido,
        fecha_creacion
    ) VALUES (
        @adminId,
        'Administrador',
        'admin',
        @adminEmail,
        @adminPasswordHash,
        1,
        GETDATE()
    );
    
    PRINT '✓ Usuario administrador creado:';
    PRINT '  Email: admin@asilo.com';
    PRINT '  Contraseña: admin123';
END
GO

PRINT '';
PRINT '========================================';
PRINT '✓ Base de datos creada correctamente';
PRINT '========================================';
PRINT 'Todas las tablas tienen columnas en español desde el inicio.';
PRINT '';

