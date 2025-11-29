-- Base de datos SQL Server para Sistema de Gestión de Asilo
-- Ejecutar este script después de crear la base de datos
-- Este script maneja tanto columnas en inglés (legacy) como en español

-- ============================================
-- MIGRACIÓN: Renombrar columnas de inglés a español si existen
-- ============================================

-- Tabla de Usuarios - Migración
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'name')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'nombre')
BEGIN
    EXEC sp_rename 'users.name', 'nombre', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'role')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'rol')
BEGIN
    -- Eliminar constraint de role si existe
    DECLARE @userRoleConstraint NVARCHAR(200);
    SELECT TOP 1 @userRoleConstraint = name 
    FROM sys.check_constraints 
    WHERE parent_object_id = OBJECT_ID('users') 
      AND (name LIKE 'CK__users__role%' OR name LIKE 'CK__users__rol%' OR name = 'CK_users_role' OR name = 'CK_users_rol');
    
    IF @userRoleConstraint IS NOT NULL
    BEGIN
        DECLARE @dropUserRoleConstraintSql NVARCHAR(400);
        SET @dropUserRoleConstraintSql = N'ALTER TABLE users DROP CONSTRAINT [' + @userRoleConstraint + N']';
        EXEC sp_executesql @dropUserRoleConstraintSql;
    END
    
    EXEC sp_rename 'users.role', 'rol', 'COLUMN';
    
    -- Recrear constraint con nuevo nombre
    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('users') AND name = 'CK_users_rol')
    BEGIN
        DECLARE @addUserRoleConstraintSql2 NVARCHAR(400);
        SET @addUserRoleConstraintSql2 = N'ALTER TABLE users ADD CONSTRAINT CK_users_rol CHECK(rol IN (''admin'', ''nurse'', ''doctor'', ''usuario'', ''reception''))';
        EXEC sp_executesql @addUserRoleConstraintSql2;
    END
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'hash_contraseña')
BEGIN
    EXEC sp_rename 'users.password_hash', 'hash_contraseña', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password_change_required')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'cambio_contraseña_requerido')
BEGIN
    EXEC sp_rename 'users.password_change_required', 'cambio_contraseña_requerido', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'created_at')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'fecha_creacion')
BEGIN
    EXEC sp_rename 'users.created_at', 'fecha_creacion', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'age')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'edad')
BEGIN
    EXEC sp_rename 'users.age', 'edad', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'birth_date')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'fecha_nacimiento')
BEGIN
    EXEC sp_rename 'users.birth_date', 'fecha_nacimiento', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'birth_year')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'año_nacimiento')
BEGIN
    EXEC sp_rename 'users.birth_year', 'año_nacimiento', 'COLUMN';
END
GO

-- Tabla de Pacientes - Migración
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'name')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'nombre')
BEGIN
    EXEC sp_rename 'patients.name', 'nombre', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'birth_date')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'fecha_nacimiento')
BEGIN
    EXEC sp_rename 'patients.birth_date', 'fecha_nacimiento', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'birth_place')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'lugar_nacimiento')
BEGIN
    EXEC sp_rename 'patients.birth_place', 'lugar_nacimiento', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'age')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'edad')
BEGIN
    EXEC sp_rename 'patients.age', 'edad', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'address')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'direccion')
BEGIN
    EXEC sp_rename 'patients.address', 'direccion', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'admission_date')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'fecha_ingreso')
BEGIN
    EXEC sp_rename 'patients.admission_date', 'fecha_ingreso', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'notes')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'notas')
BEGIN
    EXEC sp_rename 'patients.notes', 'notas', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'status')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'estado')
BEGIN
    -- Eliminar constraints de status si existen
    IF EXISTS (SELECT * FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('patients') AND name = 'CK_patients_status')
    BEGIN
        ALTER TABLE patients DROP CONSTRAINT CK_patients_status;
    END
    IF EXISTS (SELECT * FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('patients') AND name = 'DF_patients_status')
    BEGIN
        ALTER TABLE patients DROP CONSTRAINT DF_patients_status;
    END
    
    EXEC sp_rename 'patients.status', 'estado', 'COLUMN';
    
    -- Recrear constraints con nuevo nombre
    IF NOT EXISTS (SELECT * FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('patients') AND name = 'DF_patients_estado')
    BEGIN
        DECLARE @addPatientsEstadoDefaultSql2 NVARCHAR(400);
        SET @addPatientsEstadoDefaultSql2 = N'ALTER TABLE patients ADD CONSTRAINT DF_patients_estado DEFAULT ''activo'' FOR estado';
        EXEC sp_executesql @addPatientsEstadoDefaultSql2;
    END
    IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('patients') AND name = 'CK_patients_estado')
    BEGIN
        DECLARE @addPatientsEstadoCheckSql3 NVARCHAR(400);
        SET @addPatientsEstadoCheckSql3 = N'ALTER TABLE patients ADD CONSTRAINT CK_patients_estado CHECK (estado IN (''activo'', ''baja''))';
        EXEC sp_executesql @addPatientsEstadoCheckSql3;
    END
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'discharge_date')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'fecha_baja')
BEGIN
    EXEC sp_rename 'patients.discharge_date', 'fecha_baja', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'discharge_reason')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'motivo_baja')
BEGIN
    EXEC sp_rename 'patients.discharge_reason', 'motivo_baja', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'created_at')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'fecha_creacion')
