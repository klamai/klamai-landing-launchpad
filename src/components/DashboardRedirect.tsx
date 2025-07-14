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
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole('cliente'); // Default to cliente if error
        } else {
          setUserRole(profile?.role || 'cliente');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
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

  // If user is a lawyer, redirect to lawyer dashboard
  if (userRole === 'abogado') {
    return <Navigate to="/abogados/dashboard" replace />;
  }

  // If user is a client, show client dashboard
  return <>{children}</>;
};

export default DashboardRedirect;