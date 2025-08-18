import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { logError, logAuth } from '@/utils/secureLogging';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('cliente' | 'abogado')[];
  requiredType?: 'super_admin' | 'regular';
  redirectTo?: string;
}

const RoleBasedRoute = ({ 
  children, 
  allowedRoles, 
  requiredType,
  redirectTo 
}: RoleBasedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Dar tiempo para que la autenticación se inicialice
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Mostrar loading mientras se verifica la autenticación
  if (loading || !isReady) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigir al login apropiado
  if (!user) {
    // Log del intento de acceso sin autenticación
    logAuth('login', false, `RoleBasedRoute - ${location.pathname}`);
    
    // Redirigir a la página de auth apropiada según la ruta
    const authPath = location.pathname.startsWith('/admin') 
      ? '/admin/auth' 
      : allowedRoles.includes('abogado') 
        ? '/abogados/auth' 
        : '/auth';
    
    return <Navigate to={authPath} state={{ from: location }} replace />;
  }

  // Si no hay perfil aún, esperar
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Verificar rol del usuario
  const hasRequiredRole = allowedRoles.includes(profile.role);
  
  // Verificar tipo específico si es requerido
  const hasRequiredType = requiredType 
    ? profile.tipo_abogado === requiredType 
    : true;

  // Si no tiene permisos, redirigir automáticamente
  if (!hasRequiredRole || !hasRequiredType) {
    // Log detallado del acceso denegado
    console.log(`🚫 Acceso denegado: rol=${profile.role}, tipo=${profile.tipo_abogado}, requerido=${allowedRoles}, tipo_requerido=${requiredType}`);
    
    // Log de seguridad
    logAuth('login', false, `RoleBasedRoute - ${location.pathname} - Usuario: ${profile.role}/${profile.tipo_abogado}`);
    
    // Determinar a dónde redirigir según el rol del usuario
    let redirectPath = redirectTo;
    
    if (!redirectPath) {
      if (profile.role === 'cliente') {
        redirectPath = '/dashboard';
      } else if (profile.role === 'abogado') {
        redirectPath = profile.tipo_abogado === 'super_admin' 
          ? '/admin/dashboard' 
          : '/abogados/dashboard';
      } else {
        redirectPath = '/auth';
      }
    }
    
    return <Navigate to={redirectPath} replace />;
  }

  // Log de acceso exitoso
  logAuth('login', true, `RoleBasedRoute - ${location.pathname} - Usuario: ${profile.role}/${profile.tipo_abogado}`);

  return <>{children}</>;
};

export default RoleBasedRoute;