BEGIN
    EXEC sp_rename 'patients.created_at', 'fecha_creacion', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'updated_at')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'fecha_actualizacion')
BEGIN
    EXEC sp_rename 'patients.updated_at', 'fecha_actualizacion', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'created_by')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'creado_por')
BEGIN
    EXEC sp_rename 'patients.created_by', 'creado_por', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'updated_by')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'actualizado_por')
BEGIN
    EXEC sp_rename 'patients.updated_by', 'actualizado_por', 'COLUMN';
END
GO

-- Tabla de Contactos - Migración
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'patient_id')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'paciente_id')
BEGIN
    EXEC sp_rename 'contacts.patient_id', 'paciente_id', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'name')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'nombre')
BEGIN
    EXEC sp_rename 'contacts.name', 'nombre', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'phone')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'telefono')
BEGIN
    EXEC sp_rename 'contacts.phone', 'telefono', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'relation')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'relacion')
BEGIN
    EXEC sp_rename 'contacts.relation', 'relacion', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'age')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'edad')
BEGIN
    EXEC sp_rename 'contacts.age', 'edad', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'address')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'direccion')
BEGIN
    EXEC sp_rename 'contacts.address', 'direccion', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'created_at')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'fecha_creacion')
BEGIN
    EXEC sp_rename 'contacts.created_at', 'fecha_creacion', 'COLUMN';
END
GO

-- Tabla de Medicamentos - Migración
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'name')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'nombre')
BEGIN
    EXEC sp_rename 'medications.name', 'nombre', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'qty')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'cantidad')
BEGIN
    EXEC sp_rename 'medications.qty', 'cantidad', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'expires_at')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'fecha_vencimiento')
BEGIN
    EXEC sp_rename 'medications.expires_at', 'fecha_vencimiento', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'unit')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'unidad')
BEGIN
    EXEC sp_rename 'medications.unit', 'unidad', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'dosage')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'dosis')
BEGIN
    EXEC sp_rename 'medications.dosage', 'dosis', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'created_at')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'fecha_creacion')
BEGIN
    EXEC sp_rename 'medications.created_at', 'fecha_creacion', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'updated_at')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'fecha_actualizacion')
BEGIN
    EXEC sp_rename 'medications.updated_at', 'fecha_actualizacion', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'created_by')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'creado_por')
BEGIN
    EXEC sp_rename 'medications.created_by', 'creado_por', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'updated_by')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'actualizado_por')
BEGIN
    EXEC sp_rename 'medications.updated_by', 'actualizado_por', 'COLUMN';
END
GO

-- Tabla de Solicitudes - Migración
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'type')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'tipo')
BEGIN
    -- Eliminar constraint de type si existe
    IF EXISTS (SELECT * FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('entry_requests') AND name = 'CK_entry_requests_type')
    BEGIN
        ALTER TABLE entry_requests DROP CONSTRAINT CK_entry_requests_type;
    END
    
    EXEC sp_rename 'entry_requests.type', 'tipo', 'COLUMN';
    
    -- Recrear constraint con nuevo nombre
    IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('entry_requests') AND name = 'CK_entry_requests_tipo')
    BEGIN
        DECLARE @addEntryTipoCheckSql3 NVARCHAR(400);
        SET @addEntryTipoCheckSql3 = N'ALTER TABLE entry_requests ADD CONSTRAINT CK_entry_requests_tipo CHECK(tipo IN (''entrada'', ''salida''))';
        EXEC sp_executesql @addEntryTipoCheckSql3;
    END
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'patient_id')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id')
BEGIN
    EXEC sp_rename 'entry_requests.patient_id', 'paciente_id', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'created_at')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'fecha_creacion')
BEGIN
    EXEC sp_rename 'entry_requests.created_at', 'fecha_creacion', 'COLUMN';
END
GO
BEGIN TRY
    DECLARE @hasStatusColumn BIT = 0;
    DECLARE @hasEstadoColumn BIT = 0;
    
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'status')
    BEGIN
        SET @hasStatusColumn = 1;
    END
    
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'estado')
    BEGIN
        SET @hasEstadoColumn = 1;
    END
    
    IF @hasStatusColumn = 1 AND @hasEstadoColumn = 0
    BEGIN
        -- Eliminar constraint de status si existe
        DECLARE @entryStatusConstraint NVARCHAR(200);
        SELECT TOP 1 @entryStatusConstraint = name 
        FROM sys.check_constraints 
        WHERE parent_object_id = OBJECT_ID('entry_requests') 
          AND (name LIKE 'CK_entry_requests_status%' OR name LIKE 'CK__entry_requests__status%');
        
        IF @entryStatusConstraint IS NOT NULL
        BEGIN
            DECLARE @dropEntryStatusConstraintSql NVARCHAR(400);
            SET @dropEntryStatusConstraintSql = N'ALTER TABLE entry_requests DROP CONSTRAINT [' + @entryStatusConstraint + N']';
            EXEC sp_executesql @dropEntryStatusConstraintSql;
        END
        
        EXEC sp_rename 'entry_requests.status', 'estado', 'COLUMN';
        
        -- Recrear constraint con nuevo nombre
        IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('entry_requests') AND name = 'CK_entry_requests_estado')
        BEGIN
            DECLARE @addEntryEstadoCheckSql2 NVARCHAR(400);
            SET @addEntryEstadoCheckSql2 = N'ALTER TABLE entry_requests ADD CONSTRAINT CK_entry_requests_estado CHECK(estado IN (''completa'', ''incompleta''))';
            EXEC sp_executesql @addEntryEstadoCheckSql2;
        END
    END
