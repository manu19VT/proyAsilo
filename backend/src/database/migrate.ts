import { initDatabase, query, getDatabase, closeDatabase } from './database';

async function migrate() {
  console.log('Iniciando migración de base de datos...');
  
  try {
    // Inicializar el esquema base (crea todas las tablas y columnas)
    await initDatabase();
    
    console.log('✓ Migración completada');
  } catch (error: any) {
    console.error('Error en migración:', error);
    throw error;
  } finally {
    await closeDatabase();
    process.exit(0);
  }
}

migrate();
