import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  getCurrentSubdomainConfig, 
  isRoleAllowedInCurrentSubdomain, 
  getRedirectUrlForRole 
} from '@/utils/subdomain';

interface PathGuardProps {
  children: React.ReactNode;
}

const PathGuard = ({ children }: PathGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  // Validaciones específicas por ruta y rol
  const currentPath = location.pathname;
  
  // Validaciones específicas de seguridad
  if (currentPath.startsWith('/admin') && userRole !== 'super_admin') {
    // Solo super admin puede acceder a rutas /admin
    const correctPath = getRedirectUrlForRole(userRole);
    
    toast({
      title: "Acceso denegado",
      description: "Solo administradores pueden acceder a esta área. Redirigiendo...",
      variant: "destructive",
    });

    setTimeout(() => {
      navigate(correctPath, { replace: true });
    }, 2000);

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Acceso denegado. Redirigiendo...</p>
        </div>
      </div>
    );
  }

  if (currentPath.startsWith('/clientes') && userRole !== 'cliente') {
    // Solo clientes pueden acceder a rutas /clientes
    const correctPath = getRedirectUrlForRole(userRole);
    
    toast({
      title: "Acceso denegado",
      description: "Solo clientes pueden acceder a esta área. Redirigiendo...",
      variant: "destructive",
    });

    setTimeout(() => {
      navigate(correctPath, { replace: true });
    }, 2000);

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Acceso denegado. Redirigiendo...</p>
        </div>
      </div>
    );
  }

  if (currentPath.startsWith('/abogados') && userRole !== 'abogado' && userRole !== 'super_admin') {
    // Solo abogados y super admin pueden acceder a rutas /abogados
    const correctPath = getRedirectUrlForRole(userRole);
    
    toast({
      title: "Acceso denegado",
      description: "Solo abogados pueden acceder a esta área. Redirigiendo...",
      variant: "destructive",
    });

    setTimeout(() => {
      navigate(correctPath, { replace: true });
    }, 2000);

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Acceso denegado. Redirigiendo...</p>
        </div>
      </div>
    );
  }

  // Verificar si el rol del usuario está permitido en esta ruta (fallback)
  if (!isRoleAllowedInCurrentSubdomain(userRole)) {
    // Mostrar mensaje de error y redirigir a la ruta correcta
    const correctPath = getRedirectUrlForRole(userRole);
    
    toast({
      title: "Acceso no autorizado",
      description: `Tu rol no tiene acceso a ${config.name}. Redirigiendo al portal correcto...`,
      variant: "destructive",
    });

    // Redirigir después de un momento
    setTimeout(() => {
      navigate(correctPath, { replace: true });
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

export default PathGuard;
