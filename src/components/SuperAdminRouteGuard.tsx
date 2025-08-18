import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSuperAdminPermissions } from '../hooks/useSuperAdminPermissions';
import { useAuth } from '../hooks/useAuth';
import { Loader2, ShieldX } from 'lucide-react';

interface SuperAdminRouteGuardProps {
  children: React.ReactNode;
  fallbackPath?: string;
  showLoading?: boolean;
}

/**
 * SuperAdminRouteGuard - Componente de protección de rutas optimizado
 * 
 * REEMPLAZA COMPLETAMENTE el AdminSecurityMiddleware para mejor rendimiento:
 * - Verifica permisos una sola vez por sesión
 * - Usa caché inteligente con React Query
 * - No se re-ejecuta en cada navegación del sidebar
 * - Mejor experiencia de usuario sin verificaciones repetitivas
 * 
 * @param children - Componentes a renderizar si tiene permisos
 * @param fallbackPath - Ruta de redirección si no tiene permisos (default: /dashboard)
 * @param showLoading - Si mostrar spinner de carga (default: true)
 */
export const SuperAdminRouteGuard: React.FC<SuperAdminRouteGuardProps> = ({
  children,
  fallbackPath = '/dashboard',
  showLoading = true,
}) => {
  const location = useLocation();
  const { user, session, loading: authLoading } = useAuth();
  const { data: permissions, isLoading: permissionsLoading, error } = useSuperAdminPermissions();

  // Si está cargando la autenticación, mostrar loading
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">
          Restaurando sesión...
        </p>
      </div>
    );
  }

  // Si no hay usuario autenticado después de cargar, redirigir a la ruta de auth de admin
  if (!user || !session) {
    return <Navigate to="/admin/auth" state={{ from: location }} replace />;
  }

  // Si está cargando los permisos y se debe mostrar el loading
  if (permissionsLoading && showLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">
          Verificando permisos de administrador...
        </p>
      </div>
    );
  }

  // Si hay error en la verificación de permisos
  if (error) {
    console.error('Error en SuperAdminRouteGuard:', error);
    
    // Si es error de permisos insuficientes, redirigir
    if (error.message.includes('no tiene permisos de superadmin')) {
      return <Navigate to={fallbackPath} replace />;
    }
    
    // Si es error de red o base de datos, mostrar mensaje de error
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <ShieldX className="h-8 w-8 text-destructive" />
        <h3 className="text-lg font-semibold text-foreground">
          Error de verificación
        </h3>
        <p className="text-muted-foreground text-sm text-center max-w-md">
          No se pudieron verificar los permisos. Por favor, recarga la página o contacta al administrador.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Recargar página
        </button>
      </div>
    );
  }

  // Si no es superadmin, redirigir
  if (!permissions?.isSuperAdmin) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Si tiene permisos, renderizar los children
  return <>{children}</>;
};

/**
 * Hook para usar el guard en componentes funcionales
 * Útil cuando necesitas verificar permisos en componentes específicos
 */
export const useSuperAdminGuard = () => {
  const { data: permissions, isLoading, error } = useSuperAdminPermissions();
  
  return {
    hasAccess: permissions?.isSuperAdmin || false,
    isLoading,
    error,
    permissions: permissions?.permissions,
  };
};

export default SuperAdminRouteGuard;
