import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Moon, 
  Sun, 
  Scale, 
  Menu, 
  X, 
  Shield, 
  Users, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  MessageSquare,
  Gavel,
  FileText
} from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

const Index = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [menuState, setMenuState] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [consultation, setConsultation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConsultation(e.target.value);
  };

  const handleStartConsultation = async () => {
    if (!consultation.trim()) {
      toast({
        title: "Error",
        description: "Por favor, describe tu consulta legal.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase.functions.invoke('crear-borrador-caso', {
        body: {
          motivo_consulta: consultation,
          captcha_token: 'demo-token'
        }
      });

      if (error) {
        console.error('Error creating case:', error);
        toast({
          title: "Error",
          description: "Hubo un problema al procesar tu consulta. Por favor, inténtalo de nuevo.",
          variant: "destructive"
        });
        return;
      }

      console.log('Case created successfully:', data);
      
      if (data?.caso_id) {
        localStorage.setItem('userConsultation', consultation);
        localStorage.setItem('casoId', data.caso_id);
        
        if (data.session_token) {
          localStorage.setItem('current_session_token', data.session_token);
          localStorage.setItem('current_caso_id', data.caso_id);
        }

        // Navigate immediately without delay
        navigate('/chat');
      } else {
        throw new Error('No case ID received');
      }

    } catch (error) {
      console.error('Error in handleStartConsultation:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar tu consulta. Por favor, inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-300 font-sans ${darkMode ? 'dark' : ''}`}>
      <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800 flex flex-col">
        <AnimatedBackground darkMode={darkMode} />

        {/* Header */}
        <header>
          <nav data-state={menuState && 'active'} className="fixed z-20 w-full px-2 group">
            <div className={`mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12 ${isScrolled ? 'bg-white/80 dark:bg-gray-800/80 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5' : ''}`}>
              <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                <div className="flex w-full justify-between lg:w-auto">
                  <a href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
                    <Scale className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">klamAI</span>
                  </a>

                  <div className="flex items-center gap-4 lg:hidden">
                    <Button onClick={toggleDarkMode} variant="outline" size="icon" className="rounded-full">
                      {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                    <button onClick={() => setMenuState(!menuState)} aria-label={menuState == true ? 'Close Menu' : 'Open Menu'} className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5">
                      <Menu className="group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                      <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                    </button>
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-4">
                  <Button onClick={toggleDarkMode} variant="outline" size="icon" className="rounded-full">
                    {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                  <a href="/auth" className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200">Iniciar Sesión</a>
                  <Button className="bg-black text-white hover:bg-gray-100 hover:text-black border border-gray-300 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200">Registrarse</Button>
                </div>

                {/* Mobile menu */}
                <div className="bg-background group-data-[state=active]:block hidden w-full p-4 rounded-2xl border shadow-lg mt-4 lg:hidden">
                  <div className="flex flex-col gap-3 w-full">
                    <a href="/auth" className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 w-full text-center">Iniciar Sesión</a>
                    <Button className="bg-blue-600 text-white hover:bg-blue-700 w-full">Registrarse</Button>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="py-24 lg:py-32 relative z-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left Column */}
              <div className="text-center lg:text-left">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
                  Asesoramiento Legal <span className="text-blue-600 dark:text-blue-400">Impulsado por IA</span>
                </h1>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
                  Obtén respuestas rápidas y precisas a tus preguntas legales con la inteligencia artificial más avanzada.
                </p>
                <div className="flex justify-center lg:justify-start">
                  <Card className="w-full max-w-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
                    <CardContent className="p-6">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        ¿En qué podemos ayudarte?
                      </h2>
                      <Input 
                        type="text" 
                        placeholder="Describe tu consulta legal" 
                        value={consultation}
                        onChange={handleInputChange}
                        className="mb-4" 
                      />
                      <Button 
                        className="w-full"
                        onClick={handleStartConsultation}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Procesando...</span>
                          </div>
                        ) : (
                          "Iniciar Consulta"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right Column */}
              <div className="hidden lg:block">
                <img 
                  src="/hero-image.svg" 
                  alt="Asesoramiento Legal con IA" 
                  className="rounded-lg shadow-xl" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 relative z-10">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-semibold text-center text-gray-900 dark:text-white mb-8">
              ¿Por qué elegir klamAI?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 mb-4">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Confidencialidad Garantizada
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Tus datos están seguros y protegidos con encriptación de última generación.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Acceso 24/7
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Disponible para resolver tus dudas legales en cualquier momento y lugar.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 mb-4">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Respuestas Inmediatas
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Obtén respuestas a tus preguntas legales en segundos, sin esperas.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 mb-4">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Información Verificada
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Nuestra IA se basa en fuentes legales confiables y actualizadas.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 mb-4">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Soporte Personalizado
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Recibe asesoramiento adaptado a tu situación legal específica.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 mb-4">
                  <Gavel className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Amplio Conocimiento Legal
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Desde derecho civil hasta penal, nuestra IA cubre diversas áreas legales.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 relative z-10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-6">
              ¿Listo para empezar?
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              Describe tu consulta legal y obtén asesoramiento inmediato.
            </p>
            <div className="flex justify-center">
              <Card className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
                <CardContent className="p-6">
                  <Input 
                    type="text" 
                    placeholder="Describe tu consulta legal" 
                    value={consultation}
                    onChange={handleInputChange}
                    className="mb-4" 
                  />
                  <Button 
                    className="w-full"
                    onClick={handleStartConsultation}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Procesando...</span>
                      </div>
                    ) : (
                      "Iniciar Consulta"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Legal Footer */}
        <footer className="relative z-10 bg-gray-800 dark:bg-gray-900 text-white py-4 px-4">
          <div className="flex items-center justify-center text-sm">
            <p className="text-center">
              Al enviar un mensaje a VitorIA, aceptas nuestras{" "}
              <a 
                href="/aviso-legal" 
                className="text-blue-400 hover:text-blue-300 underline transition-colors"
              >
                condiciones
              </a>
              {" "}y confirmas que has leído nuestra{" "}
              <a 
                href="/politicas-privacidad" 
                className="text-blue-400 hover:text-blue-300 underline transition-colors"
              >
                política de privacidad
              </a>
              .
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
