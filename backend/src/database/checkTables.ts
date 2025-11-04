import { getDatabase, closeDatabase } from './database';

async function checkTables() {
  try {
    const pool = await getDatabase();
    const request = pool.request();
    
    const result = await request.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    console.log('\n📊 Tablas en la base de datos:');
    if (result.recordset.length === 0) {
      console.log('⚠️  No se encontraron tablas');
    } else {
      result.recordset.forEach((row: any) => {
        console.log(`  ✓ ${row.TABLE_NAME}`);
      });
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await closeDatabase();
    process.exit(0);
  }
}

checkTables();


