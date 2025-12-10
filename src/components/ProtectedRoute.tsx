import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import { customRolesService, Permission } from "../services/customRolesService";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "nurse" | "doctor" | "usuario";
  excludeRoles?: ("admin" | "nurse" | "doctor" | "usuario" | "reception" | string)[];
  allowUnauthenticated?: boolean;
  requiredPermission?: Permission; // Permiso requerido para acceder (para roles personalizados)
}

/**
 * Mapeo de rutas a permisos requeridos
 */
const routeToPermission: Record<string, Permission> = {
  "/patients": "pacientes",
  "/meds": "medicamentos",
  "/entries": "control_es",
  "/objects": "objetos"
};

/**
 * Componente que protege rutas basándose en autenticación y roles
 * 
 * @param allowUnauthenticated - Si es true, permite acceso sin autenticación (solo para dashboard)
 * @param requiredRole - Rol requerido para acceder. Si no se especifica, cualquier usuario autenticado puede acceder
 * @param requiredPermission - Permiso requerido para acceder (para roles personalizados)
 */
export default function ProtectedRoute({ 
  children, 
  requiredRole,
  excludeRoles,
  allowUnauthenticated = false,
  requiredPermission
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // Determinar el permiso requerido basado en la ruta si no se especifica explícitamente
  const routePermission = requiredPermission || routeToPermission[location.pathname];

  // Cargar permisos del usuario si tiene un rol personalizado
  useEffect(() => {
    const loadPermissions = async () => {
      if (!user) {
        setUserPermissions([]);
        setLoading(false);
        return;
      }

      // Si es admin, tiene todos los permisos
      if (user.role === "admin") {
        setUserPermissions(["pacientes", "medicamentos", "control_es", "objetos"]);
        setLoading(false);
        return;
      }

      // Si tiene un rol personalizado, obtener sus permisos
      if (user.customRoleId) {
        try {
          const customRole = await customRolesService.getById(user.customRoleId);
          setUserPermissions(customRole ? customRole.permisos : []);
        } catch (error) {
          console.error("Error al cargar permisos del rol personalizado:", error);
          setUserPermissions([]);
        }
        setLoading(false);
        return;
      }

      // Permisos para roles predeterminados
      const defaultPermissions: Record<string, Permission[]> = {
        doctor: ["pacientes", "medicamentos"],
        nurse: ["pacientes", "medicamentos", "control_es"],
        reception: ["control_es", "objetos"],
        usuario: [] // Sin permisos por defecto
      };

      setUserPermissions(defaultPermissions[user.role] || []);
      setLoading(false);
    };

    loadPermissions();
  }, [user]);

  // Si permite no autenticados (solo para dashboard)
  if (allowUnauthenticated) {
    return <>{children}</>;
  }

  // Si no está autenticado, redirigir al dashboard
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Esperar a que se carguen los permisos
  if (loading) {
    return null; // O un spinner si prefieres
  }

  // Si se requiere un permiso específico (para roles personalizados o rutas específicas)
  if (routePermission) {
    // Admin siempre tiene acceso
    if (user.role === "admin") {
      return <>{children}</>;
    }

    // Verificar si el usuario tiene el permiso requerido
    if (!userPermissions.includes(routePermission)) {
      console.log(`Usuario ${user.name} no tiene permiso ${routePermission} para acceder a ${location.pathname}`);
      return <Navigate to="/" replace />;
    }
  }

  // Si el usuario tiene rol "usuario" sin rol personalizado, solo puede ver el dashboard
  if (user.role === "usuario" && !user.customRoleId) {
    return <Navigate to="/" replace />;
  }

  // Si se requiere un rol específico, verificar que el usuario lo tenga
  if (requiredRole && user.role !== requiredRole) {
    // Si tiene un rol personalizado, permitir acceso si tiene los permisos necesarios
    if (user.customRoleId && routePermission && userPermissions.includes(routePermission)) {
      return <>{children}</>;
    }
    return <Navigate to="/" replace />;
  }

  // Si se excluyen ciertos roles, verificar que el usuario no tenga uno de esos roles
  if (excludeRoles && excludeRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Acceso permitido
  return <>{children}</>;
}

