
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface LawyerDashboardRouterProps {
  children?: React.ReactNode;
}

const LawyerDashboardRouter = ({ children }: LawyerDashboardRouterProps) => {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [lawyerType, setLawyerType] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const fetchUserRoleAndType = async () => {
      if (!user) {
        setRoleLoading(false);
        return;
      }

      try {
        console.log('🔍 Fetcheando rol y tipo de abogado:', user.id);
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, tipo_abogado')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('❌ Error fetching user profile:', error);
          setUserRole(null);
          setLawyerType(null);
        } else if (profile) {
          console.log('✅ Perfil obtenido:', profile);
          setUserRole(profile.role);
          setLawyerType(profile.tipo_abogado);
        } else {
          console.log('⚠️ No se encontró perfil de usuario');
          setUserRole(null);
          setLawyerType(null);
        }
      } catch (error) {
        console.error('❌ Error general fetching user profile:', error);
        setUserRole(null);
        setLawyerType(null);
      } finally {
        setRoleLoading(false);
      }
    };

    fetchUserRoleAndType();
  }, [user]);

  // Show loading while auth or role is loading
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Security check: only lawyers can access this router
  if (userRole !== 'abogado') {
    console.log('🚫 Acceso denegado: usuario no es abogado');
    return <Navigate to="/auth" replace />;
  }

  // Route to appropriate dashboard based on lawyer type
  if (lawyerType === 'super_admin') {
    console.log('🚀 Redirigiendo a dashboard de super admin');
    const SuperAdminDashboard = React.lazy(() => import('./SuperAdminDashboard'));
    return (
      <React.Suspense fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Cargando dashboard...</p>
          </div>
        </div>
      }>
        <SuperAdminDashboard />
      </React.Suspense>
    );
  } else if (lawyerType === 'regular') {
    console.log('🚀 Redirigiendo a dashboard de abogado regular');
    const RegularLawyerDashboard = React.lazy(() => import('./RegularLawyerDashboard'));
    return (
      <React.Suspense fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Cargando dashboard...</p>
          </div>
        </div>
      }>
        <RegularLawyerDashboard />
      </React.Suspense>
    );
  } else {
    console.log('🚫 Tipo de abogado no válido o no encontrado');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Acceso No Autorizado
            </h2>
            <p className="text-red-600 dark:text-red-300 mb-4">
              Tu cuenta no tiene permisos para acceder a este dashboard.
            </p>
            <button
              onClick={() => window.location.href = '/auth'}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Volver al Login
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default LawyerDashboardRouter;
