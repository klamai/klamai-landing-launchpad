
import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  role: string;
  tipo_abogado?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  
  // Referencias para optimización
  const sessionRef = useRef<Session | null>(null);
  const profileCacheRef = useRef<{ [userId: string]: UserProfile }>({});
  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastValidationRef = useRef<number>(0);

  // Función optimizada para obtener perfil de usuario con cache
  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    // Usar cache si está disponible y es reciente (menos de 5 minutos)
    const cached = profileCacheRef.current[userId];
    if (cached && Date.now() - lastValidationRef.current < 5 * 60 * 1000) {
      return cached;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, tipo_abogado')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        return null;
      }

      const userProfile: UserProfile = {
        role: profile.role,
        tipo_abogado: profile.tipo_abogado
      };

      // Actualizar cache
      profileCacheRef.current[userId] = userProfile;
      lastValidationRef.current = Date.now();

      return userProfile;
    } catch (error) {
      console.error('❌ Error general fetching user profile:', error);
      return null;
    }
  }, []);

  // Función para limpiar estado (estable)
  const clearAuthState = useCallback(() => {
    console.log('🧹 Limpiando estado de autenticación');
    setUser(null);
    setSession(null);
    setUserProfile(null);
    sessionRef.current = null;
    setLoading(false);
    setIsValidating(false);
    // Limpiar cache
    profileCacheRef.current = {};
    lastValidationRef.current = 0;
  }, []);

  // Función optimizada de validación de sesión
  const validateSession = useCallback(async (): Promise<boolean> => {
    const currentSession = sessionRef.current;
    if (!currentSession) return false;
    
    // Evitar validaciones demasiado frecuentes (menos de 1 minuto)
    if (Date.now() - lastValidationRef.current < 60 * 1000) {
      return true;
    }
    
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
        
        // Actualizar perfil si es necesario
        const profile = await fetchUserProfile(serverSession.user.id);
        setUserProfile(profile);
      }
      
      lastValidationRef.current = Date.now();
      return true;
    } catch (error) {
      console.error('❌ Error validando sesión:', error);
      clearAuthState();
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [clearAuthState, fetchUserProfile]);

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
            
            // Obtener perfil de usuario de forma asíncrona
            if (newSession?.user) {
              setTimeout(async () => {
                const profile = await fetchUserProfile(newSession.user.id);
                setUserProfile(profile);
              }, 0);
            }
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

  // Efecto 2: Inicialización optimizada
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
          
          // Obtener perfil de usuario
          const profile = await fetchUserProfile(initialSession.user.id);
          setUserProfile(profile);
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

  // Efecto 3: Validación periódica menos frecuente (15 minutos)
  useEffect(() => {
    const startPeriodicValidation = () => {
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
      }

      if (sessionRef.current && !loading) {
        console.log('🔍 Iniciando validación periódica de sesión (15 min)...');
        validationIntervalRef.current = setInterval(async () => {
          if (sessionRef.current && !isValidating) {
            console.log('🔍 Validación periódica de sesión...');
            await validateSession();
          }
        }, 15 * 60 * 1000); // 15 minutos en lugar de 5
      }
    };

    startPeriodicValidation();

    return () => {
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
      }
    };
  }, [session, loading, isValidating, validateSession]);

  // Funciones de autenticación optimizadas
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
      
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      return { error };
    } catch (error: any) {
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
    
    clearAuthState();
    
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('⚠️ Error en logout forzado del servidor:', error);
    }
    
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
    userProfile,
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
