import { getDatabase, closeDatabase, execute } from './database';
import * as fs from 'fs';
import * as path from 'path';

async function addEliminadoColumn() {
  try {
    console.log('Conectando a la base de datos...');
    const pool = await getDatabase();
    
    console.log('Ejecutando script para agregar columna eliminado a personal_objects...\n');
    
    // Verificar si la columna eliminado existe
    const checkEliminado = await pool.request()
      .query(`
        SELECT COUNT(*) as exists
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'personal_objects' AND COLUMN_NAME = 'eliminado'
      `);
    
    if (checkEliminado.recordset[0].exists === 0) {
      console.log('Agregando columna eliminado...');
      await execute(`
        ALTER TABLE personal_objects ADD eliminado BIT DEFAULT 0 NOT NULL;
      `);
      console.log('✓ Columna eliminado agregada');
    } else {
      console.log('✓ Columna eliminado ya existe');
    }
    
    // Verificar si la columna fecha_eliminacion existe
    const checkFechaEliminacion = await pool.request()
      .query(`
        SELECT COUNT(*) as exists
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'personal_objects' AND COLUMN_NAME = 'fecha_eliminacion'
      `);
    
    if (checkFechaEliminacion.recordset[0].exists === 0) {
      console.log('Agregando columna fecha_eliminacion...');
      await execute(`
        ALTER TABLE personal_objects ADD fecha_eliminacion DATETIME2 NULL;
      `);
      console.log('✓ Columna fecha_eliminacion agregada');
    } else {
      console.log('✓ Columna fecha_eliminacion ya existe');
    }
    
    // Actualizar registros existentes
    console.log('Actualizando registros existentes...');
    await execute(`
      UPDATE personal_objects SET eliminado = 0 WHERE eliminado IS NULL;
    `);
    console.log('✓ Registros actualizados');
    
    // Verificar si el índice existe
    const checkIndex = await pool.request()
      .query(`
        SELECT COUNT(*) as exists
        FROM sys.indexes
        WHERE name = 'idx_personal_objects_eliminado' AND object_id = OBJECT_ID('personal_objects')
      `);
    
    if (checkIndex.recordset[0].exists === 0) {
      console.log('Creando índice...');
      await execute(`
        CREATE INDEX idx_personal_objects_eliminado ON personal_objects(eliminado, fecha_eliminacion);
      `);
      console.log('✓ Índice creado');
    } else {
      console.log('✓ Índice ya existe');
    }
    
    console.log('\n✅ Script completado exitosamente!');
    console.log('La columna eliminado ha sido agregada a personal_objects.');
    
  } catch (error: any) {
    console.error('❌ Error ejecutando el script:', error.message);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Ejecutar el script
addEliminadoColumn()
  .then(() => {
    console.log('\nProceso finalizado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });








