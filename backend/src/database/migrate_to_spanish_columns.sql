-- Script de migración para cambiar nombres de columnas de inglés a español
-- Ejecutar este script en SQL Server Management Studio o Azure Data Studio
-- IMPORTANTE: Hacer backup de la base de datos antes de ejecutar

BEGIN TRANSACTION;

-- ============================================
-- TABLA: contacts
-- ============================================
IF COL_LENGTH('contacts', 'patient_id') IS NOT NULL
BEGIN
    EXEC sp_rename 'contacts.patient_id', 'paciente_id', 'COLUMN';
END
GO

IF COL_LENGTH('contacts', 'name') IS NOT NULL
BEGIN
    EXEC sp_rename 'contacts.name', 'nombre', 'COLUMN';
END
GO

IF COL_LENGTH('contacts', 'phone') IS NOT NULL
BEGIN
    EXEC sp_rename 'contacts.phone', 'telefono', 'COLUMN';
END
GO

IF COL_LENGTH('contacts', 'relation') IS NOT NULL
BEGIN
    EXEC sp_rename 'contacts.relation', 'relacion', 'COLUMN';
END
GO

IF COL_LENGTH('contacts', 'created_at') IS NOT NULL
BEGIN
    EXEC sp_rename 'contacts.created_at', 'fecha_creacion', 'COLUMN';
END
GO

-- Actualizar constraint de foreign key
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_contacts_patient')
BEGIN
    ALTER TABLE contacts DROP CONSTRAINT FK_contacts_patient;
    ALTER TABLE contacts ADD CONSTRAINT FK_contacts_paciente FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE;
END
GO

-- Actualizar índice
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_contacts_patient_id' AND object_id = OBJECT_ID('contacts'))
BEGIN
    DROP INDEX idx_contacts_patient_id ON contacts;
    CREATE INDEX idx_contacts_paciente_id ON contacts(paciente_id);
END
GO

-- ============================================
-- TABLA: patients
-- ============================================
IF COL_LENGTH('patients', 'name') IS NOT NULL
BEGIN
    EXEC sp_rename 'patients.name', 'nombre', 'COLUMN';
END
GO

IF COL_LENGTH('patients', 'birth_date') IS NOT NULL
BEGIN
    EXEC sp_rename 'patients.birth_date', 'fecha_nacimiento', 'COLUMN';
END
GO

IF COL_LENGTH('patients', 'birth_place') IS NOT NULL
BEGIN
    EXEC sp_rename 'patients.birth_place', 'lugar_nacimiento', 'COLUMN';
END
GO

IF COL_LENGTH('patients', 'age') IS NOT NULL
BEGIN
    EXEC sp_rename 'patients.age', 'edad', 'COLUMN';
END
GO

IF COL_LENGTH('patients', 'address') IS NOT NULL
BEGIN
    EXEC sp_rename 'patients.address', 'direccion', 'COLUMN';
END
GO

IF COL_LENGTH('patients', 'admission_date') IS NOT NULL
BEGIN
    EXEC sp_rename 'patients.admission_date', 'fecha_ingreso', 'COLUMN';
END
GO

IF COL_LENGTH('patients', 'notes') IS NOT NULL
BEGIN
    EXEC sp_rename 'patients.notes', 'notas', 'COLUMN';
END
GO

IF COL_LENGTH('patients', 'status') IS NOT NULL
BEGIN
    EXEC sp_rename 'patients.status', 'estado', 'COLUMN';
END
GO

IF COL_LENGTH('patients', 'discharge_date') IS NOT NULL
BEGIN
    EXEC sp_rename 'patients.discharge_date', 'fecha_baja', 'COLUMN';
END
GO

IF COL_LENGTH('patients', 'discharge_reason') IS NOT NULL
BEGIN
    EXEC sp_rename 'patients.discharge_reason', 'motivo_baja', 'COLUMN';
END
GO

IF COL_LENGTH('patients', 'created_at') IS NOT NULL
BEGIN
    EXEC sp_rename 'patients.created_at', 'fecha_creacion', 'COLUMN';
