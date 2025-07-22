
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedLawyerRoute from "./components/ProtectedLawyerRoute";
import DashboardRedirect from "./components/DashboardRedirect";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import AuthAbogado from "./pages/AuthAbogado";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import RegularLawyerDashboard from "./components/RegularLawyerDashboard";
import NotFound from "./pages/NotFound";
import PagoExitoso from "./pages/PagoExitoso";
import PagoCancelado from "./pages/PagoCancelado";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import LegalNotice from "./pages/LegalNotice";
import LawyerActivation from "./pages/LawyerActivation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat/:sessionId" element={<Chat />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/abogados/auth" element={<AuthAbogado />} />
              <Route path="/abogados/activate" element={<LawyerActivation />} />
              <Route path="/pago/exitoso" element={<PagoExitoso />} />
              <Route path="/pago/cancelado" element={<PagoCancelado />} />
              <Route path="/politica-privacidad" element={<PrivacyPolicy />} />
              <Route path="/aviso-legal" element={<LegalNotice />} />
              
              {/* Protected client dashboard with role-based redirect */}
              <Route 
                path="/dashboard/*" 
                element={
                  <ProtectedRoute>
                    <DashboardRedirect>
                      <Dashboard />
                    </DashboardRedirect>
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected lawyer routes */}
              <Route 
                path="/abogados/dashboard" 
                element={
                  <ProtectedLawyerRoute>
                    <SuperAdminDashboard />
                  </ProtectedLawyerRoute>
                } 
              />
              <Route 
                path="/abogados/dashboard/casos" 
                element={
                  <ProtectedLawyerRoute>
                    <SuperAdminDashboard />
                  </ProtectedLawyerRoute>
                } 
              />
              <Route 
                path="/abogados/dashboard/abogados" 
                element={
                  <ProtectedLawyerRoute>
                    <SuperAdminDashboard />
                  </ProtectedLawyerRoute>
                } 
              />
              <Route 
                path="/abogados/dashboard/reportes" 
                element={
                  <ProtectedLawyerRoute>
                    <SuperAdminDashboard />
                  </ProtectedLawyerRoute>
                } 
              />
              <Route 
                path="/abogados/dashboard/configuracion" 
                element={
                  <ProtectedLawyerRoute>
                    <SuperAdminDashboard />
                  </ProtectedLawyerRoute>
                } 
              />
              <Route 
                path="/abogados/dashboard/notificaciones" 
                element={
                  <ProtectedLawyerRoute>
                    <SuperAdminDashboard />
                  </ProtectedLawyerRoute>
                } 
              />
              <Route 
                path="/abogados/dashboard/asistente-ia" 
                element={
                  <ProtectedLawyerRoute>
                    <SuperAdminDashboard />
                  </ProtectedLawyerRoute>
                } 
              />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
