
import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
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
  const [initialized, setInitialized] = useState(false);
  
  // Ref para evitar múltiples inicializaciones
  const initRef = useRef(false);
  
  // Timeout de seguridad para evitar carga infinita
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Evitar múltiples inicializaciones
    if (initRef.current) return;
    initRef.current = true;

    console.log('🔐 Iniciando sistema de autenticación...');
    
    // Timeout de seguridad - máximo 5 segundos de carga
    loadingTimeoutRef.current = setTimeout(() => {
      console.log('⚠️ Timeout de autenticación alcanzado');
      if (loading && !initialized) {
        setLoading(false);
        setInitialized(true);
      }
    }, 5000);

    let mounted = true;

    const initializeAuth = async () => {
      try {
        // 1. Configurar listener PRIMERO para capturar todos los eventos
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, newSession) => {
            console.log('🔄 Auth state change:', event, newSession?.user?.email || 'no user');
            
            if (!mounted) return;
            
            // Actualizar estado solo si hay cambios reales
            setSession(currentSession => {
              if (currentSession?.access_token !== newSession?.access_token) {
                return newSession;
              }
              return currentSession;
            });
            
            setUser(currentUser => {
              const newUser = newSession?.user ?? null;
              if (currentUser?.id !== newUser?.id) {
                return newUser;
              }
              return currentUser;
            });
            
            // Marcar como inicializado después del primer evento
            if (!initialized) {
              setInitialized(true);
              setLoading(false);
              if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
              }
            }
          }
        );

        // 2. Luego verificar sesión existente
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error al obtener sesión:', error);
        } else {
          console.log('✅ Sesión existente:', existingSession?.user?.email || 'no session');
        }
        
        if (!mounted) return;
        
        // Solo actualizar si no se ha inicializado por el listener
        if (!initialized) {
          setSession(existingSession);
          setUser(existingSession?.user ?? null);
          setInitialized(true);
          setLoading(false);
          
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
          }
        }

        return () => {
          subscription.unsubscribe();
        };
        
      } catch (error) {
        console.error('❌ Error inicializando auth:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    const cleanup = initializeAuth();
    
    return () => {
      mounted = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, []); // Solo ejecutar una vez

  const signUp = async (email: string, password: string, name?: string) => {
    console.log('📝 Intentando registro:', email);
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
      console.error('❌ Error en registro:', error);
    } else {
      console.log('✅ Registro exitoso');
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔑 Intentando login:', email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Error en login:', error);
    } else {
      console.log('✅ Login exitoso');
    }
    
    return { error };
  };

  const signOut = async () => {
    console.log('👋 Cerrando sesión...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Error cerrando sesión:', error);
      throw error;
    }
    console.log('✅ Sesión cerrada');
  };

  const value: AuthContextType = {
    user,
    session,
    loading: loading && !initialized, // Solo mostrar loading si no se ha inicializado
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
