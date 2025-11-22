import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

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

async function createAdminUser() {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    console.log('Conectando a SQL Server...');
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✓ Conectado a SQL Server\n');
    
    // Verificar si el usuario existe
    const checkResult = await pool.request()
      .query(`SELECT id, email, hash_contraseña FROM users WHERE LOWER(email) = 'admin@asilo.com'`);
    
    const adminPasswordHash = '50f3d9310f55a9e7f2b5b521bad3b9d3e51ca501d18b6d7db566f3429f3697f5'; // SHA256('admin@asilo.com::admin123')
    
    if (checkResult.recordset.length > 0) {
      console.log('Usuario admin@asilo.com ya existe. Actualizando contraseña...');
      
      const updateResult = await pool.request()
        .input('passwordHash', sql.NVarChar, adminPasswordHash)
        .query(`
          UPDATE users 
          SET hash_contraseña = @passwordHash,
              cambio_contraseña_requerido = 1
          WHERE LOWER(email) = 'admin@asilo.com'
        `);
      
      console.log('✓ Contraseña del usuario administrador actualizada');
    } else {
      console.log('Usuario admin@asilo.com no existe. Creando...');
      
      const adminId = uuidv4();
      
      await pool.request()
        .input('id', sql.NVarChar, adminId)
        .input('nombre', sql.NVarChar, 'Administrador')
        .input('rol', sql.NVarChar, 'admin')
        .input('email', sql.NVarChar, 'admin@asilo.com')
        .input('passwordHash', sql.NVarChar, adminPasswordHash)
        .query(`
          INSERT INTO users (id, nombre, rol, email, hash_contraseña, cambio_contraseña_requerido, fecha_creacion)
          VALUES (@id, @nombre, @rol, @email, @passwordHash, 1, GETDATE())
        `);
      
      console.log('✓ Usuario administrador creado');
    }
    
    // Verificar que se creó/actualizó correctamente
    const verifyResult = await pool.request()
      .query(`
        SELECT 
          id,
          nombre as name,
          rol as role,
          email,
          CASE 
            WHEN hash_contraseña IS NOT NULL THEN 'Contraseña configurada'
            ELSE 'Sin contraseña'
          END as password_status,
          cambio_contraseña_requerido as password_change_required
        FROM users 
        WHERE LOWER(email) = 'admin@asilo.com'
      `);
    
    console.log('\n✓ Usuario administrador verificado:');
    console.table(verifyResult.recordset);
    
    console.log('\n📋 Credenciales de acceso:');
    console.log('   Email: admin@asilo.com');
    console.log('   Contraseña: admin123');
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión.');
    
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    if (err.message.includes('Invalid column name')) {
      console.error('\n💡 Parece que las columnas aún no están en español.');
      console.error('   Ejecuta primero: npm run fix-users');
    }
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n✓ Conexión cerrada');
    }
  }
}

// Ejecutar el script
createAdminUser().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});