END TRY
BEGIN CATCH
    -- Ignorar errores si la columna no existe aún
END CATCH
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'due_date')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'fecha_vencimiento')
BEGIN
    EXEC sp_rename 'entry_requests.due_date', 'fecha_vencimiento', 'COLUMN';
END
GO

-- Tabla de Items de Solicitudes - Migración
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'entry_request_id')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'solicitud_id')
BEGIN
    EXEC sp_rename 'entry_items.entry_request_id', 'solicitud_id', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'medication_id')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'medicamento_id')
BEGIN
    EXEC sp_rename 'entry_items.medication_id', 'medicamento_id', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'qty')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'cantidad')
BEGIN
    EXEC sp_rename 'entry_items.qty', 'cantidad', 'COLUMN';
END
GO

-- Tabla de Medicamentos de Pacientes - Migración
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_medications' AND COLUMN_NAME = 'patient_id')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_medications' AND COLUMN_NAME = 'paciente_id')
BEGIN
    EXEC sp_rename 'patient_medications.patient_id', 'paciente_id', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_medications' AND COLUMN_NAME = 'medication_id')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_medications' AND COLUMN_NAME = 'medicamento_id')
BEGIN
    EXEC sp_rename 'patient_medications.medication_id', 'medicamento_id', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_medications' AND COLUMN_NAME = 'dosage')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_medications' AND COLUMN_NAME = 'dosis')
BEGIN
    EXEC sp_rename 'patient_medications.dosage', 'dosis', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_medications' AND COLUMN_NAME = 'frequency')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_medications' AND COLUMN_NAME = 'frecuencia')
BEGIN
    EXEC sp_rename 'patient_medications.frequency', 'frecuencia', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_medications' AND COLUMN_NAME = 'prescribed_at')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_medications' AND COLUMN_NAME = 'fecha_prescripcion')
BEGIN
    EXEC sp_rename 'patient_medications.prescribed_at', 'fecha_prescripcion', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_medications' AND COLUMN_NAME = 'prescribed_by')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_medications' AND COLUMN_NAME = 'prescrito_por')
BEGIN
    EXEC sp_rename 'patient_medications.prescribed_by', 'prescrito_por', 'COLUMN';
END
GO

-- Tabla de Objetos Personales - Migración
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'personal_objects' AND COLUMN_NAME = 'patient_id')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'personal_objects' AND COLUMN_NAME = 'paciente_id')
BEGIN
    EXEC sp_rename 'personal_objects.patient_id', 'paciente_id', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'personal_objects' AND COLUMN_NAME = 'name')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'personal_objects' AND COLUMN_NAME = 'nombre')
BEGIN
    EXEC sp_rename 'personal_objects.name', 'nombre', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'personal_objects' AND COLUMN_NAME = 'qty')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'personal_objects' AND COLUMN_NAME = 'cantidad')
BEGIN
    EXEC sp_rename 'personal_objects.qty', 'cantidad', 'COLUMN';
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'personal_objects' AND COLUMN_NAME = 'received_at')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'personal_objects' AND COLUMN_NAME = 'fecha_recepcion')
BEGIN
    EXEC sp_rename 'personal_objects.received_at', 'fecha_recepcion', 'COLUMN';
END
GO

-- ============================================
-- ACTUALIZAR FOREIGN KEYS Y CONSTRAINTS DESPUÉS DE MIGRACIÓN
-- ============================================

-- Actualizar foreign keys de contacts
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_contacts_patient')
BEGIN
    ALTER TABLE contacts DROP CONSTRAINT FK_contacts_patient;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'paciente_id')
    BEGIN
        ALTER TABLE contacts ADD CONSTRAINT FK_contacts_paciente FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE;
    END
END
GO

-- Actualizar foreign keys de patients
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_patients_created_by')
BEGIN
    ALTER TABLE patients DROP CONSTRAINT FK_patients_created_by;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'creado_por')
    BEGIN
        ALTER TABLE patients ADD CONSTRAINT FK_patients_creado_por FOREIGN KEY (creado_por) REFERENCES users(id);
    END
END
GO
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_patients_updated_by')
BEGIN
    ALTER TABLE patients DROP CONSTRAINT FK_patients_updated_by;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'actualizado_por')
    BEGIN
        ALTER TABLE patients ADD CONSTRAINT FK_patients_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES users(id);
    END
END
GO
-- Agregar foreign keys para doctor_id y enfermero_id si no existen
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'doctor_id')
   AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_patients_doctor')
BEGIN
    ALTER TABLE patients ADD CONSTRAINT FK_patients_doctor FOREIGN KEY (doctor_id) REFERENCES users(id);
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'enfermero_id')
   AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_patients_enfermero')
BEGIN
    ALTER TABLE patients ADD CONSTRAINT FK_patients_enfermero FOREIGN KEY (enfermero_id) REFERENCES users(id);
END
GO

-- Actualizar foreign keys de medications
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_medications_created_by')
BEGIN
    ALTER TABLE medications DROP CONSTRAINT FK_medications_created_by;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'creado_por')
    BEGIN
        ALTER TABLE medications ADD CONSTRAINT FK_medications_creado_por FOREIGN KEY (creado_por) REFERENCES users(id);
    END
