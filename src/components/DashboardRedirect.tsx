
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { memo } from 'react';

interface DashboardRedirectProps {
  children: React.ReactNode;
}

const LoadingSpinner = memo(() => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-300">Cargando dashboard...</p>
    </div>
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

const DashboardRedirect = memo(({ children }: DashboardRedirectProps) => {
  const { profile, loading, user } = useAuth();
  const location = useLocation();

  // Mientras carga la sesión y el perfil, mostrar spinner
  if (loading) {
    return <LoadingSpinner />;
  }

  // Función para determinar la ruta de auth apropiada
  const getAuthRoute = () => {
    if (location.pathname.startsWith("/abogados/")) {
      return "/abogados/auth";
    } else if (location.pathname.startsWith("/admin/")) {
      return "/admin/auth";
    }
    return "/auth"; // default
  };

  // Si después de cargar no hay usuario, redirigir a auth apropiado
  if (!user) {
    return <Navigate to={getAuthRoute()} replace />;
  }

  // Si después de cargar sigue sin haber perfil, es un estado anómalo.
  // Podríamos redirigir a una página de error o reintentar. Por ahora, a auth.
  if (!profile) {
    console.error("DashboardRedirect: No se pudo cargar el perfil del usuario autenticado.");
    return <Navigate to={getAuthRoute()} replace />;
  }

  // Lógica de redirección basada en el perfil
  if (profile.role === 'abogado') {
    // Los super admins y abogados regulares son manejados por LawyerDashboardRouter
    return <Navigate to="/abogados/dashboard" replace />;
  }
  
  // Si es cliente (o cualquier otro rol no especificado), se queda en el dashboard de cliente.
  return <>{children}</>;
});

DashboardRedirect.displayName = 'DashboardRedirect';

export default DashboardRedirect;
