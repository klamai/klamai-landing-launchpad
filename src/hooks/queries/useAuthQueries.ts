import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useLoginRateLimit, useSignupRateLimit } from '@/utils/rateLimiting';

interface Profile {
  id: string;
  role: 'cliente' | 'abogado';
  tipo_abogado?: 'super_admin' | 'regular';
  nombre: string;
  apellido: string;
  email: string;
  avatar_url?: string;
}

// Hook para obtener la sesión actual
export const useSession = () => {
  return useQuery({
    queryKey: ['session'],
    queryFn: async (): Promise<Session | null> => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error);
        throw error;
      }
      return session;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - mantener sesión fresca
    gcTime: 10 * 60 * 1000, // 10 minutos en caché
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Re-verificar al montar para restaurar sesión
    retry: (failureCount, error: any) => {
      // No reintentar en errores de autenticación
      if (error?.message?.includes('session_not_found') || 
          error?.code === 'session_not_found') {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// Hook para obtener el perfil del usuario
export const useProfile = (userId: string | null) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, tipo_abogado, nombre, apellido, email, avatar_url')
        .eq('id', userId as any)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      // Verificar que data no sea null y tenga la estructura correcta
      if (!data || typeof data !== 'object') {
        return null;
      }
      
      return data as Profile;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 2;
    },
  });
};

// Hook para login con rate limiting
export const useSignIn = () => {
  const queryClient = useQueryClient();
  const { checkLoginRateLimit, recordFailedLogin, recordSuccessfulLogin } = useLoginRateLimit();
  
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      // Verificar rate limiting antes de intentar login
      const rateLimitCheck = await checkLoginRateLimit(email);
      
      if (!rateLimitCheck.allowed) {
        throw new Error(rateLimitCheck.error || 'Rate limit exceeded. Please try again later.');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Registrar intento fallido
        await recordFailedLogin(email);
        
        // Si es un error de credenciales, mostrar mensaje específico
        if (error.message.includes('Invalid login credentials')) {
          throw new Error(`Credenciales inválidas. Intentos restantes: ${rateLimitCheck.remainingAttempts}`);
        }
        
        console.error('Error signing in:', error);
        throw error;
      }
      
      // Registrar login exitoso y limpiar rate limiting
      await recordSuccessfulLogin(email);
      
      return data;
    },
    onSuccess: (data) => {
      // Invalidar y refetch queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['session'] });
      if (data.user) {
        queryClient.invalidateQueries({ queryKey: ['profile', data.user.id] });
      }
    },
    onError: (error: any) => {
      console.error('Sign in failed:', error);
    },
  });
};

// Hook para registro con rate limiting
export const useSignUp = () => {
  const { checkSignupRateLimit, recordSignupAttempt } = useSignupRateLimit();
  
  return useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      name 
    }: { 
      email: string; 
      password: string; 
      name?: string 
    }) => {
      // Verificar rate limiting antes de intentar registro
      const rateLimitCheck = await checkSignupRateLimit(email);
      
      if (!rateLimitCheck.allowed) {
        throw new Error(rateLimitCheck.error || 'Rate limit exceeded. Please try again later.');
      }
      
      // Registrar intento de registro
      await recordSignupAttempt(email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            nombre: name ? name.split(' ')[0] : '',
            apellido: name ? name.split(' ').slice(1).join(' ') : '',
            full_name: name || ''
          }
        }
      });
      
      if (error) {
        console.error('Error signing up:', error);
        throw error;
      }
      
      return data;
    },
    onError: (error: any) => {
      console.error('Sign up failed:', error);
    },
  });
};

// Hook para logout
export const useSignOut = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      try {
        const { error } = await supabase.auth.signOut();
        
        // Si hay error, verificar si es porque la sesión ya no existe
        if (error) {
          // Si es un error de sesión faltante, no es un error real
          if (error.message?.includes('Auth session missing') || 
              error.message?.includes('session_not_found') ||
              error.code === 'session_not_found') {
            console.log('Session already ended, proceeding with cleanup...');
            // No lanzar error, continuar con la limpieza
            return;
          }
          
          // Para otros errores, logear pero no lanzar excepción
          console.error('Error during sign out:', error);
          // No lanzar error, continuar con la limpieza
          return;
        }
      } catch (error: any) {
        // Capturar cualquier error inesperado
        console.error('Unexpected error during sign out:', error);
        
        // Si es un error de sesión faltante, no es un error real
        if (error?.message?.includes('Auth session missing') || 
            error?.message?.includes('session_not_found') ||
            error?.code === 'session_not_found') {
          console.log('Session already ended, proceeding with cleanup...');
          // No lanzar error, continuar con la limpieza
          return;
        }
        
        // Para otros errores, no lanzar excepción
        console.error('Sign out error (non-critical):', error);
        return;
      }
    },
    onSuccess: () => {
      // Limpiar el caché de React Query de forma más agresiva
      queryClient.clear();
      
      // Limpiar cualquier estado persistente
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('Sign out and cache cleared successfully');
    },
    onError: (error: any) => {
      console.error('Sign out failed:', error);
      
      // Asegurar limpieza incluso si hay error
      queryClient.removeQueries({ queryKey: ['session'] });
      queryClient.removeQueries({ queryKey: ['profile'] });
      queryClient.removeQueries({ queryKey: ['sessionValidation'] });
      
      // Limpiar cualquier estado persistente
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      console.log('Cleanup completed despite error');
    },
  });
};

// Hook para validar sesión periódicamente
export const useSessionValidation = () => {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['sessionValidation', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return null;
      
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session validation error:', error);
        throw error;
      }
      
      // Si no hay sesión actual o ha expirado, lanzar error
      if (!currentSession || 
          (currentSession.expires_at && new Date(currentSession.expires_at * 1000) < new Date())) {
        throw new Error('Session expired or invalid');
      }
      
      return currentSession;
    },
    enabled: !!session?.user,
    refetchInterval: 30 * 1000, // Validar cada 30 segundos
    refetchIntervalInBackground: true,
    retry: false, // No reintentar, si falla la validación, cerrar sesión
  });
}; 