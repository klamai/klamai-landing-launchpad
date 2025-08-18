import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { memo } from 'react';

interface RoleBasedRedirectProps {
  children?: React.ReactNode;
}

const LoadingSpinner = memo(() => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-300">Verificando permisos...</p>
    </div>
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * Componente para redirigir usuarios al dashboard apropiado según su rol
 * Centraliza toda la lógica de redirección basada en roles
 */
const RoleBasedRedirect = memo(({ children }: RoleBasedRedirectProps) => {
  const { profile, loading, user } = useAuth();

  // Mientras carga la sesión y el perfil, mostrar spinner
  if (loading) {
    return <LoadingSpinner />;
  }

  // Si después de cargar no hay usuario, redirigir a auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Si después de cargar sigue sin haber perfil, es un estado anómalo
  if (!profile) {
    console.error("RoleBasedRedirect: No se pudo cargar el perfil del usuario autenticado.");
    return <Navigate to="/auth" replace />;
  }

  // Mapa de redirecciones centralizado
  const getRedirectPath = () => {
    if (profile.role === 'abogado') {
      if (profile.tipo_abogado === 'super_admin') {
        return '/admin/dashboard';
      } else {
        return '/abogados/dashboard';
      }
    } else if (profile.role === 'cliente') {
      return '/dashboard';
    } else {
      // Rol desconocido, redirigir a auth
      return '/auth';
    }
  };

  const redirectPath = getRedirectPath();
  
  // Si se especifican children, renderizarlos (útil para casos específicos)
  // Si no, redirigir automáticamente
  if (children) {
    return <>{children}</>;
  }
  
  return <Navigate to={redirectPath} replace />;
});

RoleBasedRedirect.displayName = 'RoleBasedRedirect';

export default RoleBasedRedirect;





