-- Base de datos SQL Server para Sistema de Gestión de Asilo
-- Ejecutar este script después de crear la base de datos

-- Tabla de Usuarios
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    CREATE TABLE users (
        id NVARCHAR(36) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) NOT NULL CHECK(role IN ('admin', 'nurse', 'doctor', 'usuario')),
        email NVARCHAR(255) NULL,
        password_hash NVARCHAR(255) NULL,
        password_change_required BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE()
    );
END
GO
IF COL_LENGTH('users', 'password_change_required') IS NULL
BEGIN
    ALTER TABLE users ADD password_change_required BIT NOT NULL DEFAULT 1;
    UPDATE users 
    SET password_change_required = CASE WHEN password_hash IS NULL THEN 0 ELSE 1 END;
END
GO
IF COL_LENGTH('users', 'age') IS NULL
BEGIN
    ALTER TABLE users ADD age INT NULL;
END
GO
IF COL_LENGTH('users', 'birth_year') IS NOT NULL
BEGIN
    ALTER TABLE users DROP COLUMN birth_year;
END
GO
IF COL_LENGTH('users', 'birth_date') IS NULL
BEGIN
    ALTER TABLE users ADD birth_date NVARCHAR(50) NULL;
END
GO
IF COL_LENGTH('users', 'birth_year') IS NULL
BEGIN
    ALTER TABLE users ADD birth_year INT NULL;
END
GO
DECLARE @existingUserRoleConstraint NVARCHAR(200);
SELECT TOP 1 @existingUserRoleConstraint = name 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('users') 
  AND name LIKE 'CK__users__role%';

IF @existingUserRoleConstraint IS NOT NULL AND @existingUserRoleConstraint <> 'CK_users_role'
BEGIN
    DECLARE @dropUserRoleConstraintSql NVARCHAR(400);
    SET @dropUserRoleConstraintSql = N'ALTER TABLE users DROP CONSTRAINT [' + @existingUserRoleConstraint + N']';
    EXEC sp_executesql @dropUserRoleConstraintSql;
END

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints 
    WHERE parent_object_id = OBJECT_ID('users') 
      AND name = 'CK_users_role'
)
BEGIN
    ALTER TABLE users ADD CONSTRAINT CK_users_role CHECK(role IN ('admin', 'nurse', 'doctor', 'usuario', 'reception'));
END
GO

-- Tabla de Pacientes
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[patients]') AND type in (N'U'))
BEGIN
    CREATE TABLE patients (
        id NVARCHAR(36) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        birth_date NVARCHAR(50) NULL,
        age INT NULL,
        curp NVARCHAR(18) NULL,
        rfc NVARCHAR(13) NULL,
        admission_date NVARCHAR(50) NULL,
        notes NVARCHAR(MAX) NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'activo' CHECK(status IN ('activo', 'baja')),
        discharge_date NVARCHAR(50) NULL,
        discharge_reason NVARCHAR(MAX) NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        created_by NVARCHAR(36) NULL,
        updated_by NVARCHAR(36) NULL,
        CONSTRAINT FK_patients_created_by FOREIGN KEY (created_by) REFERENCES users(id),
        CONSTRAINT FK_patients_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
    );
END
GO
IF COL_LENGTH('patients', 'age') IS NULL
BEGIN
    ALTER TABLE patients ADD age INT NULL;
END
GO
IF COL_LENGTH('patients', 'curp') IS NULL
BEGIN
    ALTER TABLE patients ADD curp NVARCHAR(18) NULL;
END
GO
IF COL_LENGTH('patients', 'rfc') IS NULL
BEGIN
    ALTER TABLE patients ADD rfc NVARCHAR(13) NULL;
END
GO
IF COL_LENGTH('patients', 'admission_date') IS NULL
BEGIN
    ALTER TABLE patients ADD admission_date NVARCHAR(50) NULL;
END
GO
IF COL_LENGTH('patients', 'status') IS NULL
BEGIN
    ALTER TABLE patients ADD status NVARCHAR(20) NULL;
    UPDATE patients SET status = 'activo' WHERE status IS NULL;
    ALTER TABLE patients ALTER COLUMN status NVARCHAR(20) NOT NULL;
END
GO
IF NOT EXISTS (
    SELECT 1 FROM sys.default_constraints 
    WHERE parent_object_id = OBJECT_ID('patients') 
      AND name = 'DF_patients_status'
)
BEGIN
    ALTER TABLE patients ADD CONSTRAINT DF_patients_status DEFAULT 'activo' FOR status;
END
GO
IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints 
    WHERE parent_object_id = OBJECT_ID('patients') 
      AND name = 'CK_patients_status'
)
BEGIN
    ALTER TABLE patients ADD CONSTRAINT CK_patients_status CHECK (status IN ('activo', 'baja'));