END
GO

IF COL_LENGTH('patients', 'updated_at') IS NOT NULL
BEGIN
    EXEC sp_rename 'patients.updated_at', 'fecha_actualizacion', 'COLUMN';
END
GO

IF COL_LENGTH('patients', 'created_by') IS NOT NULL
BEGIN
    EXEC sp_rename 'patients.created_by', 'creado_por', 'COLUMN';
END
GO

IF COL_LENGTH('patients', 'updated_by') IS NOT NULL
BEGIN
    EXEC sp_rename 'patients.updated_by', 'actualizado_por', 'COLUMN';
END
GO

-- Actualizar constraints de foreign keys
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_patients_created_by')
BEGIN
    ALTER TABLE patients DROP CONSTRAINT FK_patients_created_by;
    ALTER TABLE patients ADD CONSTRAINT FK_patients_creado_por FOREIGN KEY (creado_por) REFERENCES users(id);
END
GO

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_patients_updated_by')
BEGIN
    ALTER TABLE patients DROP CONSTRAINT FK_patients_updated_by;
    ALTER TABLE patients ADD CONSTRAINT FK_patients_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES users(id);
END
GO

-- Actualizar índice
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_patients_name' AND object_id = OBJECT_ID('patients'))
BEGIN
    DROP INDEX idx_patients_name ON patients;
    CREATE INDEX idx_patients_nombre ON patients(nombre);
END
GO

-- Actualizar constraint de status
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_patients_status' AND parent_object_id = OBJECT_ID('patients'))
BEGIN
    ALTER TABLE patients DROP CONSTRAINT CK_patients_status;
    ALTER TABLE patients ADD CONSTRAINT CK_patients_estado CHECK (estado IN ('activo', 'baja'));
END
GO

-- Actualizar default constraint de status
IF EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'DF_patients_status' AND parent_object_id = OBJECT_ID('patients'))
BEGIN
    ALTER TABLE patients DROP CONSTRAINT DF_patients_status;
    ALTER TABLE patients ADD CONSTRAINT DF_patients_estado DEFAULT 'activo' FOR estado;
END
GO

-- ============================================
-- TABLA: medications
-- ============================================
IF COL_LENGTH('medications', 'name') IS NOT NULL
BEGIN
    EXEC sp_rename 'medications.name', 'nombre', 'COLUMN';
END
GO

IF COL_LENGTH('medications', 'qty') IS NOT NULL
BEGIN
    EXEC sp_rename 'medications.qty', 'cantidad', 'COLUMN';
END
GO

IF COL_LENGTH('medications', 'expires_at') IS NOT NULL
BEGIN
    EXEC sp_rename 'medications.expires_at', 'fecha_vencimiento', 'COLUMN';
END
GO

IF COL_LENGTH('medications', 'unit') IS NOT NULL
BEGIN
    EXEC sp_rename 'medications.unit', 'unidad', 'COLUMN';
END
GO

IF COL_LENGTH('medications', 'dosage') IS NOT NULL
BEGIN
    EXEC sp_rename 'medications.dosage', 'dosis', 'COLUMN';
END
GO

IF COL_LENGTH('medications', 'created_at') IS NOT NULL
BEGIN
    EXEC sp_rename 'medications.created_at', 'fecha_creacion', 'COLUMN';
END
GO

IF COL_LENGTH('medications', 'updated_at') IS NOT NULL
BEGIN
    EXEC sp_rename 'medications.updated_at', 'fecha_actualizacion', 'COLUMN';
END
GO

IF COL_LENGTH('medications', 'created_by') IS NOT NULL
BEGIN
    EXEC sp_rename 'medications.created_by', 'creado_por', 'COLUMN';
END
GO

IF COL_LENGTH('medications', 'updated_by') IS NOT NULL
BEGIN
    EXEC sp_rename 'medications.updated_by', 'actualizado_por', 'COLUMN';
END
GO

