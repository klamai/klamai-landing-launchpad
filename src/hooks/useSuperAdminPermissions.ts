import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './useAuth';

interface SuperAdminPermissions {
  isSuperAdmin: boolean;
  permissions: {
    canManageLawyers: boolean;
    canManageClients: boolean;
    canManageCases: boolean;
    canViewAnalytics: boolean;
    canManageSystem: boolean;
  };
  lastVerified: string;
}

/**
 * Hook para verificar permisos de superadmin con caché inteligente
 * - Verifica permisos una sola vez por sesión
 * - Cachea el resultado por 30 minutos
 * - Solo se invalida si cambia la sesión del usuario
 * - Reemplaza completamente el AdminSecurityMiddleware
 */
export const useSuperAdminPermissions = () => {
  const { user, session, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['superAdminPermissions', user?.id, session?.access_token],
    queryFn: async (): Promise<SuperAdminPermissions> => {
      if (!user || !session) {
        throw new Error('Usuario no autenticado');
      }

      try {
        // Verificar si el usuario es superadmin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, tipo_abogado')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error al obtener perfil:', profileError);
          throw new Error('Error al verificar permisos de usuario');
        }

        // Verificar si es superadmin usando el campo correcto
        const isSuperAdmin = profile.tipo_abogado === 'super_admin';

        if (!isSuperAdmin) {
          throw new Error('Usuario no tiene permisos de superadmin');
        }

        // Los superadmins tienen todos los permisos por defecto
        const userPermissions = {
          canManageLawyers: true,
          canManageClients: true,
          canManageCases: true,
          canViewAnalytics: true,
          canManageSystem: true,
        };

        return {
          isSuperAdmin: true,
          permissions: userPermissions,
          lastVerified: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Error en verificación de permisos:', error);
        throw error;
      }
    },
    enabled: !!user && !!session && !authLoading,
    staleTime: 30 * 60 * 1000, // 30 minutos - no se considera obsoleto
    gcTime: 60 * 60 * 1000, // 1 hora - tiempo en caché
    refetchOnWindowFocus: false, // No re-verificar al enfocar ventana
    refetchOnMount: false, // No re-verificar al montar componente
    retry: 1, // Solo reintentar una vez en caso de error
    retryDelay: 1000, // Esperar 1 segundo antes de reintentar
  });
};

/**
 * Hook simplificado para verificar solo si es superadmin
 * Útil para componentes que solo necesitan saber si es superadmin
 */
export const useIsSuperAdmin = () => {
  const { data, isLoading, error } = useSuperAdminPermissions();
  
  return {
    isSuperAdmin: data?.isSuperAdmin || false,
    isLoading,
    error,
  };
};

/**
 * Hook para verificar permisos específicos
 * Útil para componentes que necesitan verificar permisos específicos
 */
export const useSuperAdminPermission = (permission: keyof SuperAdminPermissions['permissions']) => {
  const { data, isLoading, error } = useSuperAdminPermissions();
  
  return {
    hasPermission: data?.permissions?.[permission] || false,
    isLoading,
    error,
  };
};
