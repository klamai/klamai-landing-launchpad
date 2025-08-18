
import React, { createContext, useContext, useEffect, useState } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';
import { SecureLogger } from '@/utils/secureLogging';

interface Profile {
  id: string;
  role: 'cliente' | 'abogado';
  tipo_abogado?: 'super_admin' | 'regular';
  nombre: string;
  apellido: string;
  email: string;
  avatar_url?: string;
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
  const queryClient = useQueryClient();
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
        // Log seguro: solo el evento, no el ID del usuario
        SecureLogger.info(`Auth state change: ${event}`, 'auth_provider');
        
        // Invalidar la query de la sesión para forzar una actualización inmediata
        queryClient.invalidateQueries({ queryKey: ['session'] });
      }
    );

    return () => subscription.unsubscribe();
  }, [queryClient]);

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
      // Log seguro del error de sign out
      SecureLogger.error(error, 'sign_out');
      // Asegurar que el estado se limpie incluso si hay error
    }
  };

  // Calcular loading state de forma más precisa
  // Solo mostrar loading si realmente no hay sesión y está cargando
  const loading = sessionLoading || (!!session && profileLoading);

  // Log seguro del estado actual (sin información sensible)
  SecureLogger.debug(`Estado: session=${!!session}, profile=${!!profile}, loading=${loading}`, 'auth_provider');

  // Manejar errores de sesión
  useEffect(() => {
    if (sessionError) {
      // Log seguro del error de sesión
      SecureLogger.error(sessionError, 'session_error');
      // Si hay error de sesión, limpiar estado
      if (sessionError.message?.includes('session_not_found') || 
          sessionError.code === 'session_not_found') {
        // La sesión es inválida, React Query ya maneja esto
      }
    }
  }, [sessionError]);

  // Asegurar que la sesión esté completamente cargada antes de renderizar
  const isSessionReady = !sessionLoading && (!!session || !loading);

  const value: AuthContextType = {
    user: session?.user || null,
    session: session || null,
    profile: profile || null,
    loading: loading || !isSessionReady,
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