END
GO
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_medications_updated_by')
BEGIN
    ALTER TABLE medications DROP CONSTRAINT FK_medications_updated_by;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'actualizado_por')
    BEGIN
        ALTER TABLE medications ADD CONSTRAINT FK_medications_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES users(id);
    END
END
GO

-- Actualizar foreign keys de entry_requests
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_entry_requests_patient')
BEGIN
    ALTER TABLE entry_requests DROP CONSTRAINT FK_entry_requests_patient;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id')
    BEGIN
        ALTER TABLE entry_requests ADD CONSTRAINT FK_entry_requests_paciente FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE;
    END
END
GO

-- Actualizar foreign keys de entry_items
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_entry_items_entry_request')
BEGIN
    ALTER TABLE entry_items DROP CONSTRAINT FK_entry_items_entry_request;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'solicitud_id')
    BEGIN
        ALTER TABLE entry_items ADD CONSTRAINT FK_entry_items_solicitud FOREIGN KEY (solicitud_id) REFERENCES entry_requests(id) ON DELETE CASCADE;
    END
END
GO
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_entry_items_medication')
BEGIN
    ALTER TABLE entry_items DROP CONSTRAINT FK_entry_items_medication;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'medicamento_id')
    BEGIN
        ALTER TABLE entry_items ADD CONSTRAINT FK_entry_items_medicamento FOREIGN KEY (medicamento_id) REFERENCES medications(id) ON DELETE CASCADE;
    END
END
GO

-- Actualizar foreign keys de patient_medications
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_patient_medications_patient')
BEGIN
    ALTER TABLE patient_medications DROP CONSTRAINT FK_patient_medications_patient;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_medications' AND COLUMN_NAME = 'paciente_id')
    BEGIN
        ALTER TABLE patient_medications ADD CONSTRAINT FK_patient_medications_paciente FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE;
    END
END
GO
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_patient_medications_medication')
BEGIN
    ALTER TABLE patient_medications DROP CONSTRAINT FK_patient_medications_medication;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_medications' AND COLUMN_NAME = 'medicamento_id')
    BEGIN
        ALTER TABLE patient_medications ADD CONSTRAINT FK_patient_medications_medicamento FOREIGN KEY (medicamento_id) REFERENCES medications(id) ON DELETE CASCADE;
    END
END
GO
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_patient_medications_user')
BEGIN
    ALTER TABLE patient_medications DROP CONSTRAINT FK_patient_medications_user;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_medications' AND COLUMN_NAME = 'prescrito_por')
    BEGIN
        ALTER TABLE patient_medications ADD CONSTRAINT FK_patient_medications_prescrito_por FOREIGN KEY (prescrito_por) REFERENCES users(id);
    END
END
GO

-- Actualizar foreign keys de personal_objects
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_personal_objects_patient')
BEGIN
    ALTER TABLE personal_objects DROP CONSTRAINT FK_personal_objects_patient;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'personal_objects' AND COLUMN_NAME = 'paciente_id')
    BEGIN
        ALTER TABLE personal_objects ADD CONSTRAINT FK_personal_objects_paciente FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE;
    END
END
GO

-- Actualizar constraints de check para patients.estado
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_patients_status' AND parent_object_id = OBJECT_ID('patients'))
BEGIN
    ALTER TABLE patients DROP CONSTRAINT CK_patients_status;
END
GO
-- Agregar constraint de estado si la columna existe
BEGIN TRY
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'estado')
    BEGIN
        IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_patients_estado' AND parent_object_id = OBJECT_ID('patients'))
        BEGIN
            DECLARE @addPatientsEstadoCheckSql2 NVARCHAR(400);
            SET @addPatientsEstadoCheckSql2 = N'ALTER TABLE patients ADD CONSTRAINT CK_patients_estado CHECK (estado IN (''activo'', ''baja''))';
            EXEC sp_executesql @addPatientsEstadoCheckSql2;
        END
    END
END TRY
BEGIN CATCH
    -- Ignorar errores si la columna no existe aún
END CATCH
GO

-- Actualizar constraints de check para entry_requests.tipo
-- Buscar y eliminar constraint de 'type' si existe
DECLARE @entryTypeConstraint NVARCHAR(200);
SELECT TOP 1 @entryTypeConstraint = name 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('entry_requests') 
  AND (name = 'CK_entry_requests_type' OR name LIKE 'CK__entry_requests__type%');

IF @entryTypeConstraint IS NOT NULL
BEGIN
    DECLARE @dropEntryTypeConstraintSql NVARCHAR(400);
    SET @dropEntryTypeConstraintSql = N'ALTER TABLE entry_requests DROP CONSTRAINT [' + @entryTypeConstraint + N']';
    EXEC sp_executesql @dropEntryTypeConstraintSql;
END
GO
-- Agregar constraint de tipo si la columna existe
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'tipo')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_entry_requests_tipo' AND parent_object_id = OBJECT_ID('entry_requests'))
    BEGIN
        DECLARE @addEntryTipoCheckSql2 NVARCHAR(400);
        SET @addEntryTipoCheckSql2 = N'ALTER TABLE entry_requests ADD CONSTRAINT CK_entry_requests_tipo CHECK(tipo IN (''entrada'', ''salida''))';
        EXEC sp_executesql @addEntryTipoCheckSql2;
    END
