
import { useState, useEffect } from "react";
import { Moon, Sun, ArrowRight, MessageSquare, Users, Shield, CheckCircle, Scale, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [darkMode, setDarkMode] = useState(() => {
    // Inicializar desde localStorage o sistema
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [consultation, setConsultation] = useState("");
  const [menuState, setMenuState] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    // Guardar en localStorage
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    // Aplicar inmediatamente
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Aplicar tema inicial
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStartConsultation = async () => {
    if (!consultation.trim()) {
      toast({
        title: "Por favor, describe tu consulta",
        description: "Necesitas escribir tu consulta legal para continuar",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let casoId = "";
      
      if (user) {
        // Usuario autenticado: crear caso en base de datos
        const { data, error } = await supabase
          .from('casos')
          .insert({
            cliente_id: user.id,
            motivo_consulta: consultation,
            estado: 'borrador',
            canal_atencion: 'web_chat'
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating case:', error);
          toast({
            title: "Error",
            description: "No se pudo crear el caso, pero puedes continuar con la consulta",
            variant: "destructive",
          });
        } else {
          casoId = data.id;
        }
      }

      // Guardar en localStorage para el chat
      localStorage.setItem('userConsultation', consultation);
      if (casoId) {
        localStorage.setItem('casoId', casoId);
      }

      // Navegar al chat
      navigate('/chat');
    } catch (error) {
      console.error('Error starting consultation:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al iniciar la consulta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-300 font-sans ${darkMode ? 'dark' : ''}`}>
      <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800">
        {/* Animated Background */}
        <AnimatedBackground darkMode={darkMode} />
        
        {/* Header */}
        <header>
          <nav data-state={menuState && 'active'} className="fixed z-20 w-full px-2 group">
            <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-white/80 dark:bg-gray-800/80 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5')}>
              <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                <div className="flex w-full justify-between lg:w-auto">
                  <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                    <Scale className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">klamAI</span>
                  </Link>

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

                <div className="hidden lg:flex items-center gap-6">
                  <Button onClick={toggleDarkMode} variant="outline" size="icon" className="rounded-full">
                    {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                  {user ? (
                    <Button asChild className="rounded-full">
                      <Link to="/dashboard">Dashboard</Link>
                    </Button>
                  ) : (
                    <Button asChild className="rounded-full">
                      <Link to="/auth">Iniciar Sesión</Link>
                    </Button>
                  )}
                </div>

                {/* Mobile menu */}
                <div className="bg-background group-data-[state=active]:block hidden w-full p-4 rounded-2xl border shadow-lg mt-4 lg:hidden">
                  <div className="flex flex-col gap-3 w-full">
                    {user ? (
                      <Button asChild className="w-full justify-center">
                        <Link to="/dashboard">Dashboard</Link>
                      </Button>
                    ) : (
                      <Button asChild className="w-full justify-center">
                        <Link to="/auth">Iniciar Sesión</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                Tu Abogado IA
                <span className="block text-blue-600 dark:text-blue-400">Disponible 24/7</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Obtén asesoramiento legal inteligente al instante. Consulta tus dudas legales y recibe respuestas precisas de nuestra IA especializada.
              </p>
            </div>

            {/* Consultation Input */}
            <div className="max-w-2xl mx-auto mb-16">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Describe tu consulta legal aquí..."
                  value={consultation}
                  onChange={(e) => setConsultation(e.target.value)}
                  className="w-full h-14 text-lg px-6 pr-32 rounded-2xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 shadow-lg dark:bg-gray-800/50 backdrop-blur-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleStartConsultation();
                    }
                  }}
                />
                <Button 
                  onClick={handleStartConsultation}
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Consultar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                ¿Por qué elegir klamAI?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Combina la experiencia legal con la tecnología más avanzada para brindarte el mejor servicio.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <MessageSquare className="h-12 w-12 text-blue-600 dark:text-blue-400" />,
                  title: "Respuestas Inmediatas",
                  description: "Obtén asesoramiento legal al instante, sin esperas ni citas previas.",
                },
                {
                  icon: <Users className="h-12 w-12 text-green-600 dark:text-green-400" />,
                  title: "Abogados Especializados",
                  description: "Conecta con abogados expertos para casos que requieren atención humana.",
                },
                {
                  icon: <Shield className="h-12 w-12 text-purple-600 dark:text-purple-400" />,
                  title: "100% Confidencial",
                  description: "Tus consultas están protegidas con los más altos estándares de seguridad.",
                },
              ].map((feature, index) => (
                <div key={index} className="text-center p-8 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-12 border border-gray-200 dark:border-gray-700 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                ¿Listo para resolver tus dudas legales?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Únete a miles de usuarios que ya confían en klamAI para sus consultas legales.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="rounded-full px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600" onClick={handleStartConsultation}>
                  Hacer mi primera consulta
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                {!user && (
                  <Button variant="outline" size="lg" asChild className="rounded-full px-8 py-4 text-lg border-2">
                    <Link to="/auth">Crear cuenta gratis</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 dark:bg-black text-white">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-3 mb-8">
              <Scale className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold">klamAI</span>
            </div>
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <Link to="/politicas-privacidad" className="text-gray-300 hover:text-white transition-colors">
                Política de Privacidad
              </Link>
              <Link to="/aviso-legal" className="text-gray-300 hover:text-white transition-colors">
                Aviso Legal
              </Link>
            </div>
            <p className="text-gray-400">
              © 2024 klamAI. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
