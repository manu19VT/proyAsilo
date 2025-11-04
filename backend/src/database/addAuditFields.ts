import { getDatabase, closeDatabase } from './database';

async function addAuditFields() {
  console.log('Agregando campos de auditoría...');
  
  try {
    const pool = await getDatabase();
    const request = pool.request();
    
    // Agregar campos de auditoría a patients
    try {
      await request.query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'created_by')
        BEGIN
          ALTER TABLE patients ADD created_by NVARCHAR(36) NULL;
        END
      `);
      console.log('✓ Campo created_by agregado a patients');
    } catch (err: any) {
      console.log('⚠️  created_by en patients:', err.message?.substring(0, 80));
    }
    
    try {
      await request.query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'updated_by')
        BEGIN
          ALTER TABLE patients ADD updated_by NVARCHAR(36) NULL;
        END
      `);
      console.log('✓ Campo updated_by agregado a patients');
    } catch (err: any) {
      console.log('⚠️  updated_by en patients:', err.message?.substring(0, 80));
    }
    
    // Agregar campos de auditoría a medications
    try {
      await request.query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'created_by')
        BEGIN
          ALTER TABLE medications ADD created_by NVARCHAR(36) NULL;
        END
      `);
      console.log('✓ Campo created_by agregado a medications');
    } catch (err: any) {
      console.log('⚠️  created_by en medications:', err.message?.substring(0, 80));
    }
    
    try {
      await request.query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'medications' AND COLUMN_NAME = 'updated_by')
        BEGIN
          ALTER TABLE medications ADD updated_by NVARCHAR(36) NULL;
        END
      `);
      console.log('✓ Campo updated_by agregado a medications');
    } catch (err: any) {
      console.log('⚠️  updated_by en medications:', err.message?.substring(0, 80));
    }
    
    // Agregar foreign keys si no existen
    try {
      await request.query(`
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_patients_created_by')
        BEGIN
          ALTER TABLE patients ADD CONSTRAINT FK_patients_created_by FOREIGN KEY (created_by) REFERENCES users(id);
        END
      `);
      console.log('✓ Foreign key FK_patients_created_by agregada');
    } catch (err: any) {
      // Ignorar si ya existe
    }
    
    try {
      await request.query(`
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_patients_updated_by')
        BEGIN
          ALTER TABLE patients ADD CONSTRAINT FK_patients_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);
        END
      `);
      console.log('✓ Foreign key FK_patients_updated_by agregada');
    } catch (err: any) {
      // Ignorar si ya existe
    }
    
    try {
      await request.query(`
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_medications_created_by')
        BEGIN
          ALTER TABLE medications ADD CONSTRAINT FK_medications_created_by FOREIGN KEY (created_by) REFERENCES users(id);
        END
      `);
      console.log('✓ Foreign key FK_medications_created_by agregada');
    } catch (err: any) {
      // Ignorar si ya existe
    }
    
    try {
      await request.query(`
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_medications_updated_by')
        BEGIN
          ALTER TABLE medications ADD CONSTRAINT FK_medications_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);
        END
      `);
      console.log('✓ Foreign key FK_medications_updated_by agregada');
    } catch (err: any) {
      // Ignorar si ya existe
    }
    
    console.log('✓ Campos de auditoría agregados correctamente');
  } catch (error: any) {
    console.error('Error agregando campos de auditoría:', error.message);
    throw error;
  } finally {
    await closeDatabase();
    process.exit(0);
  }
}

addAuditFields();