-- Actualizar constraints de foreign keys
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_medications_created_by')
BEGIN
    ALTER TABLE medications DROP CONSTRAINT FK_medications_created_by;
    ALTER TABLE medications ADD CONSTRAINT FK_medications_creado_por FOREIGN KEY (creado_por) REFERENCES users(id);
END
GO

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_medications_updated_by')
BEGIN
    ALTER TABLE medications DROP CONSTRAINT FK_medications_updated_by;
    ALTER TABLE medications ADD CONSTRAINT FK_medications_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES users(id);
END
GO

-- Actualizar índice
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_medications_expires_at' AND object_id = OBJECT_ID('medications'))
BEGIN
    DROP INDEX idx_medications_expires_at ON medications;
    CREATE INDEX idx_medications_fecha_vencimiento ON medications(fecha_vencimiento);
END
GO

-- ============================================
-- TABLA: entry_requests
-- ============================================
IF COL_LENGTH('entry_requests', 'type') IS NOT NULL
BEGIN
    EXEC sp_rename 'entry_requests.type', 'tipo', 'COLUMN';
END
GO

IF COL_LENGTH('entry_requests', 'patient_id') IS NOT NULL
BEGIN
    EXEC sp_rename 'entry_requests.patient_id', 'paciente_id', 'COLUMN';
END
GO

IF COL_LENGTH('entry_requests', 'created_at') IS NOT NULL
BEGIN
    EXEC sp_rename 'entry_requests.created_at', 'fecha_creacion', 'COLUMN';
END
GO

IF COL_LENGTH('entry_requests', 'status') IS NOT NULL
BEGIN
    EXEC sp_rename 'entry_requests.status', 'estado', 'COLUMN';
END
GO

IF COL_LENGTH('entry_requests', 'due_date') IS NOT NULL
BEGIN
    EXEC sp_rename 'entry_requests.due_date', 'fecha_vencimiento', 'COLUMN';
END
GO

-- Actualizar constraint de foreign key
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_entry_requests_patient')
BEGIN
    ALTER TABLE entry_requests DROP CONSTRAINT FK_entry_requests_patient;
    ALTER TABLE entry_requests ADD CONSTRAINT FK_entry_requests_paciente FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE;
END
GO

-- Actualizar constraints de check
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_entry_requests_type' AND parent_object_id = OBJECT_ID('entry_requests'))
BEGIN
    ALTER TABLE entry_requests DROP CONSTRAINT CK_entry_requests_type;
    ALTER TABLE entry_requests ADD CONSTRAINT CK_entry_requests_tipo CHECK(tipo IN ('entrada', 'salida'));
END
GO

IF EXISTS (SELECT * FROM sys.check_constraints WHERE name LIKE 'CK_entry_requests_status%' AND parent_object_id = OBJECT_ID('entry_requests'))
BEGIN
    DECLARE @constraintName NVARCHAR(200);
    SELECT TOP 1 @constraintName = name FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('entry_requests') AND name LIKE 'CK_entry_requests_status%';
    IF @constraintName IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE entry_requests DROP CONSTRAINT [' + @constraintName + ']');
    END
    ALTER TABLE entry_requests ADD CONSTRAINT CK_entry_requests_estado CHECK(estado IN ('completa', 'incompleta'));
END
GO

-- Actualizar índices
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_entry_requests_patient_id' AND object_id = OBJECT_ID('entry_requests'))
BEGIN
    DROP INDEX idx_entry_requests_patient_id ON entry_requests;
    CREATE INDEX idx_entry_requests_paciente_id ON entry_requests(paciente_id);
END
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_entry_requests_status' AND object_id = OBJECT_ID('entry_requests'))
BEGIN
    DROP INDEX idx_entry_requests_status ON entry_requests;
    CREATE INDEX idx_entry_requests_estado ON entry_requests(estado);
END
GO

-- ============================================
-- TABLA: entry_items
-- ============================================
IF COL_LENGTH('entry_items', 'entry_request_id') IS NOT NULL
BEGIN
    EXEC sp_rename 'entry_items.entry_request_id', 'solicitud_id', 'COLUMN';
