
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import { FeaturesSectionWithHoverEffects } from "@/components/ui/feature-section-with-hover-effects";
import { Testimonial } from "@/components/ui/testimonial-card";
import { FooterSection } from "@/components/ui/footer-section";
import { Moon, Sun, MessageCircle, Scale, Users, Shield, Zap, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ShimmerButton } from "@/components/ui/shimmer-button";

const Index = () => {
  const [query, setQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Check for dark mode preference from localStorage and system
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (query.trim() === "") {
      toast({
        title: "Por favor, introduce tu consulta.",
        description: "El campo de consulta no puede estar vacío.",
      });
      return;
    }
    navigate(`/chat?q=${encodeURIComponent(query)}`);
  };

  const handleAuthRedirect = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 relative overflow-hidden">
      <AnimatedBackground darkMode={darkMode} />
      
      {/* Header */}
      <header className="relative z-10 px-4 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              klamAI
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            {user ? (
              <Button onClick={() => navigate('/dashboard')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Dashboard
              </Button>
            ) : (
              <Button onClick={handleAuthRedirect} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950">
                Iniciar Sesión
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4"
          >
            Tu Asistente Legal Inteligente
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg text-gray-600 dark:text-gray-300 mb-8"
          >
            Obtén respuestas claras y precisas a tus preguntas legales con la
            ayuda de la inteligencia artificial.
          </motion.p>
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            onSubmit={handleSubmit}
            className="flex items-center justify-center space-x-3"
          >
            <Input
              type="text"
              placeholder="Escribe tu pregunta legal..."
              className="w-full max-w-md rounded-full"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <ShimmerButton type="submit" className="rounded-full">
              Preguntar
            </ShimmerButton>
          </motion.form>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-12 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
              Características Principales
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Descubre cómo klamAI puede ayudarte en tus necesidades legales.
            </p>
          </motion.div>
          <FeaturesSectionWithHoverEffects />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 py-16">
        <div className="max-w-5xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-3xl font-semibold text-gray-900 dark:text-white mb-8"
          >
            Lo que dicen nuestros usuarios
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Laura M.",
                role: "Cliente",
                testimonial:
                  "klamAI me ha ayudado a entender mejor mis derechos y opciones legales. ¡Muy recomendable!",
              },
              {
                name: "Carlos P.",
                role: "Cliente",
                testimonial:
                  "La precisión y rapidez de klamAI son impresionantes. ¡Una herramienta indispensable!",
              },
              {
                name: "Sofia R.",
                role: "Cliente",
                testimonial:
                  "Gracias a klamAI, pude resolver mis dudas legales de forma fácil y rápida. ¡Excelente servicio!",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 + index * 0.2 }}
              >
                <Testimonial {...testimonial} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <FooterSection />
    </div>
  );
};

export default Index;
