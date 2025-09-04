import { useState, useEffect } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { logError, logAuth } from "@/utils/secureLogging";
import AuthLayout from "@/components/auth/AuthLayout";
import { SecureLogger } from "@/utils/secureLogging";

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
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState<Role>("cliente");
  const [config, setConfig] = useState(AUTH_CONFIG.cliente);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  
  // Estados para reset de contraseña
  const [currentTab, setCurrentTab] = useState<'login' | 'forgot' | 'reset'>('login');
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Determinar el rol basado en la URL
  useEffect(() => {
    const currentPath = location.pathname;
    const determinedRole = (Object.keys(AUTH_CONFIG) as Role[]).find(
      (r) => AUTH_CONFIG[r].path === currentPath
    ) || "cliente";
    
    setRole(determinedRole);
    setConfig(AUTH_CONFIG[determinedRole]);
  }, [location.pathname]);

  // Detectar tab en URL al cargar
  useEffect(() => {
    const tab = searchParams.get('tab');
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    
    if (tab === 'reset-password' && tokenHash && type === 'recovery') {
      setCurrentTab('reset');
    } else if (tokenHash && type === 'signup') {
      // Manejar confirmación de signup inmediatamente
      const confirmSignup = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'signup'
          });

          if (error) {
            throw error;
          }

          if (data.session) {
            toast({
              title: "¡Cuenta activada!",
              description: "Tu cuenta ha sido confirmada exitosamente. Serás redirigido a tu dashboard.",
            });

            // Redirigir al dashboard después de un breve delay
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          }
        } catch (error: any) {
          SecureLogger.error(error, 'signup_confirmation');
          toast({
            title: "Error de confirmación",
            description: error.message || "No se pudo confirmar tu cuenta. El enlace puede haber expirado.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
      
      confirmSignup();
    } else {
      setCurrentTab('login');
    }
  }, [searchParams, navigate, toast]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth-callback`,
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

      logAuth('login', true, `Login exitoso para ${email}, rol: ${userProfile.role}`);

      const isSuperAdmin = userProfile.tipo_abogado === "super_admin";

      toast({
        title: "¡Bienvenido/a de nuevo!",
        description: "Has iniciado sesión correctamente. Redirigiendo a tu dashboard...",
      });

      // Redirección automática basada en el rol real del usuario (sin validación de página)
      if (isSuperAdmin) {
        navigate("/admin/dashboard", { replace: true });
      } else if (userProfile.role === "abogado") {
        navigate("/abogados/dashboard", { replace: true });
      } else if (userProfile.role === "cliente") {
        navigate("/dashboard", { replace: true });
      } else {
        // Rol desconocido, redirigir a cliente por defecto
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
      // Intentar usar nuestra Edge Function para rate limiting y logging
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const response = await fetch(`${supabaseUrl}/functions/v1/password-reset-security`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            email: forgotEmail,
            ip_address: '127.0.0.1', // En producción, esto se puede obtener del servidor
            user_agent: navigator.userAgent
          })
        });

        const result = await response.json();

        if (!response.ok) {
          if (result.blocked) {
            throw new Error('Demasiados intentos de recuperación. Intenta de nuevo en una hora.');
          }
          throw new Error(result.error || 'Error enviando email de recuperación');
        }

        SecureLogger.info(`Password reset email sent via Edge Function to ${forgotEmail}`, 'auth');
      } catch (edgeFunctionError: any) {
        // Fallback al método directo si la Edge Function falla
        SecureLogger.warn(`Edge Function failed, using fallback: ${edgeFunctionError.message}`, 'password_reset');
        
        const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
          redirectTo: `${window.location.origin}${config.path}?tab=reset-password`,
        });

        if (error) {
          throw error;
        }

        SecureLogger.info(`Password reset email sent via fallback to ${forgotEmail}`, 'auth');
      }

      toast({
        title: "Enlace enviado",
        description: "Se ha enviado un enlace de recuperación a tu correo. Por favor, revisa tu bandeja de entrada y spam.",
      });

      setShowForgotPassword(false);
      setForgotEmail("");
      setCurrentTab('login');

    } catch (error: any) {
      SecureLogger.error(error, 'password_recovery');
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Validar contraseña
  const validatePassword = (password: string): string[] => {
    const errors = [];
    if (password.length < 8) errors.push("Mínimo 8 caracteres");
    if (!/[a-z]/.test(password)) errors.push("Una letra minúscula");
    if (!/[A-Z]/.test(password)) errors.push("Una letra mayúscula");
    if (!/[0-9]/.test(password)) errors.push("Un número");
    if (!/[^a-zA-Z0-9]/.test(password)) errors.push("Un carácter especial");
    return errors;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (newPassword !== confirmPassword) {
        throw new Error("Las contraseñas no coinciden");
      }

      const passwordErrors = validatePassword(newPassword);
      if (passwordErrors.length > 0) {
        throw new Error(`La contraseña debe tener: ${passwordErrors.join(", ")}`);
      }

      // Obtener el token y type de la URL
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      
      if (!tokenHash || type !== 'recovery') {
        throw new Error('Token de recuperación inválido o expirado');
      }

      // Verificar la sesión actual del token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        SecureLogger.error(sessionError, 'password_reset');
      }

      // Si no hay sesión, necesitamos verificar y usar el token
      if (!session) {
        // Verificar el token de recovery
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery'
        });

        if (verifyError) {
          throw new Error('Token de recuperación inválido o expirado');
        }

        if (!data.session) {
          throw new Error('No se pudo establecer la sesión de recuperación');
        }
      }

      // Ahora actualizar la contraseña
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente. Serás redirigido a tu dashboard.",
      });

      // Limpiar estados
      setNewPassword("");
      setConfirmPassword("");
      
      // Obtener la sesión actualizada para determinar el rol
      const { data: { session: updatedSession } } = await supabase.auth.getSession();
      
      if (updatedSession?.user) {
        const userId = updatedSession.user.id;
        
        SecureLogger.info(`Password reset successful for user ${userId}`, 'password_reset');
        
        // Redirigir basándose en la URL actual (más simple y confiable)
        setTimeout(() => {
          if (location.pathname.includes('/admin/')) {
            navigate('/admin/dashboard', { replace: true });
          } else if (location.pathname.includes('/abogados/')) {
            navigate('/abogados/dashboard', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        }, 1500);
      }

    } catch (error: any) {
      SecureLogger.error(error, 'password_reset');
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
      {/* Formulario de Login */}
      {currentTab === 'login' && (
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
            onClick={() => {
              setShowForgotPassword(true);
              setCurrentTab('forgot');
            }}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        </form>
      )}

      {/* Formulario de Forgot Password */}
      {currentTab === 'forgot' && (
        <form onSubmit={handleForgotPassword} className="space-y-5">
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recuperar Contraseña</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Ingresa tu email para recibir un enlace de recuperación
            </p>
          </div>

          <div>
            <Label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email <span className="text-blue-500">*</span>
            </Label>
            <Input
              id="forgot-email"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-2 rounded-lg transition-all duration-300"
            >
              {loading ? "Enviando..." : "Enviar Enlace de Recuperación"}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowForgotPassword(false);
                setCurrentTab('login');
                setForgotEmail("");
              }}
              className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Volver al inicio de sesión
            </Button>
          </div>
        </form>
      )}

      {/* Formulario de Reset Password */}
      {currentTab === 'reset' && (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nueva Contraseña</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Ingresa tu nueva contraseña segura
            </p>
          </div>

          <div>
            <Label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nueva contraseña <span className="text-blue-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white placeholder:text-gray-400 pr-10 focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                <p className="font-medium mb-1">La contraseña debe tener:</p>
                <ul className="space-y-1">
                  {validatePassword(newPassword).map((error, index) => (
                    <li key={index} className="flex items-center text-red-500">
                      <span className="mr-2">•</span> {error}
                    </li>
                  ))}
                  {validatePassword(newPassword).length === 0 && (
                    <li className="flex items-center text-green-500">
                      <span className="mr-2">✓</span> Contraseña segura
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirmar contraseña <span className="text-blue-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white placeholder:text-gray-400 pr-10 focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="mt-1 text-xs text-red-500">Las contraseñas no coinciden</p>
            )}
            {confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
              <p className="mt-1 text-xs text-green-500">✓ Las contraseñas coinciden</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || newPassword !== confirmPassword || validatePassword(newPassword).length > 0}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-2 rounded-lg transition-all duration-300"
          >
            {loading ? "Actualizando..." : "Actualizar Contraseña"}
          </Button>
        </form>
      )}

    </AuthLayout>
  );
};

export default UnifiedAuth;

