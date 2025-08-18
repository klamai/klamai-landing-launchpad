
import { useState, useEffect } from "react";
import { X, Mail, Lock, User, Eye, EyeOff, Scale } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SecureLogger } from '@/utils/secureLogging';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'signup';
  planId?: string;
  casoId?: string;
  redirectToUrl?: string;
}

const AuthModal = ({ isOpen, onClose, onSuccess, initialMode = 'login', planId, casoId, redirectToUrl }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: ""
  });

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  // Sync modal mode with prop changes
  useEffect(() => {
    setIsLogin(initialMode === 'login');
  }, [initialMode]);

  // Reset accept terms when switching modes
  useEffect(() => {
    setAcceptTerms(false);
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate terms acceptance for signup
    if (!isLogin && !acceptTerms) {
      toast({
        title: "Error",
        description: "Debes aceptar los términos y condiciones para continuar",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            title: "Error al iniciar sesión",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "¡Bienvenido de vuelta!",
          description: "Has iniciado sesión correctamente.",
        });
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Error",
            description: "Las contraseñas no coinciden",
            variant: "destructive",
          });
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.name);
        if (error) {
          toast({
            title: "Error al registrarse",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "¡Cuenta creada!",
          description: "Tu cuenta ha sido creada exitosamente.",
        });

        // Registrar consentimiento legal (términos/privacidad) tras signup
        try {
          await supabase.functions.invoke('record-consent', {
            body: {
              consent_type: 'terms_privacy',
              accepted_terms: true,
              accepted_privacy: true,
              policy_terms_version: 1,
              policy_privacy_version: 1,
            },
          });
        } catch (e) {
          // No bloquear el flujo por errores de logging
          SecureLogger.warn('No se pudo registrar consentimiento de signup', 'auth_modal');
        }
      }

      onSuccess();
    } catch (error: any) {
      SecureLogger.error(error, 'auth_modal_submit');
      
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Construir URL de redirección con prioridad a override explícito
      let redirectUrl = redirectToUrl || `${window.location.origin}/dashboard`;

      // Si no hay override explícito, mantener lógica previa
      if (!redirectToUrl) {
        // Si hay planId y casoId => ir a callback con ambos (flujo de pago)
        if (planId && casoId) {
          redirectUrl = `${window.location.origin}/auth-callback?planId=${encodeURIComponent(planId)}&casoId=${encodeURIComponent(casoId)}`;
        }
        // Si NO hay planId pero SÍ hay casoId => ir a callback sólo para vincular el caso
        else if (!planId && casoId) {
          redirectUrl = `${window.location.origin}/auth-callback?casoId=${encodeURIComponent(casoId)}`;
        }
      }

      SecureLogger.info('Configurando redirección de Google', 'auth_modal');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          // Pasar queryParams sólo cuando tengamos algo que aportar
          queryParams: (planId && casoId)
            ? { planId, casoId }
            : (casoId
              ? { casoId }
              : undefined)
        }
      });
      
      if (error) {
        SecureLogger.error(error, 'google_oauth_error');
        toast({
          title: "Error",
          description: error.message || "No se pudo conectar con Google",
          variant: "destructive",
        });
      } else {
        SecureLogger.info('Google OAuth iniciado exitosamente', 'auth_modal');
      }
    } catch (error) {
      SecureLogger.error(error, 'google_oauth_unexpected');
      const errMsg = error instanceof Error ? error.message : "Error al conectar con Google";
      toast({
        title: "Error",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 shadow-2xl">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="klamAI Logo" className="h-8" />      
              <span className="text-xl font-bold text-gray-900 dark:text-white">KlamAI</span>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isLogin ? 'Bienvenido de vuelta' : 'Regístrate para asegurar tu consulta'}
              </h2>
              {!isLogin && (
                <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
                  Crea una cuenta para guardar tu conversación de forma segura y acceder a tu historial cuando quieras.
                </p>
              )}
              {isLogin && (
                <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
                  Inicia sesión para acceder a tu historial de consultas.
                </p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-1">
          <Button 
            onClick={handleGoogleSignIn}
            variant="outline" 
            className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
            disabled={isLoading}
          >
            <FcGoogle className="mr-2 h-4 w-4" />
            {isLogin ? 'Continuar con Google' : 'Registrarse con Google'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-500" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                O continúa con email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <div className="space-y-1">
                <Label htmlFor="name" className="text-gray-700 dark:text-gray-300 text-sm">Nombre completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Tu nombre completo"
                    className="pl-9 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white text-sm h-9 focus:border-blue-500 focus:ring-blue-500"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  className="pl-9 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white text-sm h-9 focus:border-blue-500 focus:ring-blue-500"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 text-sm">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Tu contraseña"
                  className="pl-9 pr-9 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white text-sm h-9 focus:border-blue-500 focus:ring-blue-500"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300 text-sm">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirma tu contraseña"
                    className="pl-9 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white text-sm h-9 focus:border-blue-500 focus:ring-blue-500"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}

            {!isLogin && (
              <div className="flex items-start space-x-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  className="mt-0.5"
                />
                <div className="text-xs leading-relaxed">
                  <label
                    htmlFor="terms"
                    className="text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Acepto los términos y condiciones
                  </label>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Al registrarte, aceptas nuestros{" "}
                    <Link 
                      to="/aviso-legal" 
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                      target="_blank"
                    >
                      términos y condiciones
                    </Link>
                    {" "}y{" "}
                    <Link 
                      to="/politicas-privacidad" 
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                      target="_blank"
                    >
                      política de privacidad
                    </Link>
                    .
                  </p>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg h-9 transition-colors"
              disabled={isLoading || (!isLogin && !acceptTerms)}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Procesando...
                </div>
              ) : (
                isLogin ? "Iniciar Sesión" : "Crear Cuenta"
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
            >
              {isLogin 
                ? "¿No tienes cuenta? Créala aquí" 
                : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-2 rounded-lg">
            <p className="text-xs text-green-700 dark:text-green-400 text-center">
              <strong>🔒 Seguridad garantizada:</strong> Tu conversación actual se guardará automáticamente una vez que te registres o inicies sesión.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
