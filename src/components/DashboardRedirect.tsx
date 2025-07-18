
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface DashboardRedirectProps {
  children: React.ReactNode;
}

const DashboardRedirect = ({ children }: DashboardRedirectProps) => {
  const { user, userProfile, loading, isValidating } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Si no estamos cargando y tenemos usuario, estamos listos
    if (!loading && user) {
      const timeoutId = setTimeout(() => {
        setIsReady(true);
      }, 50); // Timeout más corto

      return () => clearTimeout(timeoutId);
    } else if (!loading && !user) {
      // Si no hay usuario y no estamos cargando, también estamos listos
      setIsReady(true);
    }
  }, [loading, user]);

  // Show loading while auth is loading or we're not ready
  if (loading || !isReady || isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            {isValidating ? 'Validando sesión...' : 'Cargando dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, dejar que el componente hijo (Dashboard) maneje la redirección
  if (!user) {
    return <>{children}</>;
  }

  // Si tenemos perfil de usuario y es abogado, redirigir
  if (userProfile?.role === 'abogado') {
    console.log('🚀 Redirigiendo a dashboard de abogado');
    return <Navigate to="/abogados/dashboard" replace />;
  }

  // Si tenemos usuario pero no perfil todavía, mostrar loading
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Obteniendo perfil de usuario...</p>
        </div>
      </div>
    );
  }

  console.log('🚀 Mostrando dashboard de cliente');
  return <>{children}</>;
};

export default DashboardRedirect;
