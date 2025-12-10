import { v4 as uuidv4 } from 'uuid';
import { User } from '../types';
import { query, queryOne, execute, withTransaction } from '../database/database';
import sql from 'mssql';

export class UserService {
  // Listar todos los usuarios
  async listUsers(role?: string): Promise<User[]> {
    let sql = `
      SELECT 
        id,
        nombre as name,
        rol as role,
        email,
        fecha_creacion as createdAt,
        edad as age,
        fecha_nacimiento as birthDate,
        cambio_contraseña_requerido as passwordChangeRequired,
        rol_personalizado_id as customRoleId
      FROM users
    `;
    const params: Record<string, any> = {};

    if (role) {
      sql += ' WHERE rol = @role';
      params.role = role;
    }

    sql += ' ORDER BY nombre ASC';

    const users = await query<User>(sql, params);
    console.log(`[listUsers] Consulta ejecutada. Rol filtro: ${role || 'todos'}, Usuarios encontrados: ${users.length}`);
    return users.map(user => ({
      ...user,
      age: user.age ?? undefined,
      birthDate: user.birthDate ?? undefined,
      passwordChangeRequired: !!user.passwordChangeRequired,
      customRoleId: user.customRoleId || undefined
    }));
  }

  // Obtener usuario por ID
  async getUserById(id: string): Promise<User | null> {
    const user = await queryOne<User>(`
      SELECT 
        id,
        nombre as name,
        rol as role,
        email,
        fecha_creacion as createdAt,
        edad as age,
        fecha_nacimiento as birthDate,
        cambio_contraseña_requerido as passwordChangeRequired,
        rol_personalizado_id as customRoleId
      FROM users 
      WHERE id = @id
    `, { id });
    return user
      ? {
          ...user,
          age: user.age ?? undefined,
          birthDate: user.birthDate ?? undefined,
          passwordChangeRequired: !!user.passwordChangeRequired,
          customRoleId: user.customRoleId || undefined
        }
      : null;
  }

