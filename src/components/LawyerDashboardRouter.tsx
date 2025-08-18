
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, Routes, Route } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// Lazy imports fuera del componente
const SuperAdminDashboard = React.lazy(() => import('./SuperAdminDashboard'));
const RegularLawyerDashboard = React.lazy(() => import('./RegularLawyerDashboard'));

// Import dashboard sections
import { SuperAdminDashboardSection, CasesManagementSection, LawyersManagementSection, ClientsManagementSection, LawyerApplicationsSection, HojasEncargoSection, ReportesSection, ConfiguracionSection as AdminConfigSection, NotificacionesSection as AdminNotifSection, AsistenteIASection as AdminIASection } from './SuperAdminDashboard';
import { RegularLawyerDashboardSection, MisCasosAsignadosSection, PagosSection, AsistentesIASection as LawyerIASection, PerfilSection, ConfiguracionSection as LawyerConfigSection } from './RegularLawyerDashboard';


interface LawyerDashboardRouterProps {
  children?: React.ReactNode;
}

const LawyerDashboardRouter = ({ children }: LawyerDashboardRouterProps) => {
  const { user, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!profile || profile.role !== 'abogado') {
    let authRoute = "/auth";
    
    if (location.pathname.startsWith("/admin/")) {
      authRoute = "/admin/auth";
    } else if (location.pathname.startsWith("/abogados/")) {
      authRoute = "/abogados/auth";
    }
    
    return <Navigate to={authRoute} replace />;
  }

  if (profile.tipo_abogado === 'super_admin') {
    if (location.pathname.startsWith('/abogados/dashboard')) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    
    return (
      <React.Suspense fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Cargando dashboard...</p>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<SuperAdminDashboard />}>
            <Route index element={<SuperAdminDashboardSection />} />
            <Route path="casos" element={<CasesManagementSection />} />
            <Route path="abogados" element={<LawyersManagementSection />} />
            <Route path="clientes" element={<ClientsManagementSection />} />
            <Route path="solicitudes-abogado" element={<LawyerApplicationsSection />} />
            <Route path="hojas-encargo" element={<HojasEncargoSection />} />
            <Route path="reportes" element={<ReportesSection />} />
            <Route path="configuracion" element={<AdminConfigSection />} />
            <Route path="notificaciones" element={<AdminNotifSection />} />
            <Route path="asistente-ia" element={<AdminIASection />} />
          </Route>
        </Routes>
      </React.Suspense>
    );
  } else if (profile.tipo_abogado === 'regular') {
    return (
      <React.Suspense fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Cargando dashboard...</p>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<RegularLawyerDashboard />}>
            <Route index element={<RegularLawyerDashboardSection />} />
            <Route path="mis-casos" element={<MisCasosAsignadosSection />} />
            <Route path="pagos" element={<PagosSection />} />
            <Route path="asistentes-ia" element={<LawyerIASection />} />
            <Route path="perfil" element={<PerfilSection />} />
            <Route path="configuracion" element={<LawyerConfigSection />} />
          </Route>
        </Routes>
      </React.Suspense>
    );
  } else {
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
              onClick={() => {
                let authRoute = "/auth";
                
                if (location.pathname.startsWith("/admin/")) {
                  authRoute = "/admin/auth";
                } else if (location.pathname.startsWith("/abogados/")) {
                  authRoute = "/abogados/auth";
                }
                
                window.location.href = authRoute;
              }}
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