END
GO

IF COL_LENGTH('entry_items', 'medication_id') IS NOT NULL
BEGIN
    EXEC sp_rename 'entry_items.medication_id', 'medicamento_id', 'COLUMN';
END
GO

IF COL_LENGTH('entry_items', 'qty') IS NOT NULL
BEGIN
    EXEC sp_rename 'entry_items.qty', 'cantidad', 'COLUMN';
END
GO

-- Actualizar constraints de foreign keys
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_entry_items_entry_request')
BEGIN
    ALTER TABLE entry_items DROP CONSTRAINT FK_entry_items_entry_request;
    ALTER TABLE entry_items ADD CONSTRAINT FK_entry_items_solicitud FOREIGN KEY (solicitud_id) REFERENCES entry_requests(id) ON DELETE CASCADE;
END
GO

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_entry_items_medication')
BEGIN
    ALTER TABLE entry_items DROP CONSTRAINT FK_entry_items_medication;
    ALTER TABLE entry_items ADD CONSTRAINT FK_entry_items_medicamento FOREIGN KEY (medicamento_id) REFERENCES medications(id) ON DELETE CASCADE;
END
GO

-- Actualizar índice
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_entry_items_entry_request_id' AND object_id = OBJECT_ID('entry_items'))
BEGIN
    DROP INDEX idx_entry_items_entry_request_id ON entry_items;
    CREATE INDEX idx_entry_items_solicitud_id ON entry_items(solicitud_id);
END
GO

-- ============================================
-- TABLA: patient_medications
-- ============================================
IF COL_LENGTH('patient_medications', 'patient_id') IS NOT NULL
BEGIN
    EXEC sp_rename 'patient_medications.patient_id', 'paciente_id', 'COLUMN';
END
GO

IF COL_LENGTH('patient_medications', 'medication_id') IS NOT NULL
BEGIN
    EXEC sp_rename 'patient_medications.medication_id', 'medicamento_id', 'COLUMN';
END
GO

IF COL_LENGTH('patient_medications', 'dosage') IS NOT NULL
BEGIN
    EXEC sp_rename 'patient_medications.dosage', 'dosis', 'COLUMN';
END
GO

IF COL_LENGTH('patient_medications', 'frequency') IS NOT NULL
BEGIN
    EXEC sp_rename 'patient_medications.frequency', 'frecuencia', 'COLUMN';
END
GO

IF COL_LENGTH('patient_medications', 'prescribed_at') IS NOT NULL
BEGIN
    EXEC sp_rename 'patient_medications.prescribed_at', 'fecha_prescripcion', 'COLUMN';
END
GO

IF COL_LENGTH('patient_medications', 'prescribed_by') IS NOT NULL
BEGIN
    EXEC sp_rename 'patient_medications.prescribed_by', 'prescrito_por', 'COLUMN';
END
GO

-- Actualizar constraints de foreign keys
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_patient_medications_patient')
BEGIN
    ALTER TABLE patient_medications DROP CONSTRAINT FK_patient_medications_patient;
    ALTER TABLE patient_medications ADD CONSTRAINT FK_patient_medications_paciente FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE;
END
GO

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_patient_medications_medication')
BEGIN
    ALTER TABLE patient_medications DROP CONSTRAINT FK_patient_medications_medication;
    ALTER TABLE patient_medications ADD CONSTRAINT FK_patient_medications_medicamento FOREIGN KEY (medicamento_id) REFERENCES medications(id) ON DELETE CASCADE;
END
GO

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_patient_medications_user')
BEGIN
    ALTER TABLE patient_medications DROP CONSTRAINT FK_patient_medications_user;
    ALTER TABLE patient_medications ADD CONSTRAINT FK_patient_medications_prescrito_por FOREIGN KEY (prescrito_por) REFERENCES users(id);
END
GO

-- Actualizar índices
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_patient_medications_patient_id' AND object_id = OBJECT_ID('patient_medications'))
BEGIN
    DROP INDEX idx_patient_medications_patient_id ON patient_medications;
    CREATE INDEX idx_patient_medications_paciente_id ON patient_medications(paciente_id);