  // Obtener usuario por email (incluye hash interno)
  private async getUserRowByEmail(email: string): Promise<{ id: string; name: string; role: string; email: string | null; created_at: string; password_hash: string | null; password_change_required: number | null; age: number | null; birth_date: string | null } | null> {
    const user = await queryOne<{ id: string; name: string; role: string; email: string | null; created_at: string; password_hash: string | null; password_change_required: number | null; age: number | null; birth_date: string | null }>(`
      SELECT id, nombre as name, rol as role, email, fecha_creacion as created_at, hash_contraseña as password_hash, cambio_contraseña_requerido as password_change_required, edad as age, fecha_nacimiento as birth_date
      FROM users
      WHERE LOWER(email) = LOWER(@email)
    `, { email });
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const row = await this.getUserRowByEmail(email);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      role: row.role as any,
      email: row.email || undefined,
      createdAt: row.created_at,
      age: row.age ?? undefined,
      birthDate: row.birth_date ?? undefined,
      passwordChangeRequired: !!row.password_change_required
    } as User;
  }

  // Buscar usuario por nombre (útil para buscar administradores específicos)
  async getUserByName(name: string): Promise<User | null> {
    const user = await queryOne<User>(`
      SELECT 
        id,
        nombre as name,
        rol as role,
        email,
        fecha_creacion as createdAt,
        edad as age,
        fecha_nacimiento as birthDate,
        cambio_contraseña_requerido as passwordChangeRequired
      FROM users 
      WHERE LOWER(nombre) = LOWER(@name)
    `, { name });
    return user
      ? {
          ...user,
          age: user.age ?? undefined,
          birthDate: user.birthDate ?? undefined,
          passwordChangeRequired: !!user.passwordChangeRequired
        }
      : null;
  }

  // Validar rol
  private validateRole(role: string | undefined | null): string {
    const validRoles = ['admin', 'nurse', 'doctor', 'usuario', 'reception'];
    
    // Si es null o undefined, usar 'usuario' por defecto
    if (!role) {
      return 'usuario';
    }
    
    // Normalizar: convertir a minúsculas y quitar espacios
    const normalizedRole = String(role).toLowerCase().trim();
    
    // Validar que esté en la lista de roles permitidos
    if (validRoles.includes(normalizedRole)) {
      return normalizedRole;
    }
    
    // Si no es válido, usar 'usuario' por defecto
    console.warn(`Rol inválido recibido: "${role}". Usando 'usuario' por defecto.`);
    return 'usuario';
  }

  // Crear usuario (sin contraseña)
  async createUser(data: Omit<User, 'id' | 'createdAt' | 'passwordChangeRequired'>): Promise<User> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const validatedRole = this.validateRole(data.role);
    
    // Validar que el nombre sea requerido
    if (!data.name || !data.name.trim()) {
      throw new Error('El nombre es requerido');
    }
    
    console.log(`Creando usuario: name=${data.name}, role=${validatedRole}, email=${(data as any).email || 'null'}`);
    
    await execute(`
      INSERT INTO users (id, nombre, rol, email, edad, fecha_nacimiento, hash_contraseña, cambio_contraseña_requerido, fecha_creacion)
      VALUES (@id, @name, @role, @email, @age, @birthDate, NULL, 0, @createdAt)
    `, {
      id,
      name: data.name.trim(),
      role: validatedRole,
      email: (data as any).email ? String((data as any).email).trim() : null,
      age: (data as any).age ?? null,
      birthDate: (data as any).birthDate ?? null,
      createdAt: now
    });
    
    const user = await this.getUserById(id);
    return user!;
  }

  // Crear usuario con password hash ya generado
  async createUserWithPasswordHash(data: { name: string; role: string; email: string; passwordHash: string; age?: number; birthDate?: string; requireChange?: boolean; customRoleId?: string }): Promise<User> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const validatedRole = this.validateRole(data.role);

    // Validar datos requeridos
    if (!data.name || !data.name.trim()) {
      throw new Error('El nombre es requerido');
    }
    if (!data.email || !data.email.trim()) {
      throw new Error('El email es requerido');
    }

    console.log(`Creando usuario con contraseña: name=${data.name}, role=${validatedRole}, email=${data.email}, customRoleId=${data.customRoleId || 'null'}`);

    await execute(`
      INSERT INTO users (id, nombre, rol, email, edad, fecha_nacimiento, hash_contraseña, cambio_contraseña_requerido, fecha_creacion, rol_personalizado_id)
      VALUES (@id, @name, @role, @email, @age, @birthDate, @passwordHash, @passwordChangeRequired, @createdAt, @customRoleId)
    `, {
      id,
      name: data.name.trim(),
      role: validatedRole,
      email: data.email.trim().toLowerCase(),
      age: data.age ?? null,
      birthDate: data.birthDate ?? null,
      passwordHash: data.passwordHash,
      passwordChangeRequired: data.requireChange ? 1 : 0,
      createdAt: now,
      customRoleId: data.customRoleId || null
    });

    const user = await this.getUserById(id);
    return user!;
  }

  // Actualizar usuario
  async updateUser(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'passwordChangeRequired'>>): Promise<User | null> {
    const existing = await this.getUserById(id);
    if (!existing) return null;
    
    // Validar rol si se proporciona
    const validatedRole = data.role !== undefined ? this.validateRole(data.role) : null;
    
    await execute(`
      UPDATE users 
      SET nombre = COALESCE(@name, nombre),
          rol = COALESCE(@role, rol),
          email = COALESCE(@email, email),
          edad = COALESCE(@age, edad),
          fecha_nacimiento = COALESCE(@birthDate, fecha_nacimiento)
      WHERE id = @id
    `, {
      name: data.name || null,
      role: validatedRole,
      email: data.email || null,
      age: (data as any).age ?? null,
      birthDate: (data as any).birthDate ?? null,
      id
    });
    
    return await this.getUserById(id);
  }

  async updatePassword(id: string, passwordHash: string, requireChange: boolean): Promise<User | null> {
    const existing = await this.getUserById(id);
    if (!existing) return null;

    await execute(`
      UPDATE users
      SET hash_contraseña = @passwordHash,
          cambio_contraseña_requerido = @requireChange
      WHERE id = @id
    `, {
      id,
      passwordHash,
      requireChange: requireChange ? 1 : 0
    });

    return this.getUserById(id);
  }

  // Eliminar usuario
  async deleteUser(id: string): Promise<boolean> {
    const existing = await this.getUserById(id);
    if (!existing) {
      console.log(`Usuario con id ${id} no encontrado`);
      return false;
    }

    console.log(`Eliminando usuario: ${existing.name} (${id})`);

    try {
      // Primero, verificar todas las referencias antes de intentar eliminar
      const pool = await import('../database/database').then(m => m.getDatabase());
      const checkRequest = pool.request();
      checkRequest.input('id', sql.NVarChar, id);
      
      // Consulta para encontrar todas las foreign keys que referencian a users
      const fkCheckQuery = `
        SELECT 
          OBJECT_NAME(f.parent_object_id) AS tabla,
          COL_NAME(fc.parent_object_id, fc.parent_column_id) AS columna,
          COUNT(*) AS cantidad
        FROM sys.foreign_keys AS f
        INNER JOIN sys.foreign_key_columns AS fc ON f.object_id = fc.constraint_object_id
        WHERE OBJECT_NAME(f.referenced_object_id) = 'users'
          AND COL_NAME(fc.referenced_object_id, fc.referenced_column_id) = 'id'
        GROUP BY f.parent_object_id, fc.parent_object_id, fc.parent_column_id
      `;
      
      const fkResult = await checkRequest.query(fkCheckQuery);
      console.log(`Foreign keys encontradas que referencian a users:`, fkResult.recordset);
      
      // Verificar qué tablas tienen datos que referencian a este usuario
      const tablesToCheck = [
        { table: 'patients', columns: ['creado_por', 'actualizado_por', 'doctor_id', 'enfermero_id'] },
        { table: 'medications', columns: ['creado_por', 'actualizado_por'] },
        { table: 'patient_medications', columns: ['prescrito_por'] },
        { table: 'entradas', columns: ['creado_por'] },
        { table: 'salidas', columns: ['creado_por'] },
        { table: 'caducidades', columns: ['creado_por'] },
        { table: 'personal_objects', columns: ['creado_por', 'actualizado_por'] },
        { table: 'contacts', columns: ['creado_por', 'actualizado_por'] },
        { table: 'entry_requests', columns: ['creado_por', 'actualizado_por'] },
        { table: 'entry_items', columns: ['creado_por', 'actualizado_por'] },
        { table: 'roles_personalizados', columns: [] }, // Esta no tiene FK directa pero verificamos
      ];
      
      for (const tableInfo of tablesToCheck) {
        for (const column of tableInfo.columns) {
          try {
            const checkQuery = `SELECT COUNT(*) as count FROM ${tableInfo.table} WHERE ${column} = @id`;
            const result = await checkRequest.query(checkQuery);
            const count = result.recordset[0]?.count || 0;
            if (count > 0) {
              console.log(`⚠ ${tableInfo.table}.${column} tiene ${count} referencia(s) al usuario ${id}`);
            }
          } catch (e: any) {
            if (!e.message?.includes('Invalid object name')) {
              console.warn(`No se pudo verificar ${tableInfo.table}.${column}: ${e.message}`);
            }
          }
        }
      }
      
      return await withTransaction(async (transaction) => {
        const request = new sql.Request(transaction);
        request.input('id', sql.NVarChar, id);
        
        // Limpiar referencias en tablas relacionadas (en orden para evitar problemas de FK)
        // IMPORTANTE: Primero limpiar users.eliminado_por porque puede referenciar al usuario que estamos eliminando
        try {
          const usersEliminadoPorResult = await request.query('UPDATE users SET eliminado_por = NULL WHERE eliminado_por = @id');
          console.log(`Actualizado users.eliminado_por, filas afectadas: ${usersEliminadoPorResult.rowsAffected[0]}`);
        } catch (e: any) {
          // Ignorar errores de columna no existente, pero no abortar la transacción
          if (e.message?.includes('Invalid column name')) {
            console.log(`Columna users.eliminado_por no existe, omitiendo...`);
          } else {
            console.warn(`Advertencia al limpiar users.eliminado_por: ${e.message}`);
            // No lanzar el error para no abortar la transacción
          }
        }
        
        // Limpiar audit_log (puede tener muchas referencias, mejor eliminar los registros o ponerlos en NULL)
        try {
          const auditLogResult = await request.query('DELETE FROM audit_log WHERE usuario_id = @id');
          console.log(`Eliminados registros de audit_log, filas afectadas: ${auditLogResult.rowsAffected[0]}`);
        } catch (e: any) {
          // Ignorar errores de tabla no existente, pero no abortar la transacción
          if (e.message?.includes('Invalid object name')) {
            console.log(`Tabla audit_log no existe, omitiendo...`);
          } else {
            console.warn(`Advertencia al limpiar audit_log: ${e.message}`);
            // No lanzar el error para no abortar la transacción
          }
        }
        
        // Tabla patients
        const patientsUpdates = [
          'UPDATE patients SET creado_por = NULL WHERE creado_por = @id',
          'UPDATE patients SET actualizado_por = NULL WHERE actualizado_por = @id',
          'UPDATE patients SET doctor_id = NULL WHERE doctor_id = @id',
          'UPDATE patients SET enfermero_id = NULL WHERE enfermero_id = @id'
        ];
        
        // Agregar eliminado_por si existe
        try {
          const eliminadoPorResult = await request.query('UPDATE patients SET eliminado_por = NULL WHERE eliminado_por = @id');
          console.log(`Actualizado patients.eliminado_por, filas afectadas: ${eliminadoPorResult.rowsAffected[0]}`);
        } catch (e: any) {
          // Ignorar errores de columna no existente, pero no abortar la transacción
          if (e.message?.includes('Invalid column name')) {
            console.log(`Columna patients.eliminado_por no existe, omitiendo...`);
          } else {
            console.warn(`Advertencia al limpiar patients.eliminado_por: ${e.message}`);
            // No lanzar el error para no abortar la transacción
          }
        }
        
        for (const updateQuery of patientsUpdates) {
          try {
            const result = await request.query(updateQuery);
            console.log(`Actualizado: ${updateQuery}, filas afectadas: ${result.rowsAffected[0]}`);
          } catch (e: any) {
            // Ignorar errores de columna no existente, pero registrar otros errores
            if (!e.message?.includes('Invalid column name')) {
              console.warn(`Error al ejecutar ${updateQuery}: ${e.message}`);
              // No lanzar el error para no abortar la transacción
            }
          }
        }
        
        // Tabla medications
        const medicationsUpdates = [
          'UPDATE medications SET creado_por = NULL WHERE creado_por = @id',
          'UPDATE medications SET actualizado_por = NULL WHERE actualizado_por = @id'
        ];
        
        for (const updateQuery of medicationsUpdates) {
          try {
            const result = await request.query(updateQuery);
            console.log(`Actualizado: ${updateQuery}, filas afectadas: ${result.rowsAffected[0]}`);
          } catch (e: any) {
            // Ignorar errores de columna no existente, pero registrar otros errores
            if (!e.message?.includes('Invalid column name')) {
              console.warn(`Error al ejecutar ${updateQuery}: ${e.message}`);
              // No lanzar el error para no abortar la transacción
            }
          }
        }
        
        // Tabla patient_medications
        try {
          const pmResult = await request.query('UPDATE patient_medications SET prescrito_por = NULL WHERE prescrito_por = @id');
          console.log(`Actualizado patient_medications, filas afectadas: ${pmResult.rowsAffected[0]}`);
        } catch (e: any) {
          // Ignorar errores de columna no existente, pero registrar otros errores
          if (!e.message?.includes('Invalid column name') && !e.message?.includes('Invalid object name')) {
            console.warn(`Error al actualizar patient_medications: ${e.message}`);
            // No lanzar el error para no abortar la transacción
          }
        }
        
        // Limpiar referencias en otras tablas si existen
        const otherTables = [
          { table: 'entradas', column: 'creado_por' },
          { table: 'salidas', column: 'creado_por' },
          { table: 'caducidades', column: 'creado_por' },
          { table: 'personal_objects', column: 'creado_por' },
          { table: 'personal_objects', column: 'actualizado_por' },
          { table: 'contacts', column: 'creado_por' },
          { table: 'contacts', column: 'actualizado_por' },
          { table: 'entry_requests', column: 'creado_por' },
          { table: 'entry_requests', column: 'actualizado_por' },
          { table: 'entry_items', column: 'creado_por' },
          { table: 'entry_items', column: 'actualizado_por' },
        ];
        
        for (const tableInfo of otherTables) {
          try {
            const updateQuery = `UPDATE ${tableInfo.table} SET ${tableInfo.column} = NULL WHERE ${tableInfo.column} = @id`;
            const result = await request.query(updateQuery);
            console.log(`Actualizado ${tableInfo.table}.${tableInfo.column}, filas afectadas: ${result.rowsAffected[0]}`);
          } catch (e: any) {
            // Ignorar errores de tabla/columna no existente, pero no abortar la transacción
            if (!e.message?.includes('Invalid object name') && !e.message?.includes('Invalid column name')) {
              console.warn(`Advertencia al limpiar ${tableInfo.table}.${tableInfo.column}: ${e.message}`);
              // No lanzar el error para no abortar la transacción
            }
          }
        }
        
        // Verificar que no queden referencias antes de eliminar
        console.log('Verificando que no queden referencias...');
        
        // Verificar audit_log
        try {
          const auditCheck = await request.query('SELECT COUNT(*) as count FROM audit_log WHERE usuario_id = @id');
          const auditCount = auditCheck.recordset[0]?.count || 0;
          if (auditCount > 0) {
            throw new Error(`Aún existen ${auditCount} referencia(s) en audit_log.usuario_id al usuario ${id}`);
          }
        } catch (e: any) {
          if (!e.message?.includes('Invalid object name') && !e.message?.includes('Aún existen')) {
            // Ignorar errores de tabla no existente
          } else if (e.message?.includes('Aún existen')) {
            throw e;
          }
        }
        
        // Verificar users.eliminado_por
        try {
          const usersEliminadoCheck = await request.query('SELECT COUNT(*) as count FROM users WHERE eliminado_por = @id');
          const usersEliminadoCount = usersEliminadoCheck.recordset[0]?.count || 0;
          if (usersEliminadoCount > 0) {
            throw new Error(`Aún existen ${usersEliminadoCount} referencia(s) en users.eliminado_por al usuario ${id}`);
          }
        } catch (e: any) {
          if (!e.message?.includes('Invalid column name') && !e.message?.includes('Aún existen')) {
            // Ignorar errores de columna no existente
          } else if (e.message?.includes('Aún existen')) {
            throw e;
          }
        }
        
        // Verificar patients.eliminado_por
        try {
          const patientsEliminadoCheck = await request.query('SELECT COUNT(*) as count FROM patients WHERE eliminado_por = @id');
          const patientsEliminadoCount = patientsEliminadoCheck.recordset[0]?.count || 0;
          if (patientsEliminadoCount > 0) {
            throw new Error(`Aún existen ${patientsEliminadoCount} referencia(s) en patients.eliminado_por al usuario ${id}`);
          }
        } catch (e: any) {
          if (!e.message?.includes('Invalid column name') && !e.message?.includes('Aún existen')) {
            // Ignorar errores de columna no existente
          } else if (e.message?.includes('Aún existen')) {
            throw e;
          }
        }
        
        for (const tableInfo of tablesToCheck) {
          for (const column of tableInfo.columns) {
            try {
              const checkQuery = `SELECT COUNT(*) as count FROM ${tableInfo.table} WHERE ${column} = @id`;
              const result = await request.query(checkQuery);
              const count = result.recordset[0]?.count || 0;
              if (count > 0) {
                throw new Error(`Aún existen ${count} referencia(s) en ${tableInfo.table}.${column} al usuario ${id}`);
              }
            } catch (e: any) {
              // Si es un error de "Aún existen", lanzarlo para abortar la transacción
              if (e.message?.includes('Aún existen')) {
                throw e;
              }
              // Ignorar errores de tabla/columna no existente, pero no abortar la transacción
              if (e.message?.includes('Invalid object name') || e.message?.includes('Invalid column name')) {
                console.log(`Tabla/columna ${tableInfo.table}.${column} no existe, omitiendo verificación...`);
                // Continuar sin abortar la transacción
              } else {
                // Otros errores: registrar pero no abortar la transacción
                console.warn(`Advertencia al verificar ${tableInfo.table}.${column}: ${e.message}`);
                // No lanzar el error para no abortar la transacción
              }
            }
          }
        }
        
        // Verificar si hay triggers en la tabla users
        console.log('Verificando triggers en la tabla users...');
        try {
          const triggersResult = await request.query(`
            SELECT 
              t.name AS trigger_name,
              t.is_disabled,
              OBJECT_DEFINITION(t.object_id) AS trigger_definition
            FROM sys.triggers t
            INNER JOIN sys.objects o ON t.parent_id = o.object_id
            WHERE o.name = 'users'
          `);
          
          if (triggersResult.recordset.length > 0) {
            console.warn('⚠️ TRIGGERS ENCONTRADOS EN LA TABLA users:');
            triggersResult.recordset.forEach((trigger: any) => {
              console.warn(`  - ${trigger.trigger_name} (deshabilitado: ${trigger.is_disabled})`);
              console.warn(`    Definición: ${trigger.trigger_definition?.substring(0, 200)}...`);
            });
          } else {
            console.log('✓ No se encontraron triggers en la tabla users');
          }
        } catch (e: any) {
          console.warn(`No se pudo verificar triggers: ${e.message}`);
        }
        
        // Verificar el estado del usuario ANTES del DELETE
        console.log('Verificando estado del usuario ANTES del DELETE...');
        let beforeDeleteUser: any = null;
        try {
          const beforeDeleteCheck = await request.query('SELECT id, nombre, eliminado_por FROM users WHERE id = @id');
          beforeDeleteUser = beforeDeleteCheck.recordset[0];
        } catch (e: any) {
          // Si la columna eliminado_por no existe, intentar sin ella
          if (e.message?.includes('Invalid column name') && e.message?.includes('eliminado_por')) {
            const beforeDeleteCheck = await request.query('SELECT id, nombre FROM users WHERE id = @id');
            beforeDeleteUser = beforeDeleteCheck.recordset[0];
          } else {
            throw e;
          }
        }
        console.log(`Usuario antes del DELETE:`, beforeDeleteUser);
        
        // Verificar que la transacción sigue activa antes de continuar
        try {
          const testQuery = await request.query('SELECT 1 as test');
          console.log('✓ Transacción sigue activa antes del DELETE');
        } catch (testError: any) {
          console.error(`ERROR: La transacción ya no está activa antes del DELETE: ${testError.message}`);
          throw new Error(`La transacción se abortó antes del DELETE: ${testError.message}`);
        }
        
        // Deshabilitar el trigger temporalmente para permitir hard delete
        console.log('Deshabilitando trigger TRG_users_before_delete...');
        try {
          await request.query('DISABLE TRIGGER TRG_users_before_delete ON users');
          console.log('✓ Trigger deshabilitado');
        } catch (e: any) {
          console.warn(`No se pudo deshabilitar el trigger (puede que no exista): ${e.message}`);
          // Si el error es grave, podría haber abortado la transacción
          if (e.code === 'EABORT' || e.message?.includes('Transaction has been aborted')) {
            throw new Error(`La transacción se abortó al intentar deshabilitar el trigger: ${e.message}`);
          }
        }
        
        // Verificar nuevamente que la transacción sigue activa
        try {
          const testQuery2 = await request.query('SELECT 1 as test');
          console.log('✓ Transacción sigue activa después de deshabilitar trigger');
        } catch (testError2: any) {
          console.error(`ERROR: La transacción ya no está activa después de deshabilitar trigger: ${testError2.message}`);
          throw new Error(`La transacción se abortó después de deshabilitar el trigger: ${testError2.message}`);
        }
        
        // Eliminar el usuario
        console.log('Ejecutando DELETE FROM users...');
        let deleteResult: any;
        let rowsAffected = 0;
        try {
          deleteResult = await request.query('DELETE FROM users WHERE id = @id');
          rowsAffected = deleteResult.rowsAffected[0];
          console.log(`Filas afectadas al eliminar usuario: ${rowsAffected}`);
        } catch (deleteError: any) {
          console.error(`ERROR al ejecutar DELETE: ${deleteError.message}`);
          console.error(`Código de error: ${deleteError.code}`);
          console.error(`Stack: ${deleteError.stack}`);
          // Re-lanzar el error para que la transacción se revierta
          throw new Error(`No se pudo eliminar el usuario: ${deleteError.message}`);
        }
        
        // Re-habilitar el trigger
        console.log('Re-habilitando trigger TRG_users_before_delete...');
        try {
          await request.query('ENABLE TRIGGER TRG_users_before_delete ON users');
          console.log('✓ Trigger re-habilitado');
        } catch (e: any) {
          console.warn(`No se pudo re-habilitar el trigger: ${e.message}`);
        }
        
        if (rowsAffected === 0) {
          console.error(`No se eliminó ningún usuario. El usuario con id ${id} podría no existir o haber sido eliminado previamente.`);
          throw new Error(`No se pudo eliminar el usuario. No se afectaron filas.`);
        }
        
        // Verificar que realmente se eliminó (dentro de la misma transacción)
        console.log('Verificando que el usuario fue eliminado...');
        let verifyResult: any = null;
        try {
          verifyResult = await request.query('SELECT id, nombre, eliminado_por FROM users WHERE id = @id');
        } catch (e: any) {
          // Si la columna eliminado_por no existe, intentar sin ella
          if (e.message?.includes('Invalid column name') && e.message?.includes('eliminado_por')) {
            verifyResult = await request.query('SELECT id, nombre FROM users WHERE id = @id');
          } else {
            throw e;
          }
        }
        
        if (verifyResult.recordset.length > 0) {
          const remainingUser = verifyResult.recordset[0];
          console.error(`ERROR: El usuario ${id} (${remainingUser.nombre}) aún existe después del DELETE dentro de la transacción!`);
          console.error(`Estado del usuario después del DELETE:`, remainingUser);
          
          // Verificar si el usuario tiene eliminado_por (soft delete) - solo si existe la columna
          if (remainingUser.eliminado_por !== null && remainingUser.eliminado_por !== undefined) {
            console.error(`⚠️ El usuario tiene eliminado_por = ${remainingUser.eliminado_por}, podría ser un soft delete`);
          }
          
          // Intentar obtener más información sobre por qué no se eliminó
          const errorInfo = await request.query(`
            SELECT 
              OBJECT_NAME(f.parent_object_id) AS tabla_bloqueadora,
              COL_NAME(fc.parent_object_id, fc.parent_column_id) AS columna_bloqueadora,
              f.delete_referential_action_desc AS accion_eliminacion
            FROM sys.foreign_keys AS f
            INNER JOIN sys.foreign_key_columns AS fc ON f.object_id = fc.constraint_object_id
            WHERE OBJECT_NAME(f.referenced_object_id) = 'users'
              AND COL_NAME(fc.referenced_object_id, fc.referenced_column_id) = 'id'
          `);
          
          console.error('Foreign keys que podrían estar bloqueando:', errorInfo.recordset);
          
          // Verificar si hay alguna fila que aún referencia a este usuario
          let blockingCheck: any = null;
          try {
            blockingCheck = await request.query(`
              SELECT 
                'patients' AS tabla, 'creado_por' AS columna, COUNT(*) AS count
              FROM patients WHERE creado_por = @id
              UNION ALL
              SELECT 'patients', 'actualizado_por', COUNT(*) FROM patients WHERE actualizado_por = @id
              UNION ALL
              SELECT 'patients', 'doctor_id', COUNT(*) FROM patients WHERE doctor_id = @id
              UNION ALL
              SELECT 'patients', 'enfermero_id', COUNT(*) FROM patients WHERE enfermero_id = @id
              UNION ALL
              SELECT 'medications', 'creado_por', COUNT(*) FROM medications WHERE creado_por = @id
              UNION ALL
              SELECT 'medications', 'actualizado_por', COUNT(*) FROM medications WHERE actualizado_por = @id
              UNION ALL
              SELECT 'patient_medications', 'prescrito_por', COUNT(*) FROM patient_medications WHERE prescrito_por = @id
              UNION ALL
              SELECT 'audit_log', 'usuario_id', COUNT(*) FROM audit_log WHERE usuario_id = @id
            `);
            
            // Intentar agregar eliminado_por si existe
            try {
              const eliminadoPorCheck = await request.query(`
                SELECT 'patients' AS tabla, 'eliminado_por' AS columna, COUNT(*) AS count FROM patients WHERE eliminado_por = @id
                UNION ALL
                SELECT 'users', 'eliminado_por', COUNT(*) FROM users WHERE eliminado_por = @id
              `);
              blockingCheck.recordset.push(...eliminadoPorCheck.recordset);
            } catch (e: any) {
              // Ignorar si la columna no existe
              if (!e.message?.includes('Invalid column name')) {
                console.warn(`Advertencia al verificar eliminado_por: ${e.message}`);
              }
            }
          } catch (e: any) {
            console.warn(`No se pudo verificar referencias bloqueadoras: ${e.message}`);
            blockingCheck = { recordset: [] };
          }
          
          const blockingRows = blockingCheck.recordset.filter((row: any) => row.count > 0);
          if (blockingRows.length > 0) {
            console.error('⚠️ AÚN HAY REFERENCIAS ACTIVAS:');
            blockingRows.forEach((row: any) => {
              console.error(`  - ${row.tabla}.${row.columna}: ${row.count} referencia(s)`);
            });
          }
          
          throw new Error(`No se pudo eliminar el usuario. El DELETE reportó ${rowsAffected} fila(s) afectada(s), pero el usuario aún existe. Esto podría indicar un trigger o una restricción que está restaurando el registro.`);
        }
        
        console.log(`✓ Usuario ${id} eliminado correctamente y verificado`);
        return true;
      });
    } catch (error: any) {
      console.error(`Error al eliminar usuario ${id}:`, error);
      throw error;
    }
  }

  // Validación de contraseña
  async verifyPassword(email: string, passwordHash: string): Promise<User | null> {
    const row = await this.getUserRowByEmail(email);
    if (!row || !row.password_hash) return null;
    if (row.password_hash !== passwordHash) return null;
    return this.getUserById(row.id);
  }
}

export const userService = new UserService();