END
GO
-- Agregar constraint de estado para entry_requests si la columna existe
DECLARE @entryEstadoExists BIT = 0;
BEGIN TRY
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'estado')
    BEGIN
        SET @entryEstadoExists = 1;
    END
END TRY
BEGIN CATCH
    SET @entryEstadoExists = 0;
END CATCH

IF @entryEstadoExists = 1
BEGIN
    BEGIN TRY
        IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_entry_requests_estado' AND parent_object_id = OBJECT_ID('entry_requests'))
        BEGIN
            DECLARE @addEntryEstadoCheckSql NVARCHAR(400);
            SET @addEntryEstadoCheckSql = N'ALTER TABLE entry_requests ADD CONSTRAINT CK_entry_requests_estado CHECK(estado IN (''completa'', ''incompleta''))';
            EXEC sp_executesql @addEntryEstadoCheckSql;
        END
    END TRY
    BEGIN CATCH
        -- Ignorar errores si la columna no existe aún
    END CATCH
END
GO

-- Actualizar índices antiguos
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_contacts_patient_id' AND object_id = OBJECT_ID('contacts'))
BEGIN
    DROP INDEX idx_contacts_patient_id ON contacts;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'paciente_id')
    BEGIN
        CREATE INDEX idx_contacts_paciente_id ON contacts(paciente_id);
    END
END
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_entry_requests_patient_id' AND object_id = OBJECT_ID('entry_requests'))
BEGIN
    DROP INDEX idx_entry_requests_patient_id ON entry_requests;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id')
    BEGIN
        CREATE INDEX idx_entry_requests_paciente_id ON entry_requests(paciente_id);
    END
END
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_entry_items_entry_request_id' AND object_id = OBJECT_ID('entry_items'))
BEGIN
    DROP INDEX idx_entry_items_entry_request_id ON entry_items;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'solicitud_id')
    BEGIN
        CREATE INDEX idx_entry_items_solicitud_id ON entry_items(solicitud_id);
    END
END
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_patient_medications_patient_id' AND object_id = OBJECT_ID('patient_medications'))
BEGIN
    DROP INDEX idx_patient_medications_patient_id ON patient_medications;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_medications' AND COLUMN_NAME = 'paciente_id')
    BEGIN
        CREATE INDEX idx_patient_medications_paciente_id ON patient_medications(paciente_id);
    END
END
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_patient_medications_medication_id' AND object_id = OBJECT_ID('patient_medications'))
BEGIN
    DROP INDEX idx_patient_medications_medication_id ON patient_medications;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_medications' AND COLUMN_NAME = 'medicamento_id')
    BEGIN
        CREATE INDEX idx_patient_medications_medicamento_id ON patient_medications(medicamento_id);
    END
END
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_personal_objects_patient_id' AND object_id = OBJECT_ID('personal_objects'))
BEGIN
    DROP INDEX idx_personal_objects_patient_id ON personal_objects;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'personal_objects' AND COLUMN_NAME = 'paciente_id')
    BEGIN
        CREATE INDEX idx_personal_objects_paciente_id ON personal_objects(paciente_id);
    END
END
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_medications_expires_at' AND object_id = OBJECT_ID('medications'))
BEGIN
    DROP INDEX idx_medications_expires_at ON medications;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'fecha_vencimiento')
    BEGIN
        CREATE INDEX idx_medications_fecha_vencimiento ON medications(fecha_vencimiento);
    END
END
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_entry_requests_status' AND object_id = OBJECT_ID('entry_requests'))
BEGIN
    DROP INDEX idx_entry_requests_status ON entry_requests;
    DECLARE @entryEstadoExistsForIndex2 BIT = 0;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'estado')
        BEGIN
            SET @entryEstadoExistsForIndex2 = 1;
        END
    END TRY
    BEGIN CATCH
        SET @entryEstadoExistsForIndex2 = 0;
    END CATCH
    
    IF @entryEstadoExistsForIndex2 = 1
    BEGIN
        BEGIN TRY
            DECLARE @createEntryEstadoIndexSql2 NVARCHAR(400);
            SET @createEntryEstadoIndexSql2 = N'CREATE INDEX idx_entry_requests_estado ON entry_requests(estado)';
            EXEC sp_executesql @createEntryEstadoIndexSql2;
        END TRY
        BEGIN CATCH
            -- Ignorar errores si la columna no existe aún
        END CATCH
    END
END
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_patients_name' AND object_id = OBJECT_ID('patients'))
BEGIN
    DROP INDEX idx_patients_name ON patients;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'nombre')
    BEGIN
        CREATE INDEX idx_patients_nombre ON patients(nombre);
    END
END
GO

-- ============================================
-- CREACIÓN DE TABLAS (si no existen)
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
        fecha_creacion DATETIME2 DEFAULT GETDATE()
    );
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'cambio_contraseña_requerido')
BEGIN
    ALTER TABLE users ADD cambio_contraseña_requerido BIT NOT NULL DEFAULT 1;
    UPDATE users 
    SET cambio_contraseña_requerido = CASE WHEN hash_contraseña IS NULL THEN 0 ELSE 1 END;
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'edad')
BEGIN
    ALTER TABLE users ADD edad INT NULL;
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'año_nacimiento')
BEGIN
    ALTER TABLE users DROP COLUMN año_nacimiento;
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'fecha_nacimiento')
BEGIN
    ALTER TABLE users ADD fecha_nacimiento NVARCHAR(50) NULL;
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'año_nacimiento')
BEGIN
    ALTER TABLE users ADD año_nacimiento INT NULL;
