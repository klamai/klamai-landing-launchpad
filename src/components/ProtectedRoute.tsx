
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
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
          <p className="text-gray-600 dark:text-gray-300">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigir al login apropiado
  if (!user) {
    // Determinar a qué auth redirigir basado en la ruta actual
    let authPath = '/auth';
    
    if (location.pathname.startsWith('/abogados')) {
      authPath = '/abogados/auth';
    } else if (location.pathname.startsWith('/clientes') || location.pathname.startsWith('/dashboard')) {
      authPath = '/clientes/auth';
    } else if (location.pathname.startsWith('/admin')) {
      authPath = '/admin/auth';
    }
    
    return <Navigate to={authPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
