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

async function createFreshSchema() {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    console.log('Conectando a SQL Server...');
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✓ Conectado a SQL Server\n');
    
    // Leer el script SQL
    const scriptPath = path.join(__dirname, 'create-fresh-schema.sql');
    const script = fs.readFileSync(scriptPath, 'utf-8');
    
    // Dividir el script en comandos (separados por GO)
    // Necesitamos dividir por líneas que contengan solo "GO"
    const lines = script.split('\n');
    const commands: string[] = [];
    let currentCommand = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      // Si la línea es solo "GO" (case insensitive), finalizar el comando actual
      if (/^\s*GO\s*$/i.test(trimmedLine)) {
        if (currentCommand.trim()) {
          commands.push(currentCommand.trim());
          currentCommand = '';
        }
      } else if (!trimmedLine.match(/^--/) && trimmedLine.length > 0) {
        // Agregar línea al comando actual (ignorar comentarios puros)
        currentCommand += line + '\n';
      }
    }
    // Agregar el último comando si existe
    if (currentCommand.trim()) {
      commands.push(currentCommand.trim());
    }
    
    console.log(`Ejecutando ${commands.length} comandos...\n`);
    
    let tablesCreated = 0;
    let indexesCreated = 0;
    
    // Ejecutar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      // Limpiar comentarios inline
      const cleanCommand = command
        .split('\n')
        .map(line => {
          const commentIndex = line.indexOf('--');
          if (commentIndex >= 0) {
            const beforeComment = line.substring(0, commentIndex);
            const quoteCount = (beforeComment.match(/'/g) || []).length;
            if (quoteCount % 2 === 0) {
              return line.substring(0, commentIndex).trim();
            }
          }
          return line.trim();
        })
        .filter(line => line.length > 0)
        .join('\n');
      
      if (cleanCommand.trim()) {
        try {
          const result = await pool.request().query(cleanCommand);
          
          // Contar qué se creó
          if (cleanCommand.toUpperCase().includes('CREATE TABLE')) {
            tablesCreated++;
            console.log(`✓ Tabla creada (comando ${i + 1})`);
          } else if (cleanCommand.toUpperCase().includes('CREATE INDEX')) {
            indexesCreated++;
          }
          
          // Mostrar mensajes PRINT si existen
          if (result.recordset && result.recordset.length > 0) {
            result.recordset.forEach((row: any) => {
              if (row[''] || row['PRINT']) {
                console.log(row[''] || row['PRINT']);
              }
            });
          }
        } catch (err: any) {
          // Ignorar errores esperados
          const errorMsg = err.message || '';
          const isExpectedError = 
            errorMsg.includes('There is already an object named') ||
            errorMsg.includes('already exists') ||
            errorMsg.includes('Duplicate key name') ||
            (errorMsg.includes('Cannot find the object') && cleanCommand.toUpperCase().includes('CREATE INDEX'));
          
          if (!isExpectedError) {
            console.error(`❌ Error en comando ${i + 1}:`);
            console.error(`   ${errorMsg.substring(0, 200)}`);
            console.error(`   Comando: ${cleanCommand.substring(0, 100)}...`);
          }
        }
      }
    }
    
    console.log(`\n✓ Creadas ${tablesCreated} tablas y ${indexesCreated} índices`);
    
    console.log('\n✓ Base de datos creada correctamente');
    console.log('Todas las tablas tienen columnas en español desde el inicio.');
    
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
createFreshSchema().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});

