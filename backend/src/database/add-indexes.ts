import { getDatabase } from './database';
import fs from 'fs';
import path from 'path';

async function addIndexes() {
  try {
    const pool = await getDatabase();
    const schemaPath = path.join(__dirname, 'add-indexes.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ No se encontró add-indexes.sql');
      return;
    }

    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Dividir por GO (separador de batch en SQL Server)
    const commands = schema
      .split(/^\s*GO\s*$/gim)
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.match(/^--/) && !cmd.match(/^PRINT/));

    console.log('Agregando índices para mejorar el rendimiento...\n');

    for (const command of commands) {
      if (command.trim()) {
        try {
          await pool.request().query(command);
          // Extraer el nombre del índice del comando CREATE INDEX
          const indexMatch = command.match(/CREATE INDEX\s+(\w+)/i);
          if (indexMatch) {
            console.log(`✓ Índice ${indexMatch[1]} creado o ya existía`);
          }
        } catch (err: any) {
          const errorMsg = err.message || '';
          // Ignorar errores de "ya existe"
          if (!errorMsg.includes('already exists') && !errorMsg.includes('duplicate key')) {
            console.error(`❌ Error: ${errorMsg.substring(0, 200)}`);
          }
        }
      }
    }

    console.log('\n✓ Proceso de índices completado');
  } catch (err) {
    console.error('Error agregando índices:', err);
    throw err;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  addIndexes()
    .then(() => {
      console.log('✓ Índices agregados correctamente');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error:', err);
      process.exit(1);
    });
}

export { addIndexes };









