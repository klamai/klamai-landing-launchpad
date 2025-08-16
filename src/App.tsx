
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardRedirect from "@/components/DashboardRedirect";
import LawyerDashboardRouter from "@/components/LawyerDashboardRouter";
import PathGuard from "@/components/PathGuard";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import AuthAbogado from "./pages/AuthAbogado";
import LawyerActivation from "./pages/LawyerActivation";
import Dashboard from "./pages/Dashboard";
import ClientDashboard from "./components/ClientDashboard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import LegalNotice from "./pages/LegalNotice";
import PagoExitoso from "./pages/PagoExitoso";
import PagoCancelado from "./pages/PagoCancelado";
import AuthCallback from "./pages/AuthCallback";
import ActivarCliente from "./pages/ActivarCliente";
import NotFound from "./pages/NotFound";
import PublicProposal from "./pages/PublicProposal";

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
            <Route path="/auth" element={<Auth />} />
            
            {/* Rutas de autenticación específicas por perfil */}
            <Route path="/admin/auth" element={<Auth />} />
            <Route path="/abogados/auth" element={<Auth />} />
            <Route path="/clientes/auth" element={<Auth />} />
            
            {/* Otras rutas de autenticación */}
            <Route path="/abogados/activate" element={<LawyerActivation />} />
            <Route path="/auth-callback" element={<AuthCallback />} />
            <Route path="/chat" element={<Chat />} />
            
            {/* Rutas protegidas del dashboard de clientes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <PathGuard>
                  <DashboardRedirect>
                    <ClientDashboard />
                  </DashboardRedirect>
                </PathGuard>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/nueva-consulta" element={
              <ProtectedRoute>
                <PathGuard>
                  <DashboardRedirect>
                    <ClientDashboard />
                  </DashboardRedirect>
                </PathGuard>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/casos" element={
              <ProtectedRoute>
                <PathGuard>
                  <DashboardRedirect>
                    <ClientDashboard />
                  </DashboardRedirect>
                </PathGuard>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/casos/:casoId" element={
              <ProtectedRoute>
                <PathGuard>
                  <DashboardRedirect>
                    <ClientDashboard />
                  </DashboardRedirect>
                </PathGuard>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/perfil" element={
              <ProtectedRoute>
                <PathGuard>
                  <DashboardRedirect>
                    <ClientDashboard />
                  </DashboardRedirect>
                </PathGuard>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/configuracion" element={
              <ProtectedRoute>
                <PathGuard>
                  <DashboardRedirect>
                    <ClientDashboard />
                  </DashboardRedirect>
                </PathGuard>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/facturacion" element={
              <ProtectedRoute>
                <PathGuard>
                  <DashboardRedirect>
                    <ClientDashboard />
                  </DashboardRedirect>
                </PathGuard>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/notificaciones" element={
              <ProtectedRoute>
                <PathGuard>
                  <DashboardRedirect>
                    <ClientDashboard />
                  </DashboardRedirect>
                </PathGuard>
              </ProtectedRoute>
            } />
            
            {/* Rutas protegidas del dashboard de abogados - Enrutador inteligente */}
            <Route path="/abogados/dashboard" element={
              <ProtectedRoute>
                <PathGuard>
                  <LawyerDashboardRouter />
                </PathGuard>
              </ProtectedRoute>
            } />
            <Route path="/abogados/dashboard/*" element={
              <ProtectedRoute>
                <PathGuard>
                  <LawyerDashboardRouter />
                </PathGuard>
              </ProtectedRoute>
            } />
            
            {/* Rutas públicas */}
            <Route path="/politicas-privacidad" element={<PrivacyPolicy />} />
            <Route path="/aviso-legal" element={<LegalNotice />} />
            <Route path="/pago-exitoso" element={<PagoExitoso />} />
            <Route path="/pago-cancelado" element={<PagoCancelado />} />
            <Route path="/activar-cliente" element={<ActivarCliente />} />
            <Route path="/p/:token" element={<PublicProposal />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
