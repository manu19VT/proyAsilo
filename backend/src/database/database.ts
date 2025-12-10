import sql from 'mssql';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de conexión desde variables de entorno
// Manejar formato servidor:puerto o servidor,puerto
const dbServer = process.env.DB_SERVER || 'localhost';
let serverName = dbServer;
let port: number | undefined = undefined;

// Si el servidor incluye puerto (formato: servidor,puerto o servidor:puerto)
if (dbServer.includes(',') || dbServer.includes(':')) {
  const parts = dbServer.split(/[,:]/);
  serverName = parts[0].trim();
  if (parts[1]) {
    port = parseInt(parts[1].trim(), 10);
  }
}

const config: any = {
  server: serverName,
  port: port,
  database: process.env.DB_NAME || 'AsiloDB',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // Para Azure SQL usar true
    enableArithAbort: true,
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true' || true, // Para desarrollo local
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool: sql.ConnectionPool | null = null;

// Función para obtener o crear el pool de conexiones
export async function getDatabase(): Promise<sql.ConnectionPool> {
  if (!pool) {
    try {
      pool = new sql.ConnectionPool(config);
      await pool.connect();
      console.log('✓ Conectado a SQL Server');
      // Habilitar foreign keys (en SQL Server esto se hace a nivel de tabla con CONSTRAINTs)
      return pool;
    } catch (err) {
      console.error('Error conectando a SQL Server:', err);
      throw err;
    }
  }
  return pool;
}

// Función para inicializar el esquema
export async function initDatabase(): Promise<void> {
  try {
    const pool = await getDatabase();
    
    // Buscar schema.sql en varias ubicaciones posibles
    const possiblePaths = [
      path.join(process.cwd(), 'src', 'database', 'schema.sql'),
      path.join(process.cwd(), 'database', 'schema.sql'),
      path.join(__dirname, 'schema.sql'),
    ];
    
    let schemaPath = possiblePaths.find(p => fs.existsSync(p));
    
    if (!schemaPath) {
      console.error('No se encontró schema.sql. Buscado en:', possiblePaths);
      return;
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Dividir el script en comandos individuales (separados por GO)
    // GO es un separador de batch en SQL Server, pero no se ejecuta desde Node.js
    const rawCommands = schema
      .split(/^\s*GO\s*$/gim)
      .map(cmd => cmd.trim())
      .filter(cmd => {
        // Filtrar comentarios puros y líneas vacías
        const trimmed = cmd.trim();
        return trimmed.length > 0 && 
               !trimmed.match(/^--/) && 
               !trimmed.match(/^\/\*/);
      });
    
    // Ejecutar cada comando
    let tablesCreated = 0;
    let indexesCreated = 0;
    
    for (const command of rawCommands) {
      if (command.trim()) {
        // Limpiar comentarios inline (mantener bloques BEGIN...END intactos)
        const cleanCommand = command
          .split('\n')
          .map(line => {
            const commentIndex = line.indexOf('--');
            if (commentIndex >= 0) {
              // Verificar que no esté dentro de una cadena
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
            await pool.request().query(cleanCommand);
            
            // Contar qué se creó
            if (cleanCommand.toUpperCase().includes('CREATE TABLE')) {
              tablesCreated++;
            } else if (cleanCommand.toUpperCase().includes('CREATE INDEX')) {
              indexesCreated++;
            }
          } catch (err: any) {
            // Solo ignorar errores de "ya existe" o "no existe" para índices
            const errorMsg = err.message || '';
            const isExpectedError = 
              errorMsg.includes('There is already an object named') ||
              errorMsg.includes('already exists') ||
              errorMsg.includes('Duplicate key name') ||
              (errorMsg.includes('Cannot find the object') && cleanCommand.toUpperCase().includes('CREATE INDEX')) ||
              // Ignorar errores de migración que son esperados (columnas que ya fueron renombradas)
              (errorMsg.includes('Invalid column name') && (
                cleanCommand.includes('sp_rename') || 
                cleanCommand.includes('IF EXISTS') ||
                cleanCommand.includes('INFORMATION_SCHEMA')
              ));
            
            if (!isExpectedError) {
              console.error(`❌ Error ejecutando comando SQL:`);
              console.error(`   ${errorMsg.substring(0, 200)}`);
              console.error(`   Comando: ${cleanCommand.substring(0, 100)}...`);
            } else {
              // Mostrar mensajes informativos para migraciones exitosas
              if (cleanCommand.includes('sp_rename') && errorMsg.includes('Invalid column name')) {
                // Esto es normal cuando una columna ya fue renombrada
                // No mostrar error, solo continuar
              }
            }
          }
        }
      }
    }
    
    if (tablesCreated > 0 || indexesCreated > 0) {
      console.log(`✓ Creadas ${tablesCreated} tablas y ${indexesCreated} índices`);
    }
    
    console.log('✓ Base de datos inicializada correctamente');
  } catch (err) {
    console.error('Error inicializando base de datos:', err);
    throw err;
  }
}

// Función para cerrar la conexión
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('✓ Conexión a SQL Server cerrada');
  }
}

// Exportar función helper para ejecutar queries
export async function query<T = any>(queryText: string, params?: Record<string, any>): Promise<T[]> {
  const pool = await getDatabase();
  const request = pool.request();
  
  if (params) {
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });
  }
  
  const result = await request.query(queryText);
  return result.recordset as T[];
}

// Exportar función helper para ejecutar queries que retornan un solo registro
export async function queryOne<T = any>(queryText: string, params?: Record<string, any>): Promise<T | null> {
  const results = await query<T>(queryText, params);
  return results.length > 0 ? results[0] : null;
}

// Exportar función helper para ejecutar comandos (INSERT, UPDATE, DELETE)
export async function execute(commandText: string, params?: Record<string, any>): Promise<number> {
  const pool = await getDatabase();
  const request = pool.request();
  
  if (params) {
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });
  }
  
  const result = await request.query(commandText);
  return result.rowsAffected[0];
}

// Función helper para ejecutar código dentro de una transacción
export async function withTransaction<T>(
  callback: (transaction: sql.Transaction) => Promise<T>
): Promise<T> {
  const pool = await getDatabase();
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export default { getDatabase, initDatabase, closeDatabase, query, queryOne, execute, withTransaction };