END
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_patient_medications_medication_id' AND object_id = OBJECT_ID('patient_medications'))
BEGIN
    DROP INDEX idx_patient_medications_medication_id ON patient_medications;
    CREATE INDEX idx_patient_medications_medicamento_id ON patient_medications(medicamento_id);
END
GO

-- ============================================
-- TABLA: personal_objects
-- ============================================
IF COL_LENGTH('personal_objects', 'patient_id') IS NOT NULL
BEGIN
    EXEC sp_rename 'personal_objects.patient_id', 'paciente_id', 'COLUMN';
END
GO

IF COL_LENGTH('personal_objects', 'name') IS NOT NULL
BEGIN
    EXEC sp_rename 'personal_objects.name', 'nombre', 'COLUMN';
END
GO

IF COL_LENGTH('personal_objects', 'qty') IS NOT NULL
BEGIN
    EXEC sp_rename 'personal_objects.qty', 'cantidad', 'COLUMN';
END
GO

IF COL_LENGTH('personal_objects', 'received_at') IS NOT NULL
BEGIN
    EXEC sp_rename 'personal_objects.received_at', 'fecha_recepcion', 'COLUMN';
END
GO

-- Actualizar constraint de foreign key
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_personal_objects_patient')
BEGIN
    ALTER TABLE personal_objects DROP CONSTRAINT FK_personal_objects_patient;
    ALTER TABLE personal_objects ADD CONSTRAINT FK_personal_objects_paciente FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE;
END
GO

-- Actualizar índice
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_personal_objects_patient_id' AND object_id = OBJECT_ID('personal_objects'))
BEGIN
    DROP INDEX idx_personal_objects_patient_id ON personal_objects;
    CREATE INDEX idx_personal_objects_paciente_id ON personal_objects(paciente_id);
END
GO

-- ============================================
-- TABLA: users
-- ============================================
IF COL_LENGTH('users', 'name') IS NOT NULL
BEGIN
    EXEC sp_rename 'users.name', 'nombre', 'COLUMN';
END
GO

IF COL_LENGTH('users', 'role') IS NOT NULL
BEGIN
    EXEC sp_rename 'users.role', 'rol', 'COLUMN';
END
GO

IF COL_LENGTH('users', 'password_hash') IS NOT NULL
BEGIN
    EXEC sp_rename 'users.password_hash', 'hash_contraseña', 'COLUMN';
END
GO

IF COL_LENGTH('users', 'password_change_required') IS NOT NULL
BEGIN
    EXEC sp_rename 'users.password_change_required', 'cambio_contraseña_requerido', 'COLUMN';
END
GO

IF COL_LENGTH('users', 'created_at') IS NOT NULL
BEGIN
    EXEC sp_rename 'users.created_at', 'fecha_creacion', 'COLUMN';
END
GO

IF COL_LENGTH('users', 'age') IS NOT NULL
BEGIN
    EXEC sp_rename 'users.age', 'edad', 'COLUMN';
END
GO

IF COL_LENGTH('users', 'birth_date') IS NOT NULL
BEGIN
    EXEC sp_rename 'users.birth_date', 'fecha_nacimiento', 'COLUMN';
END
GO

IF COL_LENGTH('users', 'birth_year') IS NOT NULL
BEGIN
    EXEC sp_rename 'users.birth_year', 'año_nacimiento', 'COLUMN';
END
GO

-- Actualizar constraint de check para role
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_users_role' AND parent_object_id = OBJECT_ID('users'))
BEGIN
    ALTER TABLE users DROP CONSTRAINT CK_users_role;
    ALTER TABLE users ADD CONSTRAINT CK_users_rol CHECK(rol IN ('admin', 'nurse', 'doctor', 'usuario', 'reception'));
END
GO

COMMIT TRANSACTION;

PRINT 'Migración completada exitosamente. Todas las columnas han sido renombradas a español.';

