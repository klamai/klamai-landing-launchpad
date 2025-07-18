
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, session, loading, isValidating, validateSession, forceSignOut } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [isReady, setIsReady] = useState(false);
  const [sessionValidated, setSessionValidated] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const initializeProtection = async () => {
      // Solo proceder si no estamos cargando y tenemos usuario y sesión
      if (!loading && user && session) {
        console.log('🔍 Validando sesión en ruta protegida...');
        
        // Validar que la sesión sea realmente válida
        const isValid = await validateSession();
        
        if (!isValid) {
          console.warn('❌ Sesión inválida detectada en ruta protegida');
          toast({
            title: "Sesión expirada",
            description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
            variant: "destructive",
          });
          await forceSignOut();
          return;
        }
        
        setSessionValidated(true);
      }
      
      // Dar un pequeño delay para asegurar que el estado se ha estabilizado
      timeoutId = setTimeout(() => {
        setIsReady(true);
      }, 100);
    };

    initializeProtection();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loading, user, session, validateSession, forceSignOut, toast]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading || !isReady || isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            {isValidating ? 'Validando sesión...' : 'Verificando autenticación...'}
          </p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado o la sesión no es válida, redirigir al login
  if (!user || !session || !sessionValidated) {
    console.log('🚫 Acceso denegado - redirigiendo a /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  console.log('✅ Acceso autorizado a ruta protegida');
  return <>{children}</>;
};

export default ProtectedRoute;
