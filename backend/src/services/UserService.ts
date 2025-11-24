import { v4 as uuidv4 } from 'uuid';
import { User } from '../types';
import { query, queryOne, execute } from '../database/database';

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
        cambio_contraseña_requerido as passwordChangeRequired
      FROM users
    `;
    const params: Record<string, any> = {};

    if (role) {
      sql += ' WHERE rol = @role';
      params.role = role;
    }

    sql += ' ORDER BY nombre ASC';

    const users = await query<User>(sql, params);
    return users.map(user => ({
      ...user,
      age: user.age ?? undefined,
      birthDate: user.birthDate ?? undefined,
      passwordChangeRequired: !!user.passwordChangeRequired
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
        cambio_contraseña_requerido as passwordChangeRequired
      FROM users 
      WHERE id = @id
    `, { id });
    return user
      ? {
          ...user,
          age: user.age ?? undefined,
          birthDate: user.birthDate ?? undefined,
          passwordChangeRequired: !!user.passwordChangeRequired
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
  async createUserWithPasswordHash(data: { name: string; role: string; email: string; passwordHash: string; age?: number; birthDate?: string; requireChange?: boolean }): Promise<User> {
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

    console.log(`Creando usuario con contraseña: name=${data.name}, role=${validatedRole}, email=${data.email}`);

    await execute(`
      INSERT INTO users (id, nombre, rol, email, edad, fecha_nacimiento, hash_contraseña, cambio_contraseña_requerido, fecha_creacion)
      VALUES (@id, @name, @role, @email, @age, @birthDate, @passwordHash, @passwordChangeRequired, @createdAt)
    `, {
      id,
      name: data.name.trim(),
      role: validatedRole,
      email: data.email.trim().toLowerCase(),
      age: data.age ?? null,
      birthDate: data.birthDate ?? null,
      passwordHash: data.passwordHash,
      passwordChangeRequired: data.requireChange ? 1 : 0,
      createdAt: now
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
    if (!existing) return false;

    // Limpiar referencias en tablas relacionadas
    await execute('UPDATE patients SET creado_por = NULL WHERE creado_por = @id', { id });
    await execute('UPDATE patients SET actualizado_por = NULL WHERE actualizado_por = @id', { id });
    await execute('UPDATE medications SET creado_por = NULL WHERE creado_por = @id', { id });
    await execute('UPDATE medications SET actualizado_por = NULL WHERE actualizado_por = @id', { id });
    await execute('UPDATE patient_medications SET prescrito_por = NULL WHERE prescrito_por = @id', { id });

    const rowsAffected = await execute('DELETE FROM users WHERE id = @id', { id });
    return rowsAffected > 0;
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
