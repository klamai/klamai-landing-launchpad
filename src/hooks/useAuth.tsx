
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
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

  // Función para limpiar completamente el estado local
  const clearAuthState = useCallback(() => {
    setUser(null);
    setSession(null);
    setLoading(false);
    setIsValidating(false);
  }, []);

  // Función para validar la sesión actual
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!session) return false;
    
    setIsValidating(true);
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error || !currentSession) {
        console.warn('🔐 Sesión inválida detectada, limpiando estado:', error?.message);
        clearAuthState();
        return false;
      }
      
      // Verificar si la sesión ha cambiado
      if (currentSession.access_token !== session.access_token) {
        console.log('🔄 Sesión actualizada, sincronizando estado');
        setSession(currentSession);
        setUser(currentSession.user);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error validando sesión:', error);
      clearAuthState();
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [session, clearAuthState]);

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

  useEffect(() => {
    console.log('🔐 Iniciando sistema de autenticación...');

    // Configurar listener de cambios de estado PRIMERO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔄 Evento de autenticación:', event, newSession ? 'Con sesión' : 'Sin sesión');
        
        // Manejar diferentes eventos
        switch (event) {
          case 'SIGNED_IN':
            setSession(newSession);
            setUser(newSession?.user ?? null);
            setLoading(false);
            break;
            
          case 'SIGNED_OUT':
            clearAuthState();
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed exitosamente');
            setSession(newSession);
            setUser(newSession?.user ?? null);
            break;
            
          case 'USER_UPDATED':
            if (newSession) {
              setSession(newSession);
              setUser(newSession.user);
            }
            break;
            
          default:
            setSession(newSession);
            setUser(newSession?.user ?? null);
            setLoading(false);
        }
      }
    );

    // LUEGO verificar sesión existente
    const initializeAuth = async () => {
      try {
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

    // Configurar validación periódica de sesión (cada 5 minutos)
    const sessionValidationInterval = setInterval(async () => {
      if (session && !loading) {
        console.log('🔍 Validación periódica de sesión...');
        await validateSession();
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => {
      subscription.unsubscribe();
      clearInterval(sessionValidationInterval);
    };
  }, [clearAuthState, validateSession, session, loading]);

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
        // Aunque haya error en el servidor, limpiamos el estado local
      }
    } catch (error: any) {
      console.warn('⚠️ Error en proceso de logout:', error);
    } finally {
      // Siempre limpiar el estado local
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
      // Ignoramos errores del servidor en logout forzado
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
