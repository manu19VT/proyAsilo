-- Base de datos SQL Server para Sistema de Gestión de Asilo
-- Ejecutar este script después de crear la base de datos

-- Tabla de Usuarios
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    CREATE TABLE users (
        id NVARCHAR(36) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) NOT NULL CHECK(role IN ('admin', 'nurse', 'doctor', 'reception')),
        email NVARCHAR(255) NULL,
        password_hash NVARCHAR(255) NULL,
        created_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Tabla de Pacientes
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[patients]') AND type in (N'U'))
BEGIN
    CREATE TABLE patients (
        id NVARCHAR(36) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        birth_date NVARCHAR(50) NULL,
        notes NVARCHAR(MAX) NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Tabla de Contactos (familiares de pacientes)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[contacts]') AND type in (N'U'))
BEGIN
    CREATE TABLE contacts (
        id NVARCHAR(36) PRIMARY KEY,
        patient_id NVARCHAR(36) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        phone NVARCHAR(50) NOT NULL,
        relation NVARCHAR(100) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_contacts_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );
END
GO

-- Tabla de Medicamentos
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[medications]') AND type in (N'U'))
BEGIN
    CREATE TABLE medications (
        id NVARCHAR(36) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        qty INT NOT NULL,
        expires_at NVARCHAR(50) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Tabla de Solicitudes de Medicamentos (Entradas)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[entry_requests]') AND type in (N'U'))
BEGIN
    CREATE TABLE entry_requests (
        id NVARCHAR(36) PRIMARY KEY,
        patient_id NVARCHAR(36) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        status NVARCHAR(50) NOT NULL CHECK(status IN ('completa', 'incompleta')),
        due_date NVARCHAR(50) NULL,
        CONSTRAINT FK_entry_requests_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );
END
GO

-- Tabla de Items de Solicitudes (medicamentos solicitados)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[entry_items]') AND type in (N'U'))
BEGIN
    CREATE TABLE entry_items (
        id NVARCHAR(36) PRIMARY KEY,
        entry_request_id NVARCHAR(36) NOT NULL,
        medication_id NVARCHAR(36) NOT NULL,
        qty INT NOT NULL,
        CONSTRAINT FK_entry_items_entry_request FOREIGN KEY (entry_request_id) REFERENCES entry_requests(id) ON DELETE CASCADE,
        CONSTRAINT FK_entry_items_medication FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
    );
END
GO

-- Tabla de Objetos Personales
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[personal_objects]') AND type in (N'U'))
BEGIN
    CREATE TABLE personal_objects (
        id NVARCHAR(36) PRIMARY KEY,
        patient_id NVARCHAR(36) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        qty INT NOT NULL,
        received_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_personal_objects_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );
END
GO

-- Índices para mejorar rendimiento
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_patients_name' AND object_id = OBJECT_ID('patients'))
BEGIN
    CREATE INDEX idx_patients_name ON patients(name);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_contacts_patient_id' AND object_id = OBJECT_ID('contacts'))
BEGIN
    CREATE INDEX idx_contacts_patient_id ON contacts(patient_id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_medications_expires_at' AND object_id = OBJECT_ID('medications'))
BEGIN
    CREATE INDEX idx_medications_expires_at ON medications(expires_at);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_entry_requests_patient_id' AND object_id = OBJECT_ID('entry_requests'))
BEGIN
    CREATE INDEX idx_entry_requests_patient_id ON entry_requests(patient_id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_entry_requests_status' AND object_id = OBJECT_ID('entry_requests'))
BEGIN
    CREATE INDEX idx_entry_requests_status ON entry_requests(status);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_entry_items_entry_request_id' AND object_id = OBJECT_ID('entry_items'))
BEGIN
    CREATE INDEX idx_entry_items_entry_request_id ON entry_items(entry_request_id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_personal_objects_patient_id' AND object_id = OBJECT_ID('personal_objects'))
BEGIN
    CREATE INDEX idx_personal_objects_patient_id ON personal_objects(patient_id);
END
GO
