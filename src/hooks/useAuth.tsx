
import React, { createContext, useContext, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { 
  useSession, 
  useProfile, 
  useSignIn, 
  useSignUp, 
  useSignOut,
  useSessionValidation 
} from './queries/useAuthQueries';

interface Profile {
  id: string;
  role: 'cliente' | 'abogado';
  tipo_abogado?: 'super_admin' | 'regular';
  nombre: string;
  apellido: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
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
  // Usar React Query hooks
  const { data: session, isLoading: sessionLoading, error: sessionError } = useSession();
  const { data: profile, isLoading: profileLoading } = useProfile(session?.user?.id || null);
  
  // Mutations
  const signInMutation = useSignIn();
  const signUpMutation = useSignUp();
  const signOutMutation = useSignOut();
  
  // Validación periódica de sesión
  useSessionValidation();

  // Configurar listener de cambios de autenticación
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth state change:', event, newSession?.user?.id);
        
        // React Query manejará automáticamente la invalidación de queries
        // cuando la sesión cambie, gracias a los listeners configurados
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Funciones que mantienen la misma interfaz
  const signUp = async (email: string, password: string, name?: string) => {
    try {
      await signUpMutation.mutateAsync({ email, password, name });
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInMutation.mutateAsync({ email, password });
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await signOutMutation.mutateAsync();
    } catch (error: any) {
      console.error('Error during sign out:', error);
      // Asegurar que el estado se limpie incluso si hay error
    }
  };

  // Calcular loading state
  const loading = sessionLoading || profileLoading;

  // Manejar errores de sesión
  useEffect(() => {
    if (sessionError) {
      console.error('Session error:', sessionError);
      // Si hay error de sesión, limpiar estado
      if (sessionError.message?.includes('session_not_found') || 
          sessionError.code === 'session_not_found') {
        // La sesión es inválida, React Query ya maneja esto
      }
    }
  }, [sessionError]);

  const value: AuthContextType = {
    user: session?.user || null,
    session: session || null,
    profile: profile || null,
    loading,
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