END
GO
IF COL_LENGTH('patients', 'discharge_date') IS NULL
BEGIN
    ALTER TABLE patients ADD discharge_date NVARCHAR(50) NULL;
END
GO
IF COL_LENGTH('patients', 'discharge_reason') IS NULL
BEGIN
    ALTER TABLE patients ADD discharge_reason NVARCHAR(MAX) NULL;
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
        rfc NVARCHAR(13) NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_contacts_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );
END
GO
IF COL_LENGTH('contacts', 'rfc') IS NULL
BEGIN
    ALTER TABLE contacts ADD rfc NVARCHAR(13) NULL;
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
        unit NVARCHAR(50) NULL,
        dosage NVARCHAR(255) NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        created_by NVARCHAR(36) NULL,
        updated_by NVARCHAR(36) NULL,
        CONSTRAINT FK_medications_created_by FOREIGN KEY (created_by) REFERENCES users(id),
        CONSTRAINT FK_medications_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
    );
END
GO
IF COL_LENGTH('medications', 'unit') IS NULL
BEGIN
    ALTER TABLE medications ADD unit NVARCHAR(50) NULL;
END
GO
IF COL_LENGTH('medications', 'dosage') IS NULL
BEGIN
    ALTER TABLE medications ADD dosage NVARCHAR(255) NULL;
END
GO

-- Tabla de Solicitudes de Medicamentos (Entradas)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[entry_requests]') AND type in (N'U'))
BEGIN
    CREATE TABLE entry_requests (
        id NVARCHAR(36) PRIMARY KEY,
        folio NVARCHAR(20) NOT NULL,
        type NVARCHAR(20) NOT NULL CHECK(type IN ('entrada', 'salida')),
        patient_id NVARCHAR(36) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        status NVARCHAR(50) NOT NULL CHECK(status IN ('completa', 'incompleta')),
        due_date NVARCHAR(50) NULL,
        CONSTRAINT FK_entry_requests_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );
END
GO
IF COL_LENGTH('entry_requests', 'folio') IS NULL
BEGIN
    ALTER TABLE entry_requests ADD folio NVARCHAR(20) NULL;
    UPDATE entry_requests SET folio = CONCAT('LEG-', RIGHT(id, 16)) WHERE folio IS NULL;
    ALTER TABLE entry_requests ALTER COLUMN folio NVARCHAR(20) NOT NULL;
END
GO
IF COL_LENGTH('entry_requests', 'type') IS NULL
BEGIN
    ALTER TABLE entry_requests ADD type NVARCHAR(20) NULL;
    UPDATE entry_requests SET type = 'salida' WHERE type IS NULL;
    ALTER TABLE entry_requests ALTER COLUMN type NVARCHAR(20) NOT NULL;
END
GO
IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints 
    WHERE parent_object_id = OBJECT_ID('entry_requests') 
      AND name = 'CK_entry_requests_type'
)
BEGIN
    ALTER TABLE entry_requests ADD CONSTRAINT CK_entry_requests_type CHECK(type IN ('entrada', 'salida'));
END
GO
IF COL_LENGTH('entry_requests', 'folio') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_entry_requests_folio' AND object_id = OBJECT_ID('entry_requests'))
    BEGIN
        CREATE UNIQUE INDEX idx_entry_requests_folio ON entry_requests(folio);
    END
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

-- Tabla de Medicamentos asignados a Pacientes
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[patient_medications]') AND type in (N'U'))
BEGIN
    CREATE TABLE patient_medications (
        id NVARCHAR(36) PRIMARY KEY,
        patient_id NVARCHAR(36) NOT NULL,
        medication_id NVARCHAR(36) NOT NULL,
        dosage NVARCHAR(255) NOT NULL,
        frequency NVARCHAR(255) NOT NULL,
        prescribed_at NVARCHAR(50) NOT NULL,
        prescribed_by NVARCHAR(36) NULL,
        CONSTRAINT FK_patient_medications_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        CONSTRAINT FK_patient_medications_medication FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
        CONSTRAINT FK_patient_medications_user FOREIGN KEY (prescribed_by) REFERENCES users(id)
    );
END
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_patient_medications_patient_id' AND object_id = OBJECT_ID('patient_medications'))
BEGIN
    CREATE INDEX idx_patient_medications_patient_id ON patient_medications(patient_id);
END
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_patient_medications_medication_id' AND object_id = OBJECT_ID('patient_medications'))
BEGIN
    CREATE INDEX idx_patient_medications_medication_id ON patient_medications(medication_id);
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
