
import { useState, useEffect } from "react";
import { Moon, Sun, Scale, Eye, EyeOff, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import OptimizedAnimatedBackground from "@/components/OptimizedAnimatedBackground";

const Auth = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);

  // Estados separados para login
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    showPassword: false
  });

  // Estados separados para registro
  const [signupForm, setSignupForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    showPassword: false,
    acceptPolicies: false
  });

  // Estados para recuperar contraseña
  const [forgotForm, setForgotForm] = useState({
    email: "",
    show: false
  });

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    let mounted = true;
    
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          navigate('/dashboard');
        }
      } catch (error) {
        console.log('Error checking session:', error);
      }
    };
    
    checkUser();
    
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Error con Google Sign In:", error.message);
      toast({
        title: "Error con Google",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "¡Sesión iniciada con éxito!",
        description: "Redirigiendo a tu dashboard...",
      });

      setTimeout(() => {
        navigate('/dashboard');
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
    
    if (!signupForm.acceptPolicies) {
      toast({
        title: "Políticas requeridas",
        description: "Debes aceptar las políticas de privacidad y términos de servicio para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nombre: signupForm.nombre,
            apellido: signupForm.apellido,
            acepta_politicas: signupForm.acceptPolicies,
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
        setSignupForm({
          nombre: "",
          apellido: "",
          email: "",
          password: "",
          showPassword: false,
          acceptPolicies: false
        });
        
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
      const { error } = await supabase.auth.resetPasswordForEmail(forgotForm.email, {
        redirectTo: `${window.location.origin}/auth?tab=reset-password`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Enlace enviado",
        description: "Se ha enviado un enlace de recuperación a tu correo. Por favor, revisa tu bandeja de entrada.",
      });

      setForgotForm({ email: "", show: false });

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

  // Reset states when changing tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setIsLoading(false); // Reset loading state
    
    // Reset forms when switching tabs
    if (value === "login") {
      setLoginForm(prev => ({ ...prev, showPassword: false }));
    } else if (value === "signup") {
      setSignupForm(prev => ({ ...prev, showPassword: false }));
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-300 font-sans ${darkMode ? 'dark' : ''}`}>
      <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800">
        
        {/* Header con botones mejorados */}
        <header className="fixed z-20 top-4 left-4 right-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-full px-4 py-2 border border-white/20">
              <Scale className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">klamAI</span>
            </Link>

            <div className="flex items-center gap-3">
              <Button onClick={toggleDarkMode} variant="outline" size="icon" className="rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-white/20">
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-gray-700 dark:text-white bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-full border border-white/20">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-20 flex items-center justify-center min-h-screen px-4">
          <div className="w-full max-w-6xl overflow-hidden rounded-3xl flex bg-white/95 dark:bg-gray-800/95 shadow-2xl backdrop-blur-xl">
            {/* Left side - Optimized Animated Background */}
            <div className="hidden lg:block w-1/2 h-[700px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
                <OptimizedAnimatedBackground />
                
                {/* Logo and text overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
                  <div className="mb-6">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                      <Scale className="text-white h-8 w-8" />
                    </div>
                  </div>
                  <h2 className="text-4xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    klamAI
                  </h2>
                  <p className="text-sm text-center text-gray-600 dark:text-gray-300 max-w-xs">
                    Tu asistente legal inteligente. Accede a tu dashboard y conecta con profesionales del derecho
                  </p>
                </div>
              </div>
            </div>
            
            {/* Right side - Auth Forms */}
            <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-white dark:bg-gray-800">
              
              {!forgotForm.show ? (
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 dark:bg-gray-700">
                    <TabsTrigger value="login" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600">Iniciar Sesión</TabsTrigger>
                    <TabsTrigger value="signup" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600">Registrarse</TabsTrigger>
                  </TabsList>

                  {/* Login Tab */}
                  <TabsContent value="login" className="space-y-0">
                    <div className="space-y-6">
                      <div>
                        <h1 className="text-2xl md:text-3xl font-bold mb-1 text-gray-800 dark:text-white">Bienvenido de vuelta</h1>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">Inicia sesión en tu cuenta</p>
                      </div>
                      
                      {/* Google Sign In Button */}
                      <div>
                        <button 
                          onClick={handleGoogleSignIn}
                          disabled={isLoading}
                          className="w-full flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 text-gray-700 dark:text-gray-200 shadow-sm disabled:opacity-50"
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <span>{isLoading ? "Conectando..." : "Continuar con Google"}</span>
                        </button>
                      </div>
                      
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">O continúa con email</span>
                        </div>
                      </div>
                      
                      <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                          <Label htmlFor="login-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email <span className="text-blue-500">*</span>
                          </Label>
                          <Input
                            id="login-email"
                            type="email"
                            value={loginForm.email}
                            onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="tu@email.com"
                            required
                            className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="login-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Contraseña <span className="text-blue-500">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="login-password"
                              type={loginForm.showPassword ? "text" : "password"}
                              value={loginForm.password}
                              onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                              placeholder="Tu contraseña"
                              required
                              className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white pr-10"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                              onClick={() => setLoginForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                            >
                              {loginForm.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-2 rounded-lg transition-all duration-300 disabled:opacity-50"
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                          >
                            <span className="flex items-center justify-center">
                              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </span>
                          </Button>
                        </div>
                        
                        <div className="text-center mt-6">
                          <button
                            type="button"
                            onClick={() => setForgotForm(prev => ({ ...prev, show: true }))}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm transition-colors"
                          >
                            ¿Olvidaste tu contraseña?
                          </button>
                        </div>
                      </form>
                    </div>
                  </TabsContent>

                  {/* Signup Tab */}
                  <TabsContent value="signup" className="space-y-0">
                    <div className="space-y-6">
                      <div>
                        <h1 className="text-2xl md:text-3xl font-bold mb-1 text-gray-800 dark:text-white">Crear cuenta</h1>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">Regístrate para acceder a klamAI</p>
                      </div>

                      {/* Google Sign Up Button */}
                      <div>
                        <button 
                          onClick={handleGoogleSignIn}
                          disabled={isLoading}
                          className="w-full flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 text-gray-700 dark:text-gray-200 shadow-sm disabled:opacity-50"
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <span>{isLoading ? "Conectando..." : "Registrarse con Google"}</span>
                        </button>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">O regístrate con email</span>
                        </div>
                      </div>

                      <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="signup-nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</Label>
                            <Input
                              id="signup-nombre"
                              type="text"
                              value={signupForm.nombre}
                              onChange={(e) => setSignupForm(prev => ({ ...prev, nombre: e.target.value }))}
                              placeholder="Tu nombre"
                              required
                              className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <Label htmlFor="signup-apellido" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</Label>
                            <Input
                              id="signup-apellido"
                              type="text"
                              value={signupForm.apellido}
                              onChange={(e) => setSignupForm(prev => ({ ...prev, apellido: e.target.value }))}
                              placeholder="Tu apellido"
                              required
                              className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo electrónico</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            value={signupForm.email}
                            onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="tu@email.com"
                            required
                            className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white"
                          />
                        </div>

                        <div>
                          <Label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</Label>
                          <div className="relative">
                            <Input
                              id="signup-password"
                              type={signupForm.showPassword ? "text" : "password"}
                              value={signupForm.password}
                              onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                              placeholder="Mínimo 6 caracteres"
                              required
                              minLength={6}
                              className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white pr-10"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                              onClick={() => setSignupForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                            >
                              {signupForm.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            id="accept-policies"
                            checked={signupForm.acceptPolicies}
                            onChange={(e) => setSignupForm(prev => ({ ...prev, acceptPolicies: e.target.checked }))}
                            className="mt-1"
                            required
                          />
                          <Label htmlFor="accept-policies" className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
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

                        <div className="pt-2">
                          <Button
                            type="submit"
                            disabled={isLoading || !signupForm.acceptPolicies}
                            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-2 rounded-lg transition-all duration-300 disabled:opacity-50"
                          >
                            <span className="flex items-center justify-center">
                              {isLoading ? "Registrando..." : "Crear Cuenta"}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </span>
                          </Button>
                        </div>
                      </form>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                /* Forgot Password Form */
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-1 text-gray-800 dark:text-white">Recuperar contraseña</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">Ingresa tu correo para recibir un enlace de recuperación</p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <Label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo electrónico</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        value={forgotForm.email}
                        onChange={(e) => setForgotForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="tu@email.com"
                        required
                        className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-2 rounded-lg transition-all duration-300 disabled:opacity-50"
                    >
                      {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setForgotForm({ email: "", show: false })}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm transition-colors"
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
