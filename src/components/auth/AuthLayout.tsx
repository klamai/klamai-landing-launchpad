import React, { useRef, useEffect, useState } from "react";
import { Moon, Sun, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// Animated Background Component
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
    const dots: Array<{ x: number; y: number; radius: number; opacity: number }> = [];
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

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  roleLabel?: string; // Nueva prop para la etiqueta del rol
  showGoogleLogin?: boolean;
  showLawyerAccess?: boolean;
  showClientSignup?: boolean;
  onGoogleLogin?: () => void;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  title = "Bienvenido de vuelta",
  subtitle = "Inicia sesión en tu cuenta",
  roleLabel, // Recibir la nueva prop
  showGoogleLogin = true,
  showLawyerAccess = true,
  showClientSignup = true,
  onGoogleLogin
}) => {
  const [darkMode, setDarkMode] = useState(false);

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

  return (
    <div className={`min-h-screen transition-all duration-300 font-sans ${darkMode ? 'dark' : ''}`}>
      <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800">
        
        {/* Header con botones mejorados */}
        <header className="fixed z-20 top-4 left-4 right-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-full px-4 py-2 border border-white/20">
              <img src="/logo.svg" alt="klamAI Logo" className="h-8" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">KlamAI</span>
              {roleLabel && (
                <span className="ml-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {roleLabel}
                </span>
              )}
            </Link>

            <div className="flex items-center gap-3">
              <button 
                onClick={toggleDarkMode} 
                className="rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-white/20 p-2 hover:opacity-80 transition-opacity"
              >
                {darkMode ? <Sun className="h-4 w-4 text-gray-700 dark:text-white" /> : <Moon className="h-4 w-4 text-gray-700 dark:text-white" />}
              </button>
              <Link to="/">
                <button className="text-gray-700 dark:text-white bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-full border border-white/20 px-4 py-2 hover:opacity-80 transition-opacity flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </button>
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
                      <img src="/logo_white.svg" alt="klamAI Logo" className="h-8" />
                    </div>
                  </motion.div>
                  <motion.h2 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className="text-4xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    KlamAI
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="text-sm text-center text-gray-600 dark:text-gray-300 max-w-xs"
                  >
                    Tu asistente legal inteligente. Accede a tu dashboard y conecta con profesionales del derecho
                  </motion.p>
                </div>
              </div>
            </div>
            
            {/* Right side - Auth Content */}
            <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-white dark:bg-gray-800">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-2xl md:text-3xl font-bold mb-1 text-gray-800 dark:text-white">{title}</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8">{subtitle}</p>
                
                {/* Google Sign In Button */}
                {showGoogleLogin && (
                  <div className="mb-6">
                    <button 
                      onClick={onGoogleLogin}
                      className="w-full flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 text-gray-700 dark:text-gray-200 shadow-sm"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>Continuar con Google</span>
                    </button>
                  </div>
                )}
                
                {/* Separator */}
                {showGoogleLogin && (
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">O continúa con email</span>
                    </div>
                  </div>
                )}
                
                {/* Main Content */}
                {children}
                
                {/* Additional Options */}
                <div className="mt-8 space-y-4">
                  {showLawyerAccess && (
                    <div className="text-center">
                      <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm transition-colors">
                        ¿Eres abogado? Solicitar acceso
                      </button>
                    </div>
                  )}
                  
                  {showClientSignup && (
                    <div className="text-center">
                      <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm transition-colors">
                        ¿No tienes cuenta? Crear cuenta de cliente
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AuthLayout;

