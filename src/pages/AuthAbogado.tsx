import { useState, useEffect } from "react";
import { Moon, Sun, Scale, Eye, EyeOff, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";

// Animated Background Component (mismo que Auth.tsx)
const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const routes = [
    {
      start: { x: 100, y: 150, delay: 0 },
      end: { x: 200, y: 80, delay: 2 },
      color: "#2563eb",
    },
    {
      start: { x: 200, y: 80, delay: 2 },
      end: { x: 260, y: 120, delay: 4 },
      color: "#2563eb",
    },
    {
      start: { x: 50, y: 50, delay: 1 },
      end: { x: 150, y: 180, delay: 3 },
      color: "#2563eb",
    },
    {
      start: { x: 280, y: 60, delay: 0.5 },
      end: { x: 180, y: 180, delay: 2.5 },
      color: "#2563eb",
    },
  ];

  const generateDots = (width: number, height: number) => {
    const dots = [];
    const gap = 12;
    const dotRadius = 1;

    for (let x = 0; x < width; x += gap) {
      for (let y = 0; y < height; y += gap) {
        const isInMapShape =
          ((x < width * 0.25 && x > width * 0.05) && (y < height * 0.4 && y > height * 0.1)) ||
          ((x < width * 0.25 && x > width * 0.15) && (y < height * 0.8 && y > height * 0.4)) ||
          ((x < width * 0.45 && x > width * 0.3) && (y < height * 0.35 && y > height * 0.15)) ||
          ((x < width * 0.5 && x > width * 0.35) && (y < height * 0.65 && y > height * 0.35)) ||
          ((x < width * 0.7 && x > width * 0.45) && (y < height * 0.5 && y > height * 0.1)) ||
          ((x < width * 0.8 && x > width * 0.65) && (y < height * 0.8 && y > height * 0.6));

        if (isInMapShape && Math.random() > 0.3) {
          dots.push({
            x,
            y,
            radius: dotRadius,
            opacity: Math.random() * 0.5 + 0.2,
          });
        }
      }
    }
    return dots;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
      canvas.width = width;
      canvas.height = height;
    });

    resizeObserver.observe(canvas.parentElement as Element);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dots = generateDots(dimensions.width, dimensions.height);
    let animationFrameId: number;
    let startTime = Date.now();

    function drawDots() {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      
      dots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(37, 99, 235, ${dot.opacity})`;
        ctx.fill();
      });
    }

    function drawRoutes() {
      const currentTime = (Date.now() - startTime) / 1000;
      
      routes.forEach(route => {
        const elapsed = currentTime - route.start.delay;
        if (elapsed <= 0) return;
        
        const duration = 3;
        const progress = Math.min(elapsed / duration, 1);
        
        const x = route.start.x + (route.end.x - route.start.x) * progress;
        const y = route.start.y + (route.end.y - route.start.y) * progress;
        
        ctx.beginPath();
        ctx.moveTo(route.start.x, route.start.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = route.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(route.start.x, route.start.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = route.color;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#3b82f6";
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(59, 130, 246, 0.4)";
        ctx.fill();
        
        if (progress === 1) {
          ctx.beginPath();
          ctx.arc(route.end.x, route.end.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = route.color;
          ctx.fill();
        }
      });
    }
    
    function animate() {
      drawDots();
      drawRoutes();
      
      const currentTime = (Date.now() - startTime) / 1000;
      if (currentTime > 15) {
        startTime = Date.now();
      }
      
      animationFrameId = requestAnimationFrame(animate);
    }
    
    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

const AuthAbogado = () => {
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
  const [signupTipoAbogado, setSignupTipoAbogado] = useState("regular");
  const [acceptPolicies, setAcceptPolicies] = useState(false);

  // Estados para recuperar contraseña
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      const isDark = savedTheme === 'true';
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Verificar si es abogado
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.role === 'abogado') {
          navigate('/abogados/dashboard');
        } else {
          navigate('/dashboard');
        }
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

      // Verificar que el usuario es abogado
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, tipo_abogado')
        .eq('id', data.user.id)
        .single();

      if (profileError || profile?.role !== 'abogado') {
        await supabase.auth.signOut();
        throw new Error('Esta cuenta no tiene permisos de abogado');
      }

      toast({
        title: "¡Sesión iniciada con éxito!",
        description: "Redirigiendo a tu dashboard...",
      });

      setTimeout(() => {
        navigate('/abogados/dashboard');
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
      const redirectUrl = `${window.location.origin}/abogados/dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nombre: signupNombre,
            apellido: signupApellido,
            acepta_politicas: acceptPolicies,
            role: 'abogado',
            tipo_abogado: signupTipoAbogado
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        toast({
          title: "¡Registro exitoso!",
          description: "Por favor, revisa tu correo para confirmar tu cuenta de abogado.",
        });
        
        // Limpiar formulario
        setSignupNombre("");
        setSignupApellido("");
        setSignupEmail("");
        setSignupPassword("");
        setSignupTipoAbogado("regular");
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
        redirectTo: `${window.location.origin}/abogados/auth?tab=reset-password`,
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
        <header className="fixed z-20 top-4 left-4 right-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-full px-4 py-2 border border-white/20">
              <Scale className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">klamAI</span>
              <span className="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">Abogados</span>
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
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-6xl overflow-hidden rounded-3xl flex bg-white/95 dark:bg-gray-800/95 shadow-2xl backdrop-blur-xl"
          >
            {/* Left side - Animated Background */}
            <div className="hidden lg:block w-1/2 h-[700px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
                <AnimatedBackground />
                
                {/* Logo and text overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="mb-6"
                  >
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                      <Scale className="text-white h-8 w-8" />
                    </div>
                  </motion.div>
                  <motion.h2 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className="text-4xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    klamAI Pro
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="text-sm text-center text-gray-600 dark:text-gray-300 max-w-xs"
                  >
                    Portal exclusivo para abogados. Gestiona casos, clientes y expande tu práctica legal
                  </motion.p>
                </div>
              </div>
            </div>
            
            {/* Right side - Auth Forms */}
            <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-white dark:bg-gray-800">
              
              {!showForgotPassword ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 dark:bg-gray-700">
                    <TabsTrigger value="login" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600">Iniciar Sesión</TabsTrigger>
                    <TabsTrigger value="signup" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600">Registrarse</TabsTrigger>
                  </TabsList>

                  {/* Login Tab */}
                  <TabsContent value="login">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <h1 className="text-2xl md:text-3xl font-bold mb-1 text-gray-800 dark:text-white">Portal de Abogados</h1>
                      <p className="text-gray-500 dark:text-gray-400 mb-8">Accede a tu dashboard profesional</p>
                      
                      <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-gray-700 dark:text-gray-200">Correo electrónico</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="tu@email.com" 
                            required 
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-gray-700 dark:text-gray-200">Contraseña</Label>
                          <div className="relative">
                            <Input 
                              id="password" 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Tu contraseña" 
                              required 
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 pr-12"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            ¿Olvidaste tu contraseña?
                          </button>
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 transition-all duration-300 shadow-lg hover:shadow-xl"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Iniciando sesión...
                            </div>
                          ) : (
                            <>
                              Iniciar Sesión
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </form>
                    </motion.div>
                  </TabsContent>

                  {/* Signup Tab */}
                  <TabsContent value="signup">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <h1 className="text-2xl md:text-3xl font-bold mb-1 text-gray-800 dark:text-white">Únete como Abogado</h1>
                      <p className="text-gray-500 dark:text-gray-400 mb-8">Crea tu cuenta profesional</p>
                      
                      <form onSubmit={handleSignUp} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="signup-nombre" className="text-gray-700 dark:text-gray-200">Nombre</Label>
                            <Input 
                              id="signup-nombre" 
                              type="text" 
                              placeholder="Tu nombre" 
                              required 
                              value={signupNombre}
                              onChange={(e) => setSignupNombre(e.target.value)}
                              className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="signup-apellido" className="text-gray-700 dark:text-gray-200">Apellido</Label>
                            <Input 
                              id="signup-apellido" 
                              type="text" 
                              placeholder="Tu apellido" 
                              required 
                              value={signupApellido}
                              onChange={(e) => setSignupApellido(e.target.value)}
                              className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className="text-gray-700 dark:text-gray-200">Correo electrónico</Label>
                          <Input 
                            id="signup-email" 
                            type="email" 
                            placeholder="tu@email.com" 
                            required 
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-gray-700 dark:text-gray-200">Contraseña</Label>
                          <div className="relative">
                            <Input 
                              id="signup-password" 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Mínimo 8 caracteres" 
                              required 
                              minLength={8}
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 pr-12"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tipo-abogado" className="text-gray-700 dark:text-gray-200">Tipo de Cuenta</Label>
                          <Select value={signupTipoAbogado} onValueChange={setSignupTipoAbogado}>
                            <SelectTrigger className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                              <SelectValue placeholder="Selecciona el tipo de cuenta" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="regular">Abogado Regular</SelectItem>
                              <SelectItem value="super_admin">Super Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            id="accept-policies"
                            checked={acceptPolicies}
                            onChange={(e) => setAcceptPolicies(e.target.checked)}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <Label htmlFor="accept-policies" className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            Acepto las{" "}
                            <Link to="/politicas-privacidad" className="text-blue-600 dark:text-blue-400 hover:underline">
                              Políticas de Privacidad
                            </Link>{" "}
                            y{" "}
                            <Link to="/aviso-legal" className="text-blue-600 dark:text-blue-400 hover:underline">
                              Términos de Servicio
                            </Link>
                          </Label>
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 transition-all duration-300 shadow-lg hover:shadow-xl"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Creando cuenta...
                            </div>
                          ) : (
                            <>
                              Crear Cuenta de Abogado
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </form>
                    </motion.div>
                  </TabsContent>
                </Tabs>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center gap-2 mb-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowForgotPassword(false)}
                      className="p-0 h-auto text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Volver
                    </Button>
                  </div>
                  
                  <h1 className="text-2xl md:text-3xl font-bold mb-1 text-gray-800 dark:text-white">Recuperar Contraseña</h1>
                  <p className="text-gray-500 dark:text-gray-400 mb-8">Te enviaremos un enlace para restablecer tu contraseña</p>
                  
                  <form onSubmit={handleForgotPassword} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email" className="text-gray-700 dark:text-gray-200">Correo electrónico</Label>
                      <Input 
                        id="forgot-email" 
                        type="email" 
                        placeholder="tu@email.com" 
                        required 
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 transition-all duration-300 shadow-lg hover:shadow-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Enviando...
                        </div>
                      ) : (
                        <>
                          Enviar Enlace de Recuperación
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AuthAbogado;