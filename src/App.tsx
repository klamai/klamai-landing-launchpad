
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import DashboardRedirect from "@/components/DashboardRedirect";
import LawyerDashboardRouter from "@/components/LawyerDashboardRouter";
import Index from "./pages/Index";
import NewLanding from "./pages/NewLanding"; // 🚀 NUEVA LANDING - Ruta: /new-landing (desactivada temporalmente)
import Chat from "./pages/Chat";
import UnifiedAuth from "./pages/UnifiedAuth";
import AdminAuthCallback from "./pages/AdminAuthCallback";
import SuperAdminRouteGuard from "./components/SuperAdminRouteGuard";
import LawyerActivation from "./pages/LawyerActivation";
import Dashboard from "./pages/Dashboard";
import ClientDashboard from "./components/ClientDashboard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import LegalNotice from "./pages/LegalNotice";
import PagoExitoso from "./pages/PagoExitoso";
import PagoCancelado from "./pages/PagoCancelado";
import AuthCallback from "./pages/AuthCallback";
import ActivarCliente from "./pages/ActivarCliente";
import ClientActivation from "./pages/ClientActivation";
import NotFound from "./pages/NotFound";
import PublicProposal from "./pages/PublicProposal";
import SolicitudAbogadoPage from '@/pages/abogados/Solicitud'; // Importar la nueva página
import RegistroPage from "./pages/auth/Registro"; // Importar la nueva página de registro
import CompleteSetup from "./pages/CompleteSetup"; // Importar la página de configuración

// --- Layouts ---
import PublicLayout from '@/components/layout/PublicLayout';

// --- SEO Landing Pages (Lazy Loaded) ---
import React from "react";
const AreasDePracticaPage = React.lazy(() => import('@/pages/seo/AreasDePracticaPage'));
const MercantilHubPage = React.lazy(() => import('@/pages/seo/MercantilHubPage'));
const MercantilHubPageOriginal = React.lazy(() => import('@/pages/seo/MercantilHubPageOriginal'));
const LandingMercantilPage = React.lazy(() => import('@/pages/seo/LandingMercantilPage'));
const ContactPage = React.lazy(() => import('@/pages/seo/ContactPage'));
// --- Fin SEO Landing Pages ---

// Importar las secciones directamente para las rutas anidadas
import DashboardSection from "@/components/dashboard/DashboardSection";
import NuevaConsultaSection from "@/components/dashboard/NuevaConsultaSection";
import MisCasosSection from "@/components/dashboard/MisCasosSection";
import PerfilSection from "@/components/dashboard/PerfilSection";
import ConfiguracionSection from "@/components/dashboard/ConfiguracionSection";
import FacturacionSection from "@/components/dashboard/FacturacionSection";
import NotificacionesSection from "@/components/dashboard/NotificacionesSection";