END
GO
-- Verificar constraint de rol (solo si la columna rol existe)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'rol')
BEGIN
    DECLARE @existingUserRoleConstraint NVARCHAR(200);
    SELECT TOP 1 @existingUserRoleConstraint = name 
    FROM sys.check_constraints 
    WHERE parent_object_id = OBJECT_ID('users') 
      AND (name LIKE 'CK__users__rol%' OR name LIKE 'CK__users__role%' OR name = 'CK_users_role' OR name = 'CK_users_rol');

    IF @existingUserRoleConstraint IS NOT NULL AND @existingUserRoleConstraint <> 'CK_users_rol'
    BEGIN
        DECLARE @dropUserRoleConstraintSql NVARCHAR(400);
        SET @dropUserRoleConstraintSql = N'ALTER TABLE users DROP CONSTRAINT [' + @existingUserRoleConstraint + N']';
        EXEC sp_executesql @dropUserRoleConstraintSql;
    END

    IF NOT EXISTS (
        SELECT 1 FROM sys.check_constraints 
        WHERE parent_object_id = OBJECT_ID('users') 
          AND name = 'CK_users_rol'
    )
    BEGIN
        DECLARE @addUserRoleConstraintSql NVARCHAR(400);
        SET @addUserRoleConstraintSql = N'ALTER TABLE users ADD CONSTRAINT CK_users_rol CHECK(rol IN (''admin'', ''nurse'', ''doctor'', ''usuario'', ''reception''))';
        EXEC sp_executesql @addUserRoleConstraintSql;
    END
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
        doctor_id NVARCHAR(36) NULL,
        enfermero_id NVARCHAR(36) NULL,
        CONSTRAINT FK_patients_creado_por FOREIGN KEY (creado_por) REFERENCES users(id),
        CONSTRAINT FK_patients_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES users(id),
        CONSTRAINT FK_patients_doctor FOREIGN KEY (doctor_id) REFERENCES users(id),
        CONSTRAINT FK_patients_enfermero FOREIGN KEY (enfermero_id) REFERENCES users(id)
    );
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'edad')
BEGIN
    ALTER TABLE patients ADD edad INT NULL;
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'lugar_nacimiento')
BEGIN
    ALTER TABLE patients ADD lugar_nacimiento NVARCHAR(255) NULL;
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'direccion')
BEGIN
    ALTER TABLE patients ADD direccion NVARCHAR(255) NULL;
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'curp')
BEGIN
    ALTER TABLE patients ADD curp NVARCHAR(18) NULL;
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'rfc')
BEGIN
    ALTER TABLE patients ADD rfc NVARCHAR(13) NULL;
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'fecha_ingreso')
BEGIN
    ALTER TABLE patients ADD fecha_ingreso NVARCHAR(50) NULL;
END
GO
-- Solo crear estado si no existe (ya sea en inglés o español)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'estado')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'status')
BEGIN
    ALTER TABLE patients ADD estado NVARCHAR(20) NULL;
    UPDATE patients SET estado = 'activo' WHERE estado IS NULL;
    ALTER TABLE patients ALTER COLUMN estado NVARCHAR(20) NOT NULL;
END
GO
-- Solo crear constraints si la columna estado existe
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'estado')
BEGIN
    -- Eliminar constraint DEFAULT existente si existe (cualquier nombre)
    DECLARE @defaultConstraintName NVARCHAR(200);
    SELECT TOP 1 @defaultConstraintName = name 
    FROM sys.default_constraints 
    WHERE parent_object_id = OBJECT_ID('patients') 
      AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('patients') AND name = 'estado');
    
    IF @defaultConstraintName IS NOT NULL AND @defaultConstraintName <> 'DF_patients_estado'
    BEGIN
        DECLARE @dropDefaultSql NVARCHAR(400);
        SET @dropDefaultSql = N'ALTER TABLE patients DROP CONSTRAINT [' + @defaultConstraintName + N']';
        EXEC sp_executesql @dropDefaultSql;
    END
    
    -- Crear constraint DEFAULT si no existe
    IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints 
        WHERE parent_object_id = OBJECT_ID('patients') 
          AND name = 'DF_patients_estado'
    )
    BEGIN
        DECLARE @addPatientsEstadoDefaultSql NVARCHAR(400);
        SET @addPatientsEstadoDefaultSql = N'ALTER TABLE patients ADD CONSTRAINT DF_patients_estado DEFAULT ''activo'' FOR estado';
        EXEC sp_executesql @addPatientsEstadoDefaultSql;
    END
    
    -- Crear constraint CHECK si no existe
    IF NOT EXISTS (
        SELECT 1 FROM sys.check_constraints 
        WHERE parent_object_id = OBJECT_ID('patients') 
          AND name = 'CK_patients_estado'
    )
    BEGIN
        DECLARE @addPatientsEstadoCheckSql NVARCHAR(400);
        SET @addPatientsEstadoCheckSql = N'ALTER TABLE patients ADD CONSTRAINT CK_patients_estado CHECK (estado IN (''activo'', ''baja''))';
        EXEC sp_executesql @addPatientsEstadoCheckSql;
    END
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'fecha_baja')
BEGIN
    ALTER TABLE patients ADD fecha_baja NVARCHAR(50) NULL;
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'motivo_baja')
BEGIN
    ALTER TABLE patients ADD motivo_baja NVARCHAR(MAX) NULL;
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'doctor_id')
BEGIN
    ALTER TABLE patients ADD doctor_id NVARCHAR(36) NULL;
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'enfermero_id')
BEGIN
    ALTER TABLE patients ADD enfermero_id NVARCHAR(36) NULL;
