
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface DashboardRedirectProps {
  children: React.ReactNode;
}

const DashboardRedirect = ({ children }: DashboardRedirectProps) => {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRoleLoading(false);
        return;
      }

      try {
        console.log('🔍 Fetcheando rol de usuario:', user.id);
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('❌ Error fetching user role:', error);
          setUserRole('cliente'); // Default to cliente if error
        } else if (profile) {
          console.log('✅ Rol de usuario obtenido:', profile.role);
          setUserRole(profile.role);
        } else {
          console.log('⚠️ No se encontró perfil de usuario, usando rol por defecto');
          setUserRole('cliente'); // Default to cliente if no profile found
        }
      } catch (error) {
        console.error('❌ Error general fetching user role:', error);
        setUserRole('cliente'); // Default to cliente if error
      } finally {
        setRoleLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  // Show loading while auth or role is loading
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // If user is a lawyer, redirect to lawyer dashboard router
  if (userRole === 'abogado') {
    console.log('🚀 Redirigiendo a dashboard de abogado');
    return <Navigate to="/abogados/dashboard" replace />;
  }

  console.log('🚀 Mostrando dashboard de cliente');
  // If user is a client, show client dashboard
  return <>{children}</>;
};

export default DashboardRedirect;
