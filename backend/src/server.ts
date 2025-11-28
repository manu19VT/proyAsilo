import express from 'express';
import cors from 'cors';
import { initDatabase } from './database/database';
import { isMockMode } from './utils/mockMode';

// Importar rutas
import patientsRouter from './routes/patients';
import medicationsRouter from './routes/medications';
import entryRequestsRouter from './routes/entryRequests';
import personalObjectsRouter from './routes/personalObjects';
import usersRouter from './routes/users';
import authRouter from './routes/auth';
import patientMedicationsRouter from './routes/patientMedications';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar base de datos solo si no estamos en modo mock
if (!isMockMode()) {
  initDatabase().catch(err => {
    console.error('Error inicializando base de datos:', err);
    process.exit(1);
  });
} else {
  console.log('Modo MOCK activado - Usando datos de prueba (sin base de datos)');
  console.log(' Credenciales de prueba:');
  console.log('   Email: admin@asilo.com');
  console.log('   Contraseña: admin123');
}

// Rutas
app.use('/api/patients', patientsRouter);
app.use('/api/medications', medicationsRouter);
app.use('/api/entry-requests', entryRequestsRouter);
app.use('/api/personal-objects', personalObjectsRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/patient-medications', patientMedicationsRouter);

// Ruta de salud/health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API del sistema de gestión de asilo está funcionando',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores globales
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose: http://localhost:${PORT}`);
  console.log(`API disponible en http://localhost:${PORT}/api`);
  console.log(`Pagina corriendo: http://localhost:${PORT}/api/health`);
  if (isMockMode()) {
    console.log(`\n MODO DESARROLLO: Usando datos mock (no se requiere base de datos)`);
  }
});

export default app;