END
GO

-- Tabla de Contactos (familiares de pacientes)
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
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'rfc')
BEGIN
    ALTER TABLE contacts ADD rfc NVARCHAR(13) NULL;
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'edad')
BEGIN
    ALTER TABLE contacts ADD edad INT NULL;
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'direccion')
BEGIN
    ALTER TABLE contacts ADD direccion NVARCHAR(255) NULL;
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
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'unidad')
BEGIN
    ALTER TABLE medications ADD unidad NVARCHAR(50) NULL;
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'dosis')
BEGIN
    ALTER TABLE medications ADD dosis NVARCHAR(255) NULL;
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'codigo_barras')
BEGIN
    ALTER TABLE medications ADD codigo_barras NVARCHAR(255) NULL;
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'codigo_barras')
   AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_medications_codigo_barras' AND object_id = OBJECT_ID('medications'))
BEGIN
    CREATE INDEX idx_medications_codigo_barras ON medications(codigo_barras);
END
GO

-- Tabla de Solicitudes de Medicamentos (Entradas)
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
        CONSTRAINT FK_entry_requests_paciente FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE
    );
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'folio')
BEGIN
    ALTER TABLE entry_requests ADD folio NVARCHAR(20) NULL;
    UPDATE entry_requests SET folio = CONCAT('LEG-', RIGHT(id, 16)) WHERE folio IS NULL;
    ALTER TABLE entry_requests ALTER COLUMN folio NVARCHAR(20) NOT NULL;
END
GO
-- Solo crear tipo si no existe (ya sea en inglés o español)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'tipo')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'type')
BEGIN
    ALTER TABLE entry_requests ADD tipo NVARCHAR(20) NULL;
    UPDATE entry_requests SET tipo = 'salida' WHERE tipo IS NULL;
    ALTER TABLE entry_requests ALTER COLUMN tipo NVARCHAR(20) NOT NULL;
END
GO
-- Solo crear constraint si la columna tipo existe
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'tipo')
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.check_constraints 
        WHERE parent_object_id = OBJECT_ID('entry_requests') 
          AND name = 'CK_entry_requests_tipo'
    )
    BEGIN
        DECLARE @addEntryTipoCheckSql NVARCHAR(400);
        SET @addEntryTipoCheckSql = N'ALTER TABLE entry_requests ADD CONSTRAINT CK_entry_requests_tipo CHECK(tipo IN (''entrada'', ''salida''))';
        EXEC sp_executesql @addEntryTipoCheckSql;
    END
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'folio')
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
        solicitud_id NVARCHAR(36) NOT NULL,
        medicamento_id NVARCHAR(36) NOT NULL,
        cantidad INT NOT NULL,
        dosis_recomendada NVARCHAR(255) NULL,
        frecuencia NVARCHAR(255) NULL,
        fecha_caducidad NVARCHAR(50) NULL,
        CONSTRAINT FK_entry_items_solicitud FOREIGN KEY (solicitud_id) REFERENCES entry_requests(id) ON DELETE CASCADE,
        CONSTRAINT FK_entry_items_medicamento FOREIGN KEY (medicamento_id) REFERENCES medications(id) ON DELETE CASCADE
    );
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'dosis_recomendada')
BEGIN
    ALTER TABLE entry_items ADD dosis_recomendada NVARCHAR(255) NULL;
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'frecuencia')
BEGIN
    ALTER TABLE entry_items ADD frecuencia NVARCHAR(255) NULL;
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'fecha_caducidad')
BEGIN
    ALTER TABLE entry_items ADD fecha_caducidad NVARCHAR(50) NULL;
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
        cantidad INT NULL,
        CONSTRAINT FK_patient_medications_paciente FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE,
        CONSTRAINT FK_patient_medications_medicamento FOREIGN KEY (medicamento_id) REFERENCES medications(id) ON DELETE CASCADE,
        CONSTRAINT FK_patient_medications_prescrito_por FOREIGN KEY (prescrito_por) REFERENCES users(id)
    );
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_medications' AND COLUMN_NAME = 'cantidad')
BEGIN
    ALTER TABLE patient_medications ADD cantidad INT NULL;
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_medications' AND COLUMN_NAME = 'paciente_id')
   AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_patient_medications_paciente_id' AND object_id = OBJECT_ID('patient_medications'))
BEGIN
    CREATE INDEX idx_patient_medications_paciente_id ON patient_medications(paciente_id);
END
GO
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_medications' AND COLUMN_NAME = 'medicamento_id')
   AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_patient_medications_medicamento_id' AND object_id = OBJECT_ID('patient_medications'))
BEGIN
    CREATE INDEX idx_patient_medications_medicamento_id ON patient_medications(medicamento_id);
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
END
GO

-- Índices para mejorar rendimiento
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'nombre')
   AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_patients_nombre' AND object_id = OBJECT_ID('patients'))
BEGIN
    CREATE INDEX idx_patients_nombre ON patients(nombre);
END
GO

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'contacts' AND COLUMN_NAME = 'paciente_id')
   AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_contacts_paciente_id' AND object_id = OBJECT_ID('contacts'))
