import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de conexión
const config: any = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'AsiloDB',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    enableArithAbort: true,
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true' || true,
  },
};

async function fixPatientsAllColumns() {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    console.log('Conectando a SQL Server...');
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✓ Conectado a SQL Server\n');
    
    console.log('========================================');
    console.log('MIGRACIÓN: Tabla patients');
    console.log('========================================\n');
    
    // Verificar columnas actuales
    const columnsResult = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'patients'
      ORDER BY ORDINAL_POSITION
    `);
    
    const columnNames = columnsResult.recordset.map((r: any) => r.COLUMN_NAME);
    console.log('Columnas actuales:', columnNames.join(', '));
    console.log('');
    
    // Mapeo de columnas a migrar
    const migrations = [
      { from: 'name', to: 'nombre' },
      { from: 'birth_date', to: 'fecha_nacimiento' },
      { from: 'birth_place', to: 'lugar_nacimiento' },
      { from: 'address', to: 'direccion' },
      { from: 'admission_date', to: 'fecha_ingreso' },
      { from: 'notes', to: 'notas' },
      { from: 'discharge_date', to: 'fecha_baja' },
      { from: 'discharge_reason', to: 'motivo_baja' },
      { from: 'created_at', to: 'fecha_creacion' },
      { from: 'updated_at', to: 'fecha_actualizacion' },
      { from: 'created_by', to: 'creado_por' },
      { from: 'updated_by', to: 'actualizado_por' },
    ];
    
    // Migrar cada columna
    for (const migration of migrations) {
      const hasFrom = columnNames.includes(migration.from);
      const hasTo = columnNames.includes(migration.to);
      
      if (hasFrom && !hasTo) {
        try {
          // Verificar si hay foreign keys
          if (migration.from === 'created_by' || migration.from === 'updated_by') {
            const fkResult = await pool.request().query(`
              SELECT name 
              FROM sys.foreign_keys 
              WHERE parent_object_id = OBJECT_ID('patients')
                AND (name LIKE '%${migration.from}%' OR name LIKE '%${migration.to}%')
            `);
            
            for (const fk of fkResult.recordset) {
              await pool.request().query(`ALTER TABLE patients DROP CONSTRAINT [${fk.name}]`);
              console.log(`  Eliminado FK: ${fk.name}`);
            }
          }
          
          await pool.request().query(`EXEC sp_rename 'patients.${migration.from}', '${migration.to}', 'COLUMN'`);
          console.log(`✓ ${migration.from} -> ${migration.to}`);
          
          // Recrear foreign keys si es necesario
          if (migration.from === 'created_by') {
            try {
              await pool.request().query(`
                ALTER TABLE patients 
                ADD CONSTRAINT FK_patients_creado_por 
                FOREIGN KEY (creado_por) REFERENCES users(id)
              `);
            } catch (err: any) {
              if (!err.message.includes('already exists')) {
                console.log(`  ⚠️  No se pudo recrear FK para creado_por`);
              }
            }
          }
          if (migration.from === 'updated_by') {
            try {
              await pool.request().query(`
                ALTER TABLE patients 
                ADD CONSTRAINT FK_patients_actualizado_por 
                FOREIGN KEY (actualizado_por) REFERENCES users(id)
              `);
            } catch (err: any) {
              if (!err.message.includes('already exists')) {
                console.log(`  ⚠️  No se pudo recrear FK para actualizado_por`);
              }
            }
          }
        } catch (err: any) {
          console.error(`  ❌ Error migrando ${migration.from}:`, err.message.substring(0, 100));
        }
      } else if (hasTo) {
        console.log(`  ✓ ${migration.to} ya existe`);
      }
    }
    
    // Migrar status -> estado (con constraints)
    if (columnNames.includes('status') && !columnNames.includes('estado')) {
      try {
        // Eliminar constraints
        const checkConstraints = await pool.request().query(`
          SELECT name 
          FROM sys.check_constraints 
          WHERE parent_object_id = OBJECT_ID('patients') 
            AND (name LIKE '%status%' OR name LIKE '%estado%')
        `);
        for (const ck of checkConstraints.recordset) {
          await pool.request().query(`ALTER TABLE patients DROP CONSTRAINT [${ck.name}]`);
        }
        
        const defaultConstraints = await pool.request().query(`
          SELECT name 
          FROM sys.default_constraints 
          WHERE parent_object_id = OBJECT_ID('patients') 
            AND (name LIKE '%status%' OR name LIKE '%estado%')
        `);
        for (const df of defaultConstraints.recordset) {
          await pool.request().query(`ALTER TABLE patients DROP CONSTRAINT [${df.name}]`);
        }
        
        await pool.request().query(`EXEC sp_rename 'patients.status', 'estado', 'COLUMN'`);
        console.log('✓ status -> estado');
        
        // Recrear constraints
        await pool.request().query(`
          ALTER TABLE patients 
          ADD CONSTRAINT DF_patients_estado DEFAULT 'activo' FOR estado
        `);
        await pool.request().query(`
          ALTER TABLE patients 
          ADD CONSTRAINT CK_patients_estado CHECK (estado IN ('activo', 'baja'))
        `);
        console.log('  ✓ Constraints recreados');
      } catch (err: any) {
        console.error('  ❌ Error migrando status:', err.message.substring(0, 100));
      }
    }
    
    console.log('\n========================================');
    console.log('VERIFICACIÓN FINAL');
    console.log('========================================\n');
    
    const finalColumns = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'patients'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Columnas finales:', finalColumns.recordset.map((r: any) => r.COLUMN_NAME).join(', '));
    
    // Verificar si quedan columnas en inglés
    const englishColumns = finalColumns.recordset.filter((r: any) => 
      ['name', 'status', 'birth_date', 'created_at', 'updated_at', 'created_by', 'updated_by'].includes(r.COLUMN_NAME)
    );
    
    if (englishColumns.length > 0) {
      console.log('\n⚠️  ADVERTENCIA: Aún quedan columnas en inglés:');
      englishColumns.forEach((col: any) => console.log(`  - ${col.COLUMN_NAME}`));
    } else {
      console.log('\n✓ Todas las columnas están en español');
    }
    
    console.log('\n✓ Migración completada');
    
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n✓ Conexión cerrada');
    }
  }
}

// Ejecutar el script
fixPatientsAllColumns().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});

