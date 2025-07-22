
import { useEffect, useState, memo, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface DashboardRedirectProps {
  children: React.ReactNode;
}

// Cache para roles de usuario para evitar llamadas repetidas
const roleCache = new Map<string, { role: string; timestamp: number }>();
const ROLE_CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

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
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función optimizada para obtener rol de usuario
  const fetchUserRole = useCallback(async () => {
    if (!user) {
      setRoleLoading(false);
      return;
    }

    try {
      // Verificar cache primero
      const cacheKey = user.id;
      const cached = roleCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < ROLE_CACHE_DURATION) {
        console.log('✅ Rol obtenido desde cache:', cached.role);
        setUserRole(cached.role);
        setRoleLoading(false);
        return;
      }

      console.log('🔍 Fetcheando rol de usuario desde BD:', user.id);
      
      // Consulta optimizada con selección específica
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching user role:', error);
        setError('Error al obtener información del usuario');
        setUserRole('cliente'); // Default fallback
      } else if (profile) {
        console.log('✅ Rol de usuario obtenido:', profile.role);
        
        // Guardar en cache
        roleCache.set(cacheKey, {
          role: profile.role,
          timestamp: Date.now()
        });
        
        setUserRole(profile.role);
      } else {
        console.log('⚠️ No se encontró perfil de usuario, usando rol por defecto');
        setUserRole('cliente'); // Default fallback
      }
    } catch (error: any) {
      console.error('❌ Error general fetching user role:', error);
      setError('Error de conexión');
      setUserRole('cliente'); // Default fallback
    } finally {
      setRoleLoading(false);
    }
  }, [user]);

  // Efecto optimizado
  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  // Limpiar cache cuando el usuario cambia
  useEffect(() => {
    if (!user && roleCache.size > 0) {
      roleCache.clear();
    }
  }, [user]);

  // Loading state optimizado
  if (loading || roleLoading) {
    return <LoadingSpinner />;
  }

  // Error state con retry
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setRoleLoading(true);
              fetchUserRole();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Redirección optimizada para abogados
  if (userRole === 'abogado') {
    console.log('🚀 Usuario es abogado, redirigiendo a dashboard de abogado');
    return <Navigate to="/abogados/dashboard" replace />;
  }

  console.log('🚀 Usuario es cliente, mostrando dashboard de cliente');
  // Mostrar dashboard de cliente
  return <>{children}</>;
});

DashboardRedirect.displayName = 'DashboardRedirect';

export default DashboardRedirect;
