import { useState, useEffect, useRef } from "react";
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
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [consultation]);

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
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleSubmit = async () => {
    if (!consultation.trim()) return;
    setIsSubmitting(true);
    
    try {
      // 1. Generate session token for security
      const sessionToken = crypto.randomUUID();
      
      // 2. Create draft case in Supabase
      const { data, error } = await supabase.functions.invoke('crear-borrador-caso', {
        body: {
          motivo_consulta: consultation.trim(),
          session_token: sessionToken
        }
      });

      if (error) {
        console.error('Error creating draft case:', error);
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
        console.error('No caso_id received from function');
        toast({
          title: "Error",
          description: "No se pudo procesar tu consulta. Por favor, inténtalo de nuevo.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // 3. Save essential data for immediate Typebot loading
      localStorage.setItem('userConsultation', consultation.trim());
      localStorage.setItem('casoId', casoId);
      localStorage.setItem('current_session_token', sessionToken);
      
      console.log('Case created with ID:', casoId);
      console.log('Consultation saved:', consultation.trim());

      // 4. Navigate immediately - no delay
      navigate('/chat');
      
    } catch (error) {
      console.error('Error in handleSubmit:', error);
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

  return (
    <div className={`min-h-screen transition-all duration-300 font-sans ${darkMode ? 'dark' : ''}`}>
      <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800">
        {/* Header */}
        <header>
          <nav data-state={menuState && 'active'} className="fixed z-20 w-full px-2 group">
            <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-white/80 dark:bg-gray-800/80 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5')}>
              <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                <div className="flex w-full justify-between lg:w-auto">
                <button onClick={handleLogoClick} className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
  <img src="/logo.svg" alt="klamAI Logo" className="h-8" />
                      <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">KlamAI</span>

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
                  
                  {!loading && (
                    <>
                      {user ? (
                        <div className="flex items-center gap-4">
                          <Link to="/dashboard">
                            <Button variant="ghost" size="sm" className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200">
                              Dashboard
                            </Button>
                          </Link>
                          <SignOutButton />
                        </div>
                      ) : (
                        <>
                          <Link to="/auth">
                            <Button variant="ghost" size="sm" className=" text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 dark:bg-black-800 dark:hover:bg-black">
                              Iniciar Sesión
                            </Button>
                          </Link>
                          <Link to="/auth">
                            <Button size="sm" className="bg-black text-white hover:bg-gray-100 hover:text-black border border-gray-300 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200">
                              Registrarse
                            </Button>
                          </Link>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Mobile menu */}
                <div className="bg-background group-data-[state=active]:block hidden w-full p-4 rounded-2xl border shadow-lg mt-4 lg:hidden">
                  <div className="flex flex-col gap-3 w-full">
                    {!loading && (
                      <>
                        {user ? (
                          <>
                            <Link to="/dashboard">
                              <Button variant="ghost" size="sm" className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 w-full justify-center">
                                Dashboard
                              </Button>
                            </Link>
                            <SignOutButton className="w-full justify-center" />
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
                      </>
                    )}
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
                    
                    <h1 className="mt-6  max-w-6xl mx-auto text-balance text-4xl sm:text-5xl md:text-6xl lg:text-7xl lg:mt-16 xl:text-[5.25rem] font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
                      Recibe asesoramiento jurídico
                      <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"> de abogados especialistas</span>
                    </h1>

                    {/* Modern Google-style Search Bar - Principal - MOVED UP */}
                    <div className="mt-14 sm:mt-20 max-w-4xl mx-auto px-4 sm:px-0">
                      {/* Main Search Bar with Enhanced Effects */}
                      <div className="relative group">
                        {/* Floating particles background */}
                        <div className="absolute -inset-4 opacity-30">
                          <div className="absolute top-2 left-4 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <div className="absolute top-8 right-8 w-1 h-1 bg-cyan-400 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                          <div className="absolute bottom-4 left-12 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                          <div className="absolute bottom-8 right-4 w-1 h-1 bg-blue-300 rounded-full animate-ping" style={{animationDelay: '1.5s'}}></div>
                        </div>
                        
                        {/* Gradient breathing border */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500 animate-pulse"></div>
                        <div className="absolute -inset-2 bg-gradient-to-r from-cyan-100 via-blue-600 to-purple-600 rounded-full blur-sm opacity-10 group-hover:opacity-20 transition duration-700" style={{animation: 'pulse 3s ease-in-out infinite'}}></div>
                        
                        <div className="relative bg-white dark:bg-gray-200 rounded-full shadow-2xl border border-gray-200 dark:border-gray-700 hover:shadow-3xl transition-all duration-500 group-hover:border-blue-300 dark:group-hover:border-blue-600 group-hover:scale-[1.02]">
                          <div className="flex items-center p-1.5 sm:p-2">
                            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 text-blue-600 dark:text-blue-400 ml-1 sm:ml-2 flex-shrink-0">
                              <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <input
                              type="text"
                              maxLength={500}
                              value={consultation}
                              onChange={(e) => setConsultation(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSubmit();
                                }
                              }}
                              placeholder="Escribe tu Consulta Legal Aqui..."
                              className="flex-1 px-2 sm:px-4 py-3 sm:py-4 text-base sm:text-lg bg-transparent border-none outline-none text-gray-900 dark:text-gray-900 placeholder-gray-500 dark:placeholder-gray-500 min-w-0"
                              disabled={isSubmitting}
                            />
                            <div className="flex items-center gap-1 sm:gap-2 mr-1 sm:mr-2 flex-shrink-0">
                              {consultation.trim() && (
                                <div className="hidden sm:block text-xs text-gray-400">
                                  {consultation.length}/500
                                </div>
                              )}
                              <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !consultation.trim()}
                                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 group-hover:shadow-blue-500/25"
                              >
                                {isSubmitting ? (
                                  <Square className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
                                ) : (
                                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {consultation.trim() && (
                        <div className="sm:hidden text-xs text-gray-400 animate-fade-in">
                          {consultation.length}/500 caracteres
                        </div>
                      )}
                      
                      {/* Quick suggestions - Enhanced - MOVED CLOSER TO INPUT */}
                      <div className="mt-12 sm:mt-16">
                        <p className="text-center text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-4 sm:mb-6 flex items-center justify-center gap-2">
                          <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                          Consultas populares:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {frequentQuestions.slice(0, 4).map((question, index) => (
                            <button
                              key={index}
                              onClick={() => setConsultation(question)}
                              className="px-5 sm:px-6 py-4 sm:py-5 bg-gray-100 dark:bg-gray-800/60 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-2xl text-sm sm:text-base text-white-700 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-300 border border-gray-200 dark:border-blue-500/30 hover:border-blue-300 dark:hover:border-blue-600 text-left hover:scale-105 hover:shadow-lg min-h-[48px] sm:min-h-[56px]"
                            >
                              {question.length > (window.innerWidth < 640 ? 95 : 60) ? 
                                question.slice(0, window.innerWidth < 640 ? 45 : 60) + '...' : 
                                question}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* AI Status and Character Count - Enhanced - MOVED AFTER SUGGESTIONS */}
                      <div className="text-center mt-6 sm:mt-8 space-y-2 sm:space-y-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-700">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">VitorIA está activo</span>
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">
                          <Sparkles className="inline h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600 dark:text-blue-400 animate-pulse" />
                          Respuesta instantánea e inteligente
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          <Shield className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          100% confidencial y sin compromiso
                        </p>
                      </div>
                    </div>

                    <p className="mx-auto mt-8 max-w-10xl text-balance text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                      Resuelve tus consultas legales con <span className="font-semibold text-blue-700 dark:text-blue-300">VitorIA</span>, nuestro asistente inteligente, y conecta con abogados especialistas. Rápido, seguro y eficiente.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400 font-medium mt-4">
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
            </div>
          </section>
        </main>

        {/* New Footer */}
        <FooterSection darkMode={darkMode} onDarkModeToggle={toggleDarkMode} />
      </div>
    </div>
  );
};

export default Index;
