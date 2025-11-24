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

async function runFixScript() {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    console.log('Conectando a SQL Server...');
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✓ Conectado a SQL Server');
    
    // Leer el script SQL
    const scriptPath = path.join(__dirname, 'fix_users_table.sql');
    const script = fs.readFileSync(scriptPath, 'utf-8');
    
    // Dividir el script en comandos (separados por GO)
    const commands = script
      .split(/^\s*GO\s*$/gim)
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.match(/^--/));
    
    console.log(`Ejecutando ${commands.length} comandos...\n`);
    
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
          
          // Mostrar resultados si es un SELECT
          if (cleanCommand.trim().toUpperCase().startsWith('SELECT')) {
            console.log(`\nResultado del comando ${i + 1}:`);
            console.table(result.recordset);
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
            errorMsg.includes('Invalid column name') && errorMsg.includes('does not exist');
          
          if (!isExpectedError) {
            console.error(`❌ Error en comando ${i + 1}:`);
            console.error(`   ${errorMsg.substring(0, 200)}`);
          }
        }
      }
    }
    
    console.log('\n✓ Script ejecutado correctamente');
    console.log('\nVerifica que todas las columnas estén en español.');
    
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
runFixScript().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});

