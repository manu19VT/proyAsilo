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

async function testPatientsQuery() {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    console.log('Conectando a SQL Server...');
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✓ Conectado a SQL Server\n');
    
    console.log('========================================');
    console.log('PROBANDO CONSULTA DE PACIENTES');
    console.log('========================================\n');
    
    // Probar la consulta exacta que usa PatientService
    const sqlQuery = `
      SELECT 
        p.id,
        p.nombre as name,
        p.fecha_nacimiento as birthDate,
        p.lugar_nacimiento as birthPlace,
        p.edad as age,
        p.direccion as address,
        p.curp,
        p.rfc,
        p.fecha_ingreso as admissionDate,
        p.notas as notes,
        p.estado as status,
        p.fecha_baja as dischargeDate,
        p.motivo_baja as dischargeReason,
        p.fecha_creacion as createdAt,
        p.fecha_actualizacion as updatedAt,
        p.creado_por as createdBy,
        p.actualizado_por as updatedBy,
        u1.nombre as createdByName,
        u2.nombre as updatedByName
      FROM patients p
      LEFT JOIN users u1 ON p.creado_por = u1.id
      LEFT JOIN users u2 ON p.actualizado_por = u2.id
      ORDER BY p.nombre ASC
    `;
    
    console.log('Ejecutando consulta...\n');
    const result = await pool.request().query(sqlQuery);
    
    console.log(`✓ Consulta exitosa! Se encontraron ${result.recordset.length} pacientes\n`);
    
    if (result.recordset.length > 0) {
      console.log('Primeros 3 pacientes:');
      console.table(result.recordset.slice(0, 3));
    } else {
      console.log('⚠️  No se encontraron pacientes en la base de datos');
    }
    
    // Verificar columnas de la tabla patients
    console.log('\n========================================');
    console.log('VERIFICANDO COLUMNAS DE patients');
    console.log('========================================\n');
    
    const columnsResult = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'patients'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.table(columnsResult.recordset);
    
    // Verificar si hay columnas en inglés que no deberían estar
    const englishColumns = columnsResult.recordset.filter((col: any) => 
      ['name', 'status', 'birth_date', 'created_at', 'updated_at'].includes(col.COLUMN_NAME)
    );
    
    if (englishColumns.length > 0) {
      console.log('\n⚠️  ADVERTENCIA: Se encontraron columnas en inglés:');
      console.table(englishColumns);
      console.log('\nEstas columnas necesitan ser migradas a español.');
    } else {
      console.log('\n✓ Todas las columnas están en español');
    }
    
  } catch (err: any) {
    console.error('\n❌ ERROR AL EJECUTAR CONSULTA:');
    console.error('========================================');
    console.error('Mensaje:', err.message);
    console.error('Código:', err.code);
    console.error('Número:', err.number);
    if (err.originalError) {
      console.error('Error original:', err.originalError.message);
    }
    console.error('\nStack trace:');
    console.error(err.stack);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n✓ Conexión cerrada');
    }
  }
}

// Ejecutar el script
testPatientsQuery().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});

