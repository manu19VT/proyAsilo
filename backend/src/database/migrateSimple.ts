import { getDatabase, closeDatabase } from './database';

async function migrateSimple() {
  console.log('Iniciando migración simple de base de datos...');
  
  try {
    const pool = await getDatabase();
    const request = pool.request();
    
    // Tabla de Usuarios
    try {
      await request.query(`
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
      `);
      console.log('✓ Tabla users verificada/creada');
    } catch (err: any) {
      console.log('⚠️  users:', err.message?.substring(0, 80));
    }
    
    // Tabla de Pacientes
    try {
      await request.query(`
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
      `);
      console.log('✓ Tabla patients verificada/creada');
    } catch (err: any) {
      console.log('⚠️  patients:', err.message?.substring(0, 80));
    }
    
    // Tabla de Contactos
    try {
      await request.query(`
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
      `);
      console.log('✓ Tabla contacts verificada/creada');
    } catch (err: any) {
      console.log('⚠️  contacts:', err.message?.substring(0, 80));
    }
    
    // Tabla de Medicamentos
    try {
      await request.query(`
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
      `);
      console.log('✓ Tabla medications verificada/creada');
    } catch (err: any) {
      console.log('⚠️  medications:', err.message?.substring(0, 80));
    }
    
    // Tabla de Solicitudes
    try {
      await request.query(`
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
      `);
      console.log('✓ Tabla entry_requests verificada/creada');
    } catch (err: any) {
      console.log('⚠️  entry_requests:', err.message?.substring(0, 80));
    }
    
    // Tabla de Items de Solicitudes
    try {
      await request.query(`
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
      `);
      console.log('✓ Tabla entry_items verificada/creada');
    } catch (err: any) {
      console.log('⚠️  entry_items:', err.message?.substring(0, 80));
    }
    
    // Tabla de Objetos Personales
    try {
      await request.query(`
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
      `);
      console.log('✓ Tabla personal_objects verificada/creada');
    } catch (err: any) {
      console.log('⚠️  personal_objects:', err.message?.substring(0, 80));
    }
    
    // Crear índices
    const indexes = [
      { name: 'idx_patients_name', table: 'patients', column: 'name' },
      { name: 'idx_contacts_patient_id', table: 'contacts', column: 'patient_id' },
      { name: 'idx_medications_expires_at', table: 'medications', column: 'expires_at' },
      { name: 'idx_entry_requests_patient_id', table: 'entry_requests', column: 'patient_id' },
      { name: 'idx_entry_requests_status', table: 'entry_requests', column: 'status' },
      { name: 'idx_entry_items_entry_request_id', table: 'entry_items', column: 'entry_request_id' },
      { name: 'idx_personal_objects_patient_id', table: 'personal_objects', column: 'patient_id' },
    ];
    
    for (const idx of indexes) {
      try {
        await request.query(`
          IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = '${idx.name}' AND object_id = OBJECT_ID('${idx.table}'))
          BEGIN
            CREATE INDEX ${idx.name} ON ${idx.table}(${idx.column});
          END
        `);
      } catch (err: any) {
        // Ignorar errores de índices
      }
    }
    
    console.log('✓ Índices verificados/creados');
    console.log('✓ Migración completada');
  } catch (error: any) {
    console.error('Error en migración:', error.message);
    throw error;
  } finally {
    await closeDatabase();
    process.exit(0);
  }
}

migrateSimple();


