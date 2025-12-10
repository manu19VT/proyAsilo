import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, execute } from '../database/database';

export type Permission = "pacientes" | "medicamentos" | "control_es" | "objetos";

export interface CustomRole {
  id: string;
  nombre: string;
  permisos: Permission[];
  fechaCreacion: string;
  activo: boolean;
}

export class CustomRoleService {
  // Listar todos los roles personalizados
  async listRoles(): Promise<CustomRole[]> {
    const roles = await query<{ id: string; nombre: string; fecha_creacion: string; activo: boolean }>(`
      SELECT id, nombre, fecha_creacion, activo
      FROM roles_personalizados
      WHERE activo = 1
      ORDER BY nombre ASC
    `);

    // Obtener permisos para cada rol
    const rolesWithPermissions: CustomRole[] = [];
    for (const role of roles) {
      const permisos = await query<{ permiso: Permission }>(`
        SELECT permiso
        FROM permisos_rol
        WHERE rol_id = @rolId
      `, { rolId: role.id });

      rolesWithPermissions.push({
        id: role.id,
        nombre: role.nombre,
        permisos: permisos.map(p => p.permiso),
        fechaCreacion: role.fecha_creacion,
        activo: !!role.activo
      });
    }

    return rolesWithPermissions;
  }

  // Obtener un rol por ID
  async getRoleById(id: string): Promise<CustomRole | null> {
    const role = await queryOne<{ id: string; nombre: string; fecha_creacion: string; activo: boolean }>(`
      SELECT id, nombre, fecha_creacion, activo
      FROM roles_personalizados
      WHERE id = @id AND activo = 1
    `, { id });

    if (!role) return null;

    const permisos = await query<{ permiso: Permission }>(`
      SELECT permiso
      FROM permisos_rol
      WHERE rol_id = @rolId
    `, { rolId: role.id });

    return {
      id: role.id,
      nombre: role.nombre,
      permisos: permisos.map(p => p.permiso),
      fechaCreacion: role.fecha_creacion,
      activo: !!role.activo
    };
  }

  // Crear un nuevo rol
  async createRole(nombre: string, permisos: Permission[]): Promise<CustomRole> {
    const id = uuidv4();
    const fechaCreacion = new Date().toISOString();

    // Crear el rol
    await execute(`
      INSERT INTO roles_personalizados (id, nombre, fecha_creacion, activo)
      VALUES (@id, @nombre, @fechaCreacion, 1)
    `, { id, nombre, fechaCreacion });

    // Crear los permisos
    for (const permiso of permisos) {
      const permisoId = uuidv4();
      await execute(`
        INSERT INTO permisos_rol (id, rol_id, permiso)
        VALUES (@permisoId, @rolId, @permiso)
      `, { permisoId, rolId: id, permiso });
    }

    return {
      id,
      nombre,
      permisos,
      fechaCreacion,
      activo: true
    };
  }

  // Actualizar un rol
  async updateRole(id: string, nombre: string, permisos: Permission[]): Promise<CustomRole | null> {
    // Verificar que el rol existe
    const existingRole = await this.getRoleById(id);
    if (!existingRole) return null;

    // Actualizar el nombre del rol
    await execute(`
      UPDATE roles_personalizados
      SET nombre = @nombre
      WHERE id = @id
    `, { id, nombre });

    // Eliminar permisos existentes
    await execute(`
      DELETE FROM permisos_rol
      WHERE rol_id = @rolId
    `, { rolId: id });

    // Crear los nuevos permisos
    for (const permiso of permisos) {
      const permisoId = uuidv4();
      await execute(`
        INSERT INTO permisos_rol (id, rol_id, permiso)
        VALUES (@permisoId, @rolId, @permiso)
      `, { permisoId, rolId: id, permiso });
    }

    return this.getRoleById(id);
  }

  // Eliminar un rol (soft delete)
  async deleteRole(id: string): Promise<boolean> {
    const result = await execute(`
      UPDATE roles_personalizados
      SET activo = 0
      WHERE id = @id
    `, { id });

    return result > 0;
  }

  // Verificar si un rol tiene un permiso específico
  async hasPermission(roleId: string, permission: Permission): Promise<boolean> {
    const result = await queryOne<{ count: number }>(`
      SELECT COUNT(*) as count
      FROM permisos_rol
      WHERE rol_id = @rolId AND permiso = @permiso
    `, { rolId: roleId, permiso: permission });

    return (result?.count || 0) > 0;
  }
}

export const customRoleService = new CustomRoleService();


