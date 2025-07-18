
import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useAuthInterceptor = () => {
  const { forceSignOut, session } = useAuth();
  const { toast } = useToast();
  const hasIntercepted = useRef(false);

  useEffect(() => {
    // Evitar múltiples configuraciones del interceptor
    if (hasIntercepted.current) return;

    console.log('🔧 Configurando interceptor de autenticación...');
    
    // Interceptor para todas las consultas de Supabase
    const originalFrom = supabase.from;

    // Wrapper para interceptar errores en consultas de datos
    supabase.from = function(table: string) {
      const query = originalFrom.call(this, table);
      
      // Interceptar el método select y otros
      const originalSelect = query.select;
      query.select = function(...args: any[]) {
        const result = originalSelect.apply(this, args);
        
        // Interceptar la ejecución de la query
        const originalThen = result.then;
        result.then = function(onResolve: any, onReject?: any) {
          return originalThen.call(this, 
            (data: any) => {
              // Verificar si hay errores de autenticación en la respuesta
              if (data?.error) {
                checkAuthError(data.error);
              }
              return onResolve ? onResolve(data) : data;
            },
            (error: any) => {
              checkAuthError(error);
              return onReject ? onReject(error) : Promise.reject(error);
            }
          );
        };
        
        return result;
      };
      
      return query;
    };

    // Función para verificar errores de autenticación
    const checkAuthError = (error: any) => {
      if (!error || !session) return;
      
      const isAuthError = 
        error.message?.includes('JWT') ||
        error.message?.includes('expired') ||
        error.message?.includes('invalid') ||
        error.message?.includes('not authenticated') ||
        error.code === 'PGRST301' || // JWT expired
        error.code === 'PGRST302' || // JWT invalid
        error.status === 401 ||
        error.status === 403;

      if (isAuthError) {
        console.warn('🚨 Error de autenticación interceptado:', error);
        
        toast({
          title: "Sesión expirada",
          description: "Tu sesión ha expirado. Redirigiendo al login...",
          variant: "destructive",
        });

        // Delay para que el usuario vea el mensaje
        setTimeout(() => {
          forceSignOut();
        }, 2000);
      }
    };

    hasIntercepted.current = true;

    // Cleanup function
    return () => {
      supabase.from = originalFrom;
      hasIntercepted.current = false;
    };
  }, [forceSignOut, session, toast]);
};
