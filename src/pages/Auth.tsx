
import { useState, useEffect } from "react";
import { Moon, Sun, Scale, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estados para el formulario de login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Estados para el formulario de registro
  const [signupNombre, setSignupNombre] = useState("");
  const [signupApellido, setSignupApellido] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [acceptPolicies, setAcceptPolicies] = useState(false);

  // Estados para recuperar contraseña
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/chat');
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "¡Sesión iniciada con éxito!",
        description: "Redirigiendo a tu dashboard...",
      });

      setTimeout(() => {
        navigate('/chat');
      }, 1000);

    } catch (error: any) {
      console.error("Error al iniciar sesión:", error.message);
      toast({
        title: "Error al iniciar sesión",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptPolicies) {
      toast({
        title: "Políticas requeridas",
        description: "Debes aceptar las políticas de privacidad y términos de servicio para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nombre: signupNombre,
            apellido: signupApellido,
            acepta_politicas: acceptPolicies,
            role: 'cliente'
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        toast({
          title: "¡Registro exitoso!",
          description: "Por favor, revisa tu correo para confirmar tu cuenta.",
        });
        
        // Limpiar formulario
        setSignupNombre("");
        setSignupApellido("");
        setSignupEmail("");
        setSignupPassword("");
        setAcceptPolicies(false);
        
        // Cambiar a tab de login
        setActiveTab("login");
      }

    } catch (error: any) {
      console.error("Error al registrar:", error.message);
      toast({
        title: "Error al registrar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth?tab=reset-password`,
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
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-300 font-sans ${darkMode ? 'dark' : ''}`}>
      <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800">
        {/* Header */}
        <header className="fixed z-20 w-full px-2">
          <div className="mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12 bg-white/80 dark:bg-gray-800/80 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5">
            <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
              <div className="flex w-full justify-between lg:w-auto">
                <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                  <Scale className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">klamAI</span>
                </Link>

                <div className="flex items-center gap-4">
                  <Button onClick={toggleDarkMode} variant="outline" size="icon" className="rounded-full">
                    {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                  <Link to="/">
                    <Button variant="ghost" size="sm" className="text-gray-700 dark:text-white">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Volver
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-24 flex items-center justify-center min-h-screen px-4">
          <div className="w-full max-w-md">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border-2 border-blue-200 dark:border-blue-500/30">
              
              {!showForgotPassword ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                    <TabsTrigger value="signup">Registrarse</TabsTrigger>
                  </TabsList>

                  {/* Login Tab */}
                  <TabsContent value="login">
                    <div className="text-center mb-6">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Bienvenido de vuelta
                      </h1>
                      <p className="text-gray-600 dark:text-gray-400">
                        Inicia sesión en tu cuenta
                      </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Correo electrónico</Label>
                        <Input
                          id="login-email"
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="tu@email.com"
                          required
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password">Contraseña</Label>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Tu contraseña"
                            required
                            className="w-full pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                      </Button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>
                    </form>
                  </TabsContent>

                  {/* Signup Tab */}
                  <TabsContent value="signup">
                    <div className="text-center mb-6">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Crear cuenta
                      </h1>
                      <p className="text-gray-600 dark:text-gray-400">
                        Regístrate para acceder a VitorIA
                      </p>
                    </div>

                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-nombre">Nombre</Label>
                          <Input
                            id="signup-nombre"
                            type="text"
                            value={signupNombre}
                            onChange={(e) => setSignupNombre(e.target.value)}
                            placeholder="Tu nombre"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-apellido">Apellido</Label>
                          <Input
                            id="signup-apellido"
                            type="text"
                            value={signupApellido}
                            onChange={(e) => setSignupApellido(e.target.value)}
                            placeholder="Tu apellido"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Correo electrónico</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          placeholder="tu@email.com"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Contraseña</Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            required
                            minLength={6}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          id="accept-policies"
                          checked={acceptPolicies}
                          onChange={(e) => setAcceptPolicies(e.target.checked)}
                          className="mt-1"
                          required
                        />
                        <Label htmlFor="accept-policies" className="text-sm leading-relaxed">
                          He leído y acepto las{" "}
                          <Link to="/politicas-privacidad" className="text-blue-600 dark:text-blue-400 hover:underline">
                            Políticas de Privacidad
                          </Link>
                          {" "}y los{" "}
                          <Link to="/aviso-legal" className="text-blue-600 dark:text-blue-400 hover:underline">
                            Términos de Servicio
                          </Link>
                          .
                        </Label>
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading || !acceptPolicies}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isLoading ? "Registrando..." : "Crear Cuenta"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              ) : (
                /* Forgot Password Form */
                <div>
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Recuperar contraseña
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      Ingresa tu correo para recibir un enlace de recuperación
                    </p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email">Correo electrónico</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="tu@email.com"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(false)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Volver al inicio de sesión
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Auth;
