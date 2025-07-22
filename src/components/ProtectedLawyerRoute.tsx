
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LawyerDashboardRouter from './LawyerDashboardRouter';

interface ProtectedLawyerRouteProps {
  children: React.ReactNode;
}

const ProtectedLawyerRoute = ({ children }: ProtectedLawyerRouteProps) => {
  const { user, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/abogados/auth" replace />;
  }

  // Use LawyerDashboardRouter to verify lawyer role and type
  return <LawyerDashboardRouter>{children}</LawyerDashboardRouter>;
};

export default ProtectedLawyerRoute;
