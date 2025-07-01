
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
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

  const updateAuthState = useCallback((newSession: Session | null) => {
    console.log('🔄 Auth state updating:', !!newSession);
    setSession(newSession);
    setUser(newSession?.user ?? null);
    if (!initialized) {
      setInitialized(true);
    }
    setLoading(false);
  }, [initialized]);

  useEffect(() => {
    let mounted = true;
    console.log('🚀 Auth provider initializing...');

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        console.log('🔔 Auth event:', event, !!session);
        updateAuthState(session);
      }
    );

    // THEN check for existing session with timeout
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ Error getting session:', error);
        }
        if (mounted) {
          console.log('📋 Initial session:', !!session);
          updateAuthState(session);
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          updateAuthState(null);
        }
      }
    };

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (!initialized && mounted) {
        console.log('⏰ Auth initialization timeout, setting as initialized');
        setInitialized(true);
        setLoading(false);
      }
    }, 3000);

    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [updateAuthState, initialized]);

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
    } catch (error) {
      console.error('❌ SignUp error:', error);
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
    } catch (error) {
      console.error('❌ SignIn error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ SignOut error:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ SignOut error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    initialized,
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
