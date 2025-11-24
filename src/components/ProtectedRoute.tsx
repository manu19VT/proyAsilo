import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "nurse" | "doctor" | "usuario";
  allowUnauthenticated?: boolean;
}

/**
 * Componente que protege rutas basándose en autenticación y roles
 * 
 * @param allowUnauthenticated - Si es true, permite acceso sin autenticación (solo para dashboard)
 * @param requiredRole - Rol requerido para acceder. Si no se especifica, cualquier usuario autenticado puede acceder
 */
export default function ProtectedRoute({ 
  children, 
  requiredRole,
  allowUnauthenticated = false 
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  // Si permite no autenticados (solo para dashboard)
  if (allowUnauthenticated) {
    return <>{children}</>;
  }

  // Si no está autenticado, redirigir al dashboard
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Si el usuario tiene rol "usuario", solo puede ver el dashboard
  if (user.role === "usuario") {
    return <Navigate to="/" replace />;
  }

  // Si se requiere un rol específico, verificar que el usuario lo tenga
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Acceso permitido
  return <>{children}</>;
}

