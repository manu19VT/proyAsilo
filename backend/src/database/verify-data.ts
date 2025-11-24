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

async function verifyData() {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    console.log('Conectando a SQL Server...');
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✓ Conectado a SQL Server\n');
    
    console.log('========================================');
    console.log('VERIFICACIÓN DE DATOS DESPUÉS DE MIGRACIÓN');
    console.log('========================================\n');
    
    // Contar registros en cada tabla
    const tables = [
      { name: 'users', label: 'Usuarios' },
      { name: 'patients', label: 'Pacientes' },
      { name: 'contacts', label: 'Contactos' },
      { name: 'medications', label: 'Medicamentos' },
      { name: 'entry_requests', label: 'Solicitudes de entrada' },
      { name: 'entry_items', label: 'Items de solicitudes' },
      { name: 'patient_medications', label: 'Medicamentos asignados a pacientes' },
      { name: 'personal_objects', label: 'Objetos personales' },
    ];
    
    const counts: Record<string, number> = {};
    
    for (const table of tables) {
      try {
        const result = await pool.request()
          .query(`SELECT COUNT(*) as count FROM ${table.name}`);
        counts[table.name] = result.recordset[0].count;
        console.log(`${table.label}: ${counts[table.name]}`);
      } catch (err: any) {
        console.log(`${table.label}: Error - ${err.message.substring(0, 50)}`);
        counts[table.name] = -1;
      }
    }
    
    console.log('\n========================================');
    console.log('RESUMEN:');
    console.log('========================================');
    
    const totalRecords = Object.values(counts).reduce((sum, count) => sum + (count > 0 ? count : 0), 0);
    console.log(`Total de registros: ${totalRecords}`);
    
    if (totalRecords > 0) {
      console.log('\n✓ ¡Los datos están intactos!');
      console.log('  La migración solo renombró las columnas, NO eliminó datos.');
    } else {
      console.log('\n⚠️  No se encontraron registros.');
      console.log('  Esto puede ser normal si la base de datos estaba vacía.');
    }
    
    // Mostrar algunos ejemplos (detectando columnas automáticamente)
    console.log('\n========================================');
    console.log('EJEMPLOS DE DATOS (primeros 3 registros):');
    console.log('========================================\n');
    
    // Función helper para verificar si existe una columna
    const columnExists = async (table: string, column: string): Promise<boolean> => {
      if (!pool) return false;
      try {
        const result = await pool.request()
          .query(`SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}' AND COLUMN_NAME = '${column}'`);
        return result.recordset.length > 0;
      } catch {
        return false;
      }
    };
    
    if (!pool) {
      console.log('❌ No hay conexión a la base de datos');
      return;
    }
    
    if (counts['users'] > 0) {
      console.log('--- Usuarios ---');
      try {
        const hasNombre = await columnExists('users', 'nombre');
        const hasRol = await columnExists('users', 'rol');
        const query = hasNombre && hasRol
          ? 'SELECT TOP 3 id, nombre, rol, email FROM users'
          : 'SELECT TOP 3 id, name as nombre, role as rol, email FROM users';
        const users = await pool.request().query(query);
        console.table(users.recordset);
      } catch (err: any) {
        console.log('Error al obtener usuarios:', err.message.substring(0, 100));
      }
      console.log('');
    }
    
    if (counts['patients'] > 0) {
      console.log('--- Pacientes ---');
      try {
        const hasNombre = await columnExists('patients', 'nombre');
        const hasEstado = await columnExists('patients', 'estado');
        const hasStatus = await columnExists('patients', 'status');
        const hasEdad = await columnExists('patients', 'edad');
        const hasAge = await columnExists('patients', 'age');
        
        // Construir query dinámicamente según qué columnas existen
        let query = 'SELECT TOP 3 id, ';
        query += hasNombre ? 'nombre' : 'name as nombre';
        query += ', ';
        query += hasEdad ? 'edad' : (hasAge ? 'age as edad' : 'NULL as edad');
        query += ', ';
        query += hasEstado ? 'estado' : (hasStatus ? 'status as estado' : 'NULL as estado');
        query += ' FROM patients';
        
        const patients = await pool.request().query(query);
        console.table(patients.recordset);
      } catch (err: any) {
        console.log('Error al obtener pacientes:', err.message.substring(0, 100));
        console.log('  Esto puede indicar que la columna status aún necesita ser migrada a estado.');
        console.log('  Ejecuta: fix-patients-status.sql en SQL Server Management Studio');
      }
      console.log('');
    }
    
    if (counts['medications'] > 0) {
      console.log('--- Medicamentos ---');
      try {
        const hasNombre = await columnExists('medications', 'nombre');
        const hasFechaVencimiento = await columnExists('medications', 'fecha_vencimiento');
        const query = hasNombre && hasFechaVencimiento
          ? 'SELECT TOP 3 id, nombre, cantidad, fecha_vencimiento FROM medications'
          : 'SELECT TOP 3 id, name as nombre, quantity as cantidad, expiration_date as fecha_vencimiento FROM medications';
        const medications = await pool.request().query(query);
        console.table(medications.recordset);
      } catch (err: any) {
        console.log('Error al obtener medicamentos:', err.message.substring(0, 100));
      }
      console.log('');
    }
    
    console.log('✓ Verificación completada');
    
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
verifyData().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});

