
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import LegalNotice from "./pages/LegalNotice";
import PagoExitoso from "./pages/PagoExitoso";
import PagoCancelado from "./pages/PagoCancelado";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
            <Route path="/auth-callback" element={<AuthCallback />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/nueva-consulta" element={<Dashboard />} />
            <Route path="/dashboard/casos" element={<Dashboard />} />
            <Route path="/dashboard/casos/:casoId" element={<Dashboard />} />
            <Route path="/dashboard/perfil" element={<Dashboard />} />
            <Route path="/dashboard/configuracion" element={<Dashboard />} />
            <Route path="/dashboard/facturacion" element={<Dashboard />} />
            <Route path="/dashboard/notificaciones" element={<Dashboard />} />
            <Route path="/politicas-privacidad" element={<PrivacyPolicy />} />
            <Route path="/aviso-legal" element={<LegalNotice />} />
            <Route path="/pago-exitoso" element={<PagoExitoso />} />
            <Route path="/pago-cancelado" element={<PagoCancelado />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
