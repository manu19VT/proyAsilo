// Servicio para manejar roles personalizados
// Ahora usa la API del backend

import { api } from "../api/client";

export type Permission = "pacientes" | "medicamentos" | "control_es" | "objetos";

export interface CustomRole {
  id: string;
  nombre: string;
  permisos: Permission[];
  fechaCreacion: string;
  activo?: boolean;
}

export const customRolesService = {
  // Obtener todos los roles personalizados
  async getAll(): Promise<CustomRole[]> {
    try {
      const roles = await api.listCustomRoles();
      return roles.map(r => ({
        id: r.id,
        nombre: r.nombre,
        permisos: r.permisos as Permission[],
        fechaCreacion: r.fechaCreacion,
        activo: r.activo
      }));
    } catch (error) {
      console.error("Error al cargar roles personalizados:", error);
      return [];
    }
  },

  // Obtener un rol por ID
  async getById(id: string): Promise<CustomRole | null> {
    try {
      const role = await api.getCustomRole(id);
      return {
        id: role.id,
        nombre: role.nombre,
        permisos: role.permisos as Permission[],
        fechaCreacion: role.fechaCreacion,
        activo: role.activo
      };
    } catch (error) {
      console.error("Error al obtener rol personalizado:", error);
      return null;
    }
  },

  // Crear un nuevo rol
  async create(nombre: string, permisos: Permission[]): Promise<CustomRole> {
    const role = await api.createCustomRole(nombre, permisos);
    return {
      id: role.id,
      nombre: role.nombre,
      permisos: role.permisos as Permission[],
      fechaCreacion: role.fechaCreacion,
      activo: role.activo
    };
  },

  // Actualizar un rol
  async update(id: string, nombre: string, permisos: Permission[]): Promise<CustomRole | null> {
    try {
      const role = await api.updateCustomRole(id, nombre, permisos);
      return {
        id: role.id,
        nombre: role.nombre,
        permisos: role.permisos as Permission[],
        fechaCreacion: role.fechaCreacion,
        activo: role.activo
      };
    } catch (error) {
      console.error("Error al actualizar rol personalizado:", error);
      return null;
    }
  },

  // Eliminar un rol
  async delete(id: string): Promise<boolean> {
    try {
      await api.deleteCustomRole(id);
      return true;
    } catch (error) {
      console.error("Error al eliminar rol personalizado:", error);
      return false;
    }
  },

  // Verificar si un rol tiene un permiso específico
  async hasPermission(roleId: string, permission: Permission): Promise<boolean> {
    const role = await this.getById(roleId);
    return role ? role.permisos.includes(permission) : false;
  }
};

