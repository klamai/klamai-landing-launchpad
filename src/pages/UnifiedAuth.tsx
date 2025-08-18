import { useState, useEffect } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { logError, logAuth } from "@/utils/secureLogging";
import AuthLayout from "@/components/auth/AuthLayout";

// Configuración por tipo de usuario
const AUTH_CONFIG = {
  cliente: {
    path: "/auth",
    title: "Accede a tu cuenta",
    description: "Gestiona tus casos y documentos de forma segura.",
    providers: ["google", "email"],
    allowRegister: true,
    showLawyerApplication: false,
    secureLoginMessage: null,
    label: "Clientes",
  },
  abogado: {
    path: "/abogados/auth",
    title: "Portal de Abogados",
    description: "Accede a la plataforma para gestionar tus casos asignados.",
    providers: ["email"],
    allowRegister: false, // El registro es mediante solicitud
    showLawyerApplication: true,
    secureLoginMessage: null,
    label: "Abogados",
  },
  admin: {
    path: "/admin/auth",
    title: "Administración",
    description: "Acceso exclusivo para administradores del sistema.",
    providers: ["google", "email"],
    allowRegister: false, // Los admins se crean manualmente
    showLawyerApplication: false,
    secureLoginMessage: "Estás accediendo al panel de control. Todos los inicios de sesión son monitoreados.",
    label: "Admin",
  },
};

type Role = keyof typeof AUTH_CONFIG;



const UnifiedAuth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [role, setRole] = useState<Role>("cliente");
  const [config, setConfig] = useState(AUTH_CONFIG.cliente);

  // Determinar el rol basado en la URL
  useEffect(() => {
    const currentPath = location.pathname;
    const determinedRole = (Object.keys(AUTH_CONFIG) as Role[]).find(
      (r) => AUTH_CONFIG[r].path === currentPath
    ) || "cliente";
    
    setRole(determinedRole);
    setConfig(AUTH_CONFIG[determinedRole]);
  }, [location.pathname]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isHovered, setIsHovered] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth-callback?role=${role}`,
        },
      });
      if (error) throw error;
      logAuth('login', true, `Intento de login con Google para rol: ${role}`);
    } catch (error: any) {
      logError("Error en Google Login", error.message || "Error desconocido");
      toast({
        title: "Error",
        description: error.message || "No se pudo iniciar sesión con Google.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      if (!data.user?.id) {
        throw new Error("No se pudo obtener el ID del usuario.");
      }
      
      const userId = data.user.id;
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, tipo_abogado")
        // @ts-ignore
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;

      if (!profile) {
        throw new Error("No se pudo obtener el perfil del usuario.");
      }

      // Cast profile to the correct type
      const userProfile = profile as { role: string; tipo_abogado: string };

      logAuth('login', true, `Login exitoso para ${email}, rol: ${role}`);

      // Validar que el rol del perfil coincide con la página de login
      const expectedRole = role === "admin" ? "abogado" : role;
      const isSuperAdmin = userProfile.tipo_abogado === "super_admin";
      
      if (role === "admin" && !isSuperAdmin) {
        throw new Error("Acceso denegado. No tienes permisos de administrador.");
      }
      if (role === "abogado" && (userProfile.role !== "abogado" || isSuperAdmin)) {
         throw new Error("Esta página es solo para abogados regulares.");
      }
       if (role === "cliente" && userProfile.role !== "cliente") {
         throw new Error("Esta página es solo para clientes.");
      }

      toast({
        title: "¡Bienvenido/a de nuevo!",
        description: "Has iniciado sesión correctamente.",
      });

      // Redirección centralizada
      if (isSuperAdmin) {
        navigate("/admin/dashboard", { replace: true });
      } else if (userProfile.role === "abogado") {
        navigate("/abogados/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }

    } catch (error: any) {
      logError("Error en Login", error.message || "Error desconocido");
      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Por favor, verifica tu email y contraseña.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}${config.path}?tab=reset-password`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Enlace enviado",
        description: "Se ha enviado un enlace de recuperación a tu correo. Por favor, revisa tu bandeja de entrada.",
      });

      setShowForgotPassword(false);
      setForgotEmail("");

    } catch (error: any) {
      console.error("Error al recuperar contraseña:", error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={config.title}
      subtitle={config.description}
      roleLabel={config.label}
      showGoogleLogin={config.providers.includes("google")}
      showLawyerAccess={config.showLawyerApplication}
      showClientSignup={config.allowRegister}
      onGoogleLogin={handleGoogleLogin}
    >
      <form onSubmit={handleLogin} className="space-y-5">
        {config.secureLoginMessage && (
          <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">{config.secureLoginMessage}</p>
          </div>
        )}
        
        <div>
          <Label htmlFor="email-login" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email <span className="text-blue-500">*</span>
          </Label>
          <Input
            id="email-login"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <Label htmlFor="password-login" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contraseña <span className="text-blue-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password-login"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white placeholder:text-gray-400 pr-10 focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <motion.div 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className="pt-2"
        >
          <Button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full bg-gradient-to-r relative overflow-hidden from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-2 rounded-lg transition-all duration-300",
              isHovered ? "shadow-lg shadow-blue-200" : ""
            )}
          >
            <span className="flex items-center justify-center">
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </span>
            {isHovered && (
              <motion.span
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{ filter: "blur(8px)" }}
              />
            )}
          </Button>
        </motion.div>
        
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </form>

    </AuthLayout>
  );
};

export default UnifiedAuth;

