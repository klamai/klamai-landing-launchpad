import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  getCurrentSubdomainConfig, 
  isRoleAllowedInCurrentSubdomain, 
  getRedirectUrlForRole 
} from '@/utils/subdomain';

interface SubdomainGuardProps {
  children: React.ReactNode;
}

const SubdomainGuard = ({ children }: SubdomainGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const config = getCurrentSubdomainConfig();

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle() as { data: { role: string } | null; error: any };

        if (error) {
          console.error('Error fetching user profile:', error);
          setUserRole(null);
        } else if (profile) {
          setUserRole(profile.role);
        } else {
          setUserRole(null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkUserRole();
    }
  }, [user, authLoading]);

  // Mostrar loading mientras se cargan datos
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, permitir acceso (ProtectedRoute maneja la redirección)
  if (!user || !userRole) {
    return <>{children}</>;
  }

  // Verificar si el rol del usuario está permitido en este subdominio
  if (!isRoleAllowedInCurrentSubdomain(userRole)) {
    // Mostrar mensaje de error y redirigir al subdominio correcto
    const correctUrl = getRedirectUrlForRole(userRole);
    
    toast({
      title: "Acceso no autorizado",
      description: `Tu rol no tiene acceso a ${config.name}. Redirigiendo al portal correcto...`,
      variant: "destructive",
    });

    // Redirigir después de un momento
    setTimeout(() => {
      window.location.href = correctUrl;
    }, 2000);

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Redirigiendo al portal correcto...</p>
        </div>
      </div>
    );
  }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>;
};

export default SubdomainGuard;