BEGIN
    CREATE INDEX idx_contacts_paciente_id ON contacts(paciente_id);
END
GO

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'fecha_vencimiento')
   AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_medications_fecha_vencimiento' AND object_id = OBJECT_ID('medications'))
BEGIN
    CREATE INDEX idx_medications_fecha_vencimiento ON medications(fecha_vencimiento);
END
GO

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'paciente_id')
   AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_entry_requests_paciente_id' AND object_id = OBJECT_ID('entry_requests'))
BEGIN
    CREATE INDEX idx_entry_requests_paciente_id ON entry_requests(paciente_id);
END
GO

DECLARE @entryEstadoExistsForIndex BIT = 0;
BEGIN TRY
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_requests' AND COLUMN_NAME = 'estado')
    BEGIN
        SET @entryEstadoExistsForIndex = 1;
    END
END TRY
BEGIN CATCH
    SET @entryEstadoExistsForIndex = 0;
END CATCH

IF @entryEstadoExistsForIndex = 1
BEGIN
    BEGIN TRY
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_entry_requests_estado' AND object_id = OBJECT_ID('entry_requests'))
        BEGIN
            DECLARE @createEntryEstadoIndexSql NVARCHAR(400);
            SET @createEntryEstadoIndexSql = N'CREATE INDEX idx_entry_requests_estado ON entry_requests(estado)';
            EXEC sp_executesql @createEntryEstadoIndexSql;
        END
    END TRY
    BEGIN CATCH
        -- Ignorar errores si la columna no existe aún
    END CATCH
END
GO

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entry_items' AND COLUMN_NAME = 'solicitud_id')
   AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_entry_items_solicitud_id' AND object_id = OBJECT_ID('entry_items'))
BEGIN
    CREATE INDEX idx_entry_items_solicitud_id ON entry_items(solicitud_id);
END
GO

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'personal_objects' AND COLUMN_NAME = 'paciente_id')
   AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_personal_objects_paciente_id' AND object_id = OBJECT_ID('personal_objects'))
BEGIN
    CREATE INDEX idx_personal_objects_paciente_id ON personal_objects(paciente_id);
END
GO

-- ============================================
-- CREAR USUARIO ADMINISTRADOR INICIAL (si no existe ningún usuario)
-- ============================================
-- Este script crea un usuario administrador por defecto si la tabla users está vacía
-- Email: admin@asilo.com
-- Contraseña: admin123
-- El hash se calcula como SHA256('admin@asilo.com::admin123')
-- Hash calculado: 50f3d9310f55a9e7f2b5b521bad3b9d3e51ca501d18b6d7db566f3429f3697f5
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
   AND NOT EXISTS (SELECT 1 FROM users)
BEGIN
    DECLARE @adminId NVARCHAR(36) = NEWID();
    DECLARE @adminEmail NVARCHAR(255) = 'admin@asilo.com';
    -- Hash SHA256 de 'admin@asilo.com::admin123' (calculado con Node.js crypto)
    DECLARE @adminPasswordHash NVARCHAR(255) = '50f3d9310f55a9e7f2b5b521bad3b9d3e51ca501d18b6d7db566f3429f3697f5';
    
    -- Verificar qué columnas existen para usar las correctas
    DECLARE @hasNombre BIT = 0;
    DECLARE @hasRol BIT = 0;
    DECLARE @hasHashContraseña BIT = 0;
    DECLARE @hasCambioContraseñaRequerido BIT = 0;
    DECLARE @hasFechaCreacion BIT = 0;
    
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'nombre')
        SET @hasNombre = 1;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'rol')
        SET @hasRol = 1;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'hash_contraseña')
        SET @hasHashContraseña = 1;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'cambio_contraseña_requerido')
        SET @hasCambioContraseñaRequerido = 1;
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'fecha_creacion')
        SET @hasFechaCreacion = 1;
    
    -- Insertar usando las columnas correctas (español o inglés)
    IF @hasNombre = 1 AND @hasRol = 1 AND @hasHashContraseña = 1
    BEGIN
        DECLARE @insertSql NVARCHAR(MAX);
        SET @insertSql = N'INSERT INTO users (id, ' +
            CASE WHEN @hasNombre = 1 THEN 'nombre' ELSE 'name' END + ', ' +
            CASE WHEN @hasRol = 1 THEN 'rol' ELSE 'role' END + ', email, ' +
            CASE WHEN @hasHashContraseña = 1 THEN 'hash_contraseña' ELSE 'password_hash' END + ', ' +
            CASE WHEN @hasCambioContraseñaRequerido = 1 THEN 'cambio_contraseña_requerido' ELSE 'password_change_required' END + ', ' +
            CASE WHEN @hasFechaCreacion = 1 THEN 'fecha_creacion' ELSE 'created_at' END +
            ') VALUES (@adminId, ''Administrador'', ''admin'', @adminEmail, @adminPasswordHash, 1, GETDATE())';
        
        EXEC sp_executesql @insertSql, 
            N'@adminId NVARCHAR(36), @adminEmail NVARCHAR(255), @adminPasswordHash NVARCHAR(255)',
            @adminId, @adminEmail, @adminPasswordHash;
        
        PRINT 'Usuario administrador inicial creado:';
        PRINT 'Email: admin@asilo.com';
        PRINT 'Contraseña: admin123';
        PRINT 'IMPORTANTE: Cambia la contraseña después del primer inicio de sesión.';
    END
END
GO
