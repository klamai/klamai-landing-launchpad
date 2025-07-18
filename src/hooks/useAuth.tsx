
import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isValidating: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  forceSignOut: () => Promise<void>;
  validateSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  
  // Referencias para evitar dependencias circulares
  const sessionRef = useRef<Session | null>(null);
  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para limpiar completamente el estado local (estable)
  const clearAuthState = useCallback(() => {
    console.log('🧹 Limpiando estado de autenticación');
    setUser(null);
    setSession(null);
    sessionRef.current = null;
    setLoading(false);
    setIsValidating(false);
  }, []);

  // Función para validar la sesión actual (estable)
  const validateSession = useCallback(async (): Promise<boolean> => {
    const currentSession = sessionRef.current;
    if (!currentSession) return false;
    
    setIsValidating(true);
    try {
      const { data: { session: serverSession }, error } = await supabase.auth.getSession();
      
      if (error || !serverSession) {
        console.warn('🔐 Sesión inválida detectada, limpiando estado:', error?.message);
        clearAuthState();
        return false;
      }
      
      // Verificar si la sesión ha cambiado
      if (serverSession.access_token !== currentSession.access_token) {
        console.log('🔄 Sesión actualizada, sincronizando estado');
        setSession(serverSession);
        setUser(serverSession.user);
        sessionRef.current = serverSession;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error validando sesión:', error);
      clearAuthState();
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [clearAuthState]);

  // Interceptor para manejar errores 401/403 automáticamente
  const handleAuthError = useCallback((error: any) => {
    if (error?.message?.includes('JWT') || 
        error?.message?.includes('expired') ||
        error?.message?.includes('invalid') ||
        error?.status === 401 ||
        error?.status === 403) {
      console.warn('🚨 Error de autenticación detectado, forzando logout:', error.message);
      clearAuthState();
      window.location.href = '/auth';
    }
  }, [clearAuthState]);

  // Efecto 1: Configurar listener de cambios de estado (solo una vez)
  useEffect(() => {
    console.log('🔐 Configurando listener de autenticación...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔄 Evento de autenticación:', event, newSession ? 'Con sesión' : 'Sin sesión');
        
        switch (event) {
          case 'SIGNED_IN':
            setSession(newSession);
            setUser(newSession?.user ?? null);
            sessionRef.current = newSession;
            setLoading(false);
            break;
            
          case 'SIGNED_OUT':
            clearAuthState();
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed exitosamente');
            setSession(newSession);
            setUser(newSession?.user ?? null);
            sessionRef.current = newSession;
            break;
            
          case 'USER_UPDATED':
            if (newSession) {
              setSession(newSession);
              setUser(newSession.user);
              sessionRef.current = newSession;
            }
            break;
            
          default:
            setSession(newSession);
            setUser(newSession?.user ?? null);
            sessionRef.current = newSession;
            setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Sin dependencias para evitar bucles

  // Efecto 2: Inicialización una sola vez
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🚀 Inicializando autenticación...');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error obteniendo sesión inicial:', error);
          clearAuthState();
          return;
        }

        if (initialSession) {
          console.log('✅ Sesión inicial encontrada');
          setSession(initialSession);
          setUser(initialSession.user);
          sessionRef.current = initialSession;
        } else {
          console.log('ℹ️ No hay sesión inicial');
        }
      } catch (error) {
        console.error('❌ Error en inicialización de auth:', error);
        clearAuthState();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []); // Sin dependencias para evitar bucles

  // Efecto 3: Validación periódica (independiente)
  useEffect(() => {
    const startPeriodicValidation = () => {
      // Limpiar cualquier intervalo existente
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
      }

      // Solo iniciar validación si hay una sesión
      if (sessionRef.current && !loading) {
        console.log('🔍 Iniciando validación periódica de sesión...');
        validationIntervalRef.current = setInterval(async () => {
          if (sessionRef.current && !isValidating) {
            console.log('🔍 Validación periódica de sesión...');
            await validateSession();
          }
        }, 5 * 60 * 1000); // 5 minutos
      }
    };

    startPeriodicValidation();

    return () => {
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
      }
    };
  }, [session, loading, isValidating, validateSession]); // Dependencias mínimas necesarias

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            nombre: name ? name.split(' ')[0] : '',
            apellido: name ? name.split(' ').slice(1).join(' ') : '',
            full_name: name || ''
          }
        }
      });
      
      if (error) {
        handleAuthError(error);
      }
      
      return { error };
    } catch (error: any) {
      handleAuthError(error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        handleAuthError(error);
      }
      
      return { error };
    } catch (error: any) {
      handleAuthError(error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Iniciando logout...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('⚠️ Error en logout del servidor:', error.message);
      }
    } catch (error: any) {
      console.warn('⚠️ Error en proceso de logout:', error);
    } finally {
      clearAuthState();
      console.log('✅ Estado local limpiado');
    }
  };

  const forceSignOut = async () => {
    console.log('🔒 Forzando logout completo...');
    
    // Limpiar estado local inmediatamente
    clearAuthState();
    
    // Intentar logout en el servidor sin esperar
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('⚠️ Error en logout forzado del servidor:', error);
    }
    
    // Limpiar localStorage y sessionStorage
    try {
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
    } catch (error) {
      console.warn('⚠️ Error limpiando storage:', error);
    }
    
    console.log('✅ Logout forzado completado');
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    isValidating,
    signUp,
    signIn,
    signOut,
    forceSignOut,
    validateSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
