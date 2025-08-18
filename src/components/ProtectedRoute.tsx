
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, session } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    let authRoute = "/auth";
    
    if (location.pathname.startsWith("/abogados/")) {
      authRoute = "/abogados/auth";
    } else if (location.pathname.startsWith("/admin/")) {
      authRoute = "/admin/auth";
    }
    
    return <Navigate to={authRoute} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
