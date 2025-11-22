import sql from 'mssql';
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

async function resetDatabase() {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    console.log('Conectando a SQL Server...');
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✓ Conectado a SQL Server\n');
    
    console.log('========================================');
    console.log('⚠️  ADVERTENCIA: Esto eliminará TODOS los datos');
    console.log('========================================\n');
    
    console.log('Eliminando tablas en orden (respetando foreign keys)...\n');
    
    // Eliminar tablas en orden inverso de dependencias
    const tablesToDrop = [
      'entry_items',
      'entry_requests',
      'patient_medications',
      'personal_objects',
      'contacts',
      'medications',
      'patients',
      'users'
    ];
    
    for (const table of tablesToDrop) {
      try {
        await pool.request().query(`DROP TABLE IF EXISTS ${table}`);
        console.log(`✓ Eliminada tabla: ${table}`);
      } catch (err: any) {
        // Intentar con sintaxis alternativa si DROP TABLE IF EXISTS no funciona
        try {
          await pool.request().query(`
            IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[${table}]') AND type in (N'U'))
            DROP TABLE [dbo].[${table}]
          `);
          console.log(`✓ Eliminada tabla: ${table}`);
        } catch (err2: any) {
          console.log(`  ⚠️  No se pudo eliminar ${table}: ${err2.message.substring(0, 50)}`);
        }
      }
    }
    
    console.log('\n========================================');
    console.log('Base de datos limpiada');
    console.log('========================================\n');
    
    console.log('Ahora ejecuta el script schema.sql completo para recrear las tablas.');
    console.log('O ejecuta: npm run migrate');
    console.log('\n✓ Proceso completado');
    
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
resetDatabase().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});

