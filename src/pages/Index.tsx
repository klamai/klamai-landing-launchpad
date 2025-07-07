import { useState, useEffect } from "react";
import { Moon, Sun, Scale, MapPin, ArrowRight, ChevronRight, Menu, X, MessageCircle, Zap, Phone, Mail, Sparkles, Clock, Users2, Shield, ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { Testimonial } from "@/components/ui/testimonial-card";
import { FeaturesSectionWithHoverEffects } from "@/components/ui/feature-section-with-hover-effects";
import { FooterSection } from "@/components/ui/footer-section";
import { PromptInput, PromptInputTextarea, PromptInputActions, PromptInputAction } from "@/components/ui/prompt-input";
import { cn } from "@/lib/utils";
import { useNavigate, Link } from "react-router-dom";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import SignOutButton from "@/components/SignOutButton";
const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(6px)',
      y: 8
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring' as const,
        bounce: 0.2,
        duration: 0.8
      }
    }
  }
};
const testimonials = [{
  name: "María González",
  role: "Empresaria",
  company: "Valencia Tech",
  rating: 5,
  image: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=150&h=150&fit=crop&crop=face",
  testimonial: "VitorIA me ayudó a resolver un problema laboral complejo en minutos. El asesoramiento fue preciso y me conectó con el abogado perfecto para mi caso. ¡Increíble servicio!"
}, {
  name: "Carlos Martín",
  role: "Autónomo",
  company: "Madrid",
  rating: 5,
  image: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=150&h=150&fit=crop&crop=face",
  testimonial: "Necesitaba asesoramiento urgente sobre contratos y klamAI me dio respuestas inmediatas. La plataforma es intuitiva y los especialistas muy profesionales."
}, {
  name: "Ana Rodríguez",
  role: "Directora",
  company: "Barcelona Solutions",
  rating: 5,
  image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&h=150&fit=crop&crop=face",
  testimonial: "Como directora de empresa, valoro la rapidez y precisión. VitorIA superó mis expectativas y me ahorró tiempo y dinero en consultas legales."
}];
const frequentQuestions = ["Quiero vender mi casa, cuál es el proceso legal?", "Cómo proteger la propiedad intelectual de mi negocio?", "Puedo modificar el acuerdo de custodia de mis hijos?", "Qué hacer si recibo una demanda por accidente de tráfico?", "Cómo resolver una disputa contractual con un proveedor?", "Qué pasos seguir si quiero divorciarme?"];
const Index = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [consultation, setConsultation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuState, setMenuState] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    user,
    loading
  } = useAuth();

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
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const handleLogoClick = () => {
    // If already on home page, scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const handleSubmit = async () => {
    if (!consultation.trim()) return;
    setIsSubmitting(true);
    try {
      // 1. Crear caso borrador en Supabase
      const {
        data,
        error
      } = await supabase.functions.invoke('crear-borrador-caso');
      if (error) {
        console.error('Error al crear caso borrador:', error);
        toast({
          title: "Error",
          description: "No se pudo procesar tu consulta. Por favor, inténtalo de nuevo.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      const casoId = data?.caso_id;
      if (!casoId) {
        console.error('No se recibió caso_id de la función');
        toast({
          title: "Error",
          description: "No se pudo procesar tu consulta. Por favor, inténtalo de nuevo.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // 2. Guardar tanto la consulta como el caso_id en localStorage
      localStorage.setItem('userConsultation', consultation.trim());
      localStorage.setItem('casoId', casoId);
      console.log('Caso creado con ID:', casoId);
      console.log('Consulta guardada:', consultation.trim());

      // 3. Redirigir al chat
      setTimeout(() => {
        navigate('/chat');
      }, 500);
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };
  const handleValueChange = (value: string) => {
    setConsultation(value);
  };
  const handleFrequentQuestion = (question: string) => {
    setConsultation(question);
  };
  return <div className={`min-h-screen transition-all duration-300 font-sans ${darkMode ? 'dark' : ''}`}>
      <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800">
        {/* Header */}
        <header>
          <nav data-state={menuState && 'active'} className="fixed z-20 w-full px-2 group">
            <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-white/80 dark:bg-gray-800/80 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5')}>
              <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                <div className="flex w-full justify-between lg:w-auto">
                  <button onClick={handleLogoClick} className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
                    <Scale className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">klamAI</span>
                  </button>

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
                  
                  {!loading && <>
                      {user ? <div className="flex items-center gap-4">
                          <Link to="/dashboard">
                            <Button variant="ghost" size="sm" className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200">
                              Dashboard
                            </Button>
                          </Link>
                          <SignOutButton />
                        </div> : <>
                          <Link to="/auth">
                            <Button variant="ghost" size="sm" className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700">
                              Iniciar Sesión
                            </Button>
                          </Link>
                          <Link to="/auth">
                            <Button size="sm" className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-300 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200">
                              Registrarse
                            </Button>
                          </Link>
                        </>}
                    </>}
                </div>

                {/* Mobile menu */}
                <div className="bg-background group-data-[state=active]:block hidden w-full p-4 rounded-2xl border shadow-lg mt-4 lg:hidden">
                  <div className="flex flex-col gap-3 w-full">
                    {!loading && <>
                        {user ? <>
                            <Link to="/dashboard">
                              <Button variant="ghost" size="sm" className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 w-full justify-center">
                                Dashboard
                              </Button>
                            </Link>
                            <SignOutButton className="w-full justify-center" />
                          </> : <>
                            <Link to="/auth">
                              <Button variant="ghost" size="sm" className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 w-full justify-center">
                                Iniciar Sesión
                              </Button>
                            </Link>
                            <Link to="/auth">
                              <Button size="sm" className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-300 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 w-full">
                                Registrarse
                              </Button>
                            </Link>
                          </>}
                      </>}
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="overflow-hidden">
          <div aria-hidden className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block">
            <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(220,84%,65%,.08)_0,hsla(220,84%,55%,.02)_50%,hsla(220,84%,45%,0)_80%)]" />
            <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(220,84%,65%,.06)_0,hsla(220,84%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          </div>
          
          <section>
            <div className="relative pt-24 md:pt-36">
              <div aria-hidden className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]" />
              <div className="mx-auto max-w-7xl px-6">
                <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                  <AnimatedGroup variants={{
                  container: {
                    visible: {
                      transition: {
                        staggerChildren: 0.1,
                        delayChildren: 0.1
                      }
                    }
                  },
                  item: transitionVariants.item
                }}>
                    
                
                    <h1 className="mt-8 max-w-4xl mx-auto text-balance text-5xl sm:text-5xl md:text-6xl lg:text-7xl lg:mt-16 xl:text-[5.25rem] font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
                      Recibe asesoramiento jurídico
                      <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"> de especialistas</span>
                    </h1>
                    <p className="mx-auto mt-8 max-w-2xl text-balance text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                      Resuelve tus consultas legales con <span className="font-semibold text-blue-700 dark:text-blue-300">VitorIA</span>, nuestro asistente inteligente, y conecta con abogados especialistas. Rápido, seguro y eficiente.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400 font-medium mt-6">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>Valencia, España</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Atención Virtual 24/7</span>
                      </div>
                    </div>
                  </AnimatedGroup>

                  {/* Modern Google-style Search Bar */}
                  <AnimatedGroup variants={{
                  container: {
                    visible: {
                      transition: {
                        staggerChildren: 0.05,
                        delayChildren: 0.3
                      }
                    }
                  },
                  item: {
                    hidden: {
                      opacity: 0,
                      filter: 'blur(6px)',
                      y: 8
                    },
                    visible: {
                      opacity: 1,
                      filter: 'blur(0px)',
                      y: 0,
                      transition: {
                        type: 'spring' as const,
                        bounce: 0.2,
                        duration: 0.8
                      }
                    }
                  }
                }} className="mt-16">
                    <div className="max-w-4xl mx-auto">
                      {/* Main Search Bar */}
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                        <div className="relative bg-white dark:bg-gray-900 rounded-full shadow-2xl border border-gray-200 dark:border-gray-700 hover:shadow-3xl transition-all duration-300 group-hover:border-blue-300 dark:group-hover:border-blue-600">
                          <div className="flex items-center p-2">
                            <div className="flex items-center justify-center w-12 h-12 text-blue-600 dark:text-blue-400 ml-2">
                              <MessageCircle className="h-6 w-6" />
                            </div>
                            <input
                              type="text"
                              value={consultation}
                              onChange={(e) => setConsultation(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSubmit();
                                }
                              }}
                              placeholder="Describe tu situación legal - Ej: Tengo una disputa contractual..."
                              className="flex-1 px-4 py-4 text-lg bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                              disabled={isSubmitting}
                            />
                            <div className="flex items-center gap-2 mr-2">
                              {consultation.trim() && (
                                <div className="text-xs text-gray-400 mr-2">
                                  {consultation.length}/500
                                </div>
                              )}
                              <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !consultation.trim()}
                                className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                              >
                                {isSubmitting ? (
                                  <Square className="h-5 w-5 animate-pulse" />
                                ) : (
                                  <ArrowRight className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Subtitle */}
                      <div className="text-center mt-6">
                        <p className="text-gray-600 dark:text-gray-300 text-lg">
                          <Sparkles className="inline h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                          VitorIA te responderá al instante
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          <Shield className="inline h-4 w-4 mr-1" />
                          100% confidencial y sin compromiso
                        </p>
                      </div>

                      {/* Quick suggestions */}
                      <div className="mt-8">
                        <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-4">Consultas populares:</p>
                        <div className="flex flex-wrap justify-center gap-3">
                          {frequentQuestions.slice(0, 4).map((question, index) => (
                            <button
                              key={index}
                              onClick={() => setConsultation(question)}
                              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                            >
                              {question.length > 50 ? question.slice(0, 50) + '...' : question}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AnimatedGroup>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-16 md:py-32" id="features">
            <div className="container mx-auto px-4">
              <div className="mb-20">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    ¿Por qué elegir klamAI?
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 font-medium max-w-2xl mx-auto">
                    Descubre las ventajas de nuestro servicio de asesoramiento jurídico con tecnología IA
                  </p>
                </div>
                <FeaturesSectionWithHoverEffects />
              </div>

              {/* Testimonials Section */}
              <div className="mb-20" id="testimonials">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-3">
                    <Users2 className="h-8 w-8" />
                    Lo que dicen nuestros clientes
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 font-medium max-w-2xl mx-auto">
                    Miles de personas ya confían en <span className="font-semibold text-blue-700 dark:text-blue-300">VitorIA</span> para resolver sus consultas legales
                  </p>
                </div>
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {testimonials.map(testimonial => <Testimonial key={testimonial.name} {...testimonial} />)}
                </div>
              </div>

              {/* Contact Section */}
              
            </div>
          </section>
        </main>

        {/* New Footer */}
        <FooterSection darkMode={darkMode} onDarkModeToggle={toggleDarkMode} />
      </div>
    </div>;
};
export default Index;