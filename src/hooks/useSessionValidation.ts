import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useSessionValidation = () => {
  const { user, session } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !session) {
      // Limpiar intervalo si no hay sesión
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Función para validar la sesión
    const validateSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error validating session:', error);
          // Si hay error, la sesión probablemente es inválida
          await supabase.auth.signOut();
          return;
        }

        // Si no hay sesión actual, cerrar sesión
        if (!currentSession) {
          console.log('Session not found, signing out...');
          await supabase.auth.signOut();
          return;
        }

        // Verificar si la sesión ha expirado
        if (currentSession.expires_at && new Date(currentSession.expires_at * 1000) < new Date()) {
          console.log('Session expired, signing out...');
          await supabase.auth.signOut();
          return;
        }

      } catch (error) {
        console.error('Unexpected error during session validation:', error);
        // En caso de error inesperado, cerrar sesión por seguridad
        await supabase.auth.signOut();
      }
    };

    // Validar sesión cada 30 segundos
    intervalRef.current = setInterval(validateSession, 30000);

    // Validar inmediatamente al montar
    validateSession();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, session]);

  return null; // Este hook no retorna nada, solo maneja la validación
}; 