// Configuración optimizada para producción
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Datos frescos por 5 minutos (evita recargas innecesarias)
      staleTime: 5 * 60 * 1000,
      // Caché por 10 minutos
      gcTime: 10 * 60 * 1000,
      // No recargar al cambiar de pestaña (evita recargas molestas)
      refetchOnWindowFocus: false,
      // Solo recargar en reconexión
      refetchOnReconnect: true,
      // Reintentos inteligentes
      retry: (failureCount, error: any) => {
        // No reintentar en errores 404
        if (error?.status === 404) return false;
        // Máximo 3 reintentos
        return failureCount < 3;
      },
    },
    mutations: {
      // Reintentos para mutaciones
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* 🚀 NUEVA LANDING - Para activar: cambiar arriba <Index /> por <NewLanding /> */}
            {/* Ruta alternativa: /new-landing (descomentada abajo) */}
            {/* <Route path="/new-landing" element={<NewLanding />} /> */}
            <Route path="/auth" element={<UnifiedAuth />} />
            <Route path="/auth/registro" element={<RegistroPage />} />
            <Route path="/abogados/auth" element={<UnifiedAuth />} />
            <Route path="/admin/auth" element={<UnifiedAuth />} />
            <Route path="/abogados/solicitud" element={<SolicitudAbogadoPage />} />
            
            {/* Redirecciones para rutas base sin autenticación */}
            <Route path="/admin" element={<Navigate to="/admin/auth" replace />} />
            <Route path="/abogados" element={<Navigate to="/abogados/auth" replace />} />
            
            <Route path="/abogados/activate" element={<LawyerActivation />} />
            <Route path="/auth/complete-setup" element={<CompleteSetup />} />
            <Route path="/auth-callback" element={<AuthCallback />} />
            <Route path="/chat" element={<Chat />} />
            
            {/* FASE 1: RUTAS DE CLIENTES UNIFICADAS BAJO UN LAYOUT PROTEGIDO */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardRedirect>
                    <ClientDashboard />
                  </DashboardRedirect>
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardSection />} />
              <Route path="nueva-consulta" element={<NuevaConsultaSection />} />
              <Route path="casos" element={<MisCasosSection />} />
              <Route path="casos/:casoId" element={<MisCasosSection />} />
              <Route path="perfil" element={<PerfilSection />} />
              <Route path="configuracion" element={<ConfiguracionSection />} />
              <Route path="facturacion" element={<FacturacionSection />} />
              <Route path="notificaciones" element={<NotificacionesSection />} />
            </Route>
            
            {/* FASE 2: RUTAS DE ABOGADOS (REGULARES Y ADMINS) UNIFICADAS */}
            <Route 
              path="/abogados/dashboard/*" 
              element={
                <ProtectedRoute>
                  <LawyerDashboardRouter />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/dashboard/*" 
              element={
                <SuperAdminRouteGuard>
                  <LawyerDashboardRouter />
                </SuperAdminRouteGuard>
              } 
            />

            {/* --- Rutas antiguas (serán eliminadas por las nuevas de arriba) --- */}
            {/* 
            <Route path="/dashboard/nueva-consulta" element={...} />
            <Route path="/dashboard/casos" element={...} />
            ... etc ...
            */}
            
            {/* Rutas públicas */}
            <Route path="/politicas-privacidad" element={<PrivacyPolicy />} />
            <Route path="/aviso-legal" element={<LegalNotice />} />
            <Route path="/pago-exitoso" element={<PagoExitoso />} />
            <Route path="/pago-cancelado" element={<PagoCancelado />} />
            <Route path="/activar-cliente" element={<ActivarCliente />} />
        <Route path="/client-activation" element={<ClientActivation />} />
            <Route path="/p/:token" element={<PublicProposal />} />
            
            {/* 🚀 RUTA PARA NUEVA LANDING (comentada para fácil activación) */}
            {/* Para activar la nueva landing: descomentar la línea siguiente */}
            {/* <Route path="/new-landing" element={<NewLanding />} /> */}

            {/* --- SEO Routes --- */}
            <Route path="/areas-de-practica" element={
              <React.Suspense fallback={<>Cargando...</>}>
                <PublicLayout><AreasDePracticaPage /></PublicLayout>
              </React.Suspense>
            } />
            <Route path="/mercantil" element={
              <React.Suspense fallback={<>Cargando...</>}>
                <PublicLayout><MercantilHubPageOriginal /></PublicLayout>
              </React.Suspense>
            } />
            <Route path="/mercantil/:provincia/:ciudad" element={
              <React.Suspense fallback={<>Cargando...</>}>
                <PublicLayout><LandingMercantilPage /></PublicLayout>
              </React.Suspense>
            } />
            <Route path="/contacto" element={
              <React.Suspense fallback={<>Cargando...</>}>
                <PublicLayout><ContactPage /></PublicLayout>
              </React.Suspense>
            } />
            {/* --- End SEO Routes --- */}

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
