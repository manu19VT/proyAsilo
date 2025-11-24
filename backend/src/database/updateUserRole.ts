import { getDatabase, closeDatabase } from './database';

async function updateUserRole() {
  console.log('Actualizando rol de usuarios...');
  
  try {
    const pool = await getDatabase();
    const request = pool.request();
    
    // Primero, actualizar cualquier registro existente con 'reception' a 'usuario'
    try {
      const result = await request.query(`
        UPDATE users 
        SET role = 'usuario' 
        WHERE role = 'reception'
      `);
      console.log(`✓ Actualizados ${result.rowsAffected} usuarios con rol 'reception' a 'usuario'`);
    } catch (err: any) {
      console.log('⚠️  Actualizando usuarios:', err.message?.substring(0, 80));
    }
    
    // Eliminar el constraint antiguo si existe
    try {
      await request.query(`
        ALTER TABLE users DROP CONSTRAINT IF EXISTS CK__users__role
      `);
      console.log('✓ Constraint antiguo eliminado');
    } catch (err: any) {
      // Ignorar si no existe
    }
    
    // Agregar el nuevo constraint con 'usuario' en lugar de 'reception'
    try {
      await request.query(`
        ALTER TABLE users 
        ADD CONSTRAINT CK_users_role 
        CHECK(role IN ('admin', 'nurse', 'doctor', 'usuario'))
      `);
      console.log('✓ Nuevo constraint agregado');
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        console.log('✓ Constraint ya existe');
      } else {
        console.log('⚠️  Agregando constraint:', err.message?.substring(0, 80));
      }
    }
    
    console.log('✓ Actualización de roles completada');
  } catch (error: any) {
    console.error('Error actualizando roles:', error.message);
    throw error;
  } finally {
    await closeDatabase();
    process.exit(0);
  }
}

updateUserRole();

