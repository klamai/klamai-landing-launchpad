
import { useState, useEffect } from "react";
import { Moon, Sun, Scale, Zap, Shield, Users, MessageCircle, Phone, Mail, MapPin, ArrowRight, ChevronRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

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

// Mobile-optimized variants with faster animations
const mobileTransitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      y: 4
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'tween' as const,
        duration: 0.3
      }
    }
  }
};

const Index = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [consultation, setConsultation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuState, setMenuState] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize(); // Check initial screen size
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultation.trim()) return;
    setIsSubmitting(true);
    
    // Guardar el texto de consulta en localStorage antes de redirigir
    localStorage.setItem('userConsultation', consultation.trim());
    
    // Redirect to chat page
    setTimeout(() => {
      navigate('/chat');
    }, 500);
  };

  const handleLogoClick = () => {
    // If already on home page, scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Use mobile variants if on mobile device
  const currentVariants = isMobile ? mobileTransitionVariants : transitionVariants;

  return <div className={`min-h-screen transition-all duration-300 font-sans ${darkMode ? 'dark' : ''}`}>
      <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800">
        {/* Header */}
        <header>
          <nav data-state={menuState && 'active'} className="fixed z-20 w-full px-2 group">
            <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-white/80 dark:bg-gray-800/80 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5')}>
              <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                <div className="flex w-full justify-between lg:w-auto">
                  <button 
                    onClick={handleLogoClick}
                    className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
                  >
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
                  <Button variant="ghost" size="sm" className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700">
                    Login
                  </Button>
                  <Button size="sm" className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-300 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200">
                    Sign Up
                  </Button>
                </div>

                {/* Mobile menu */}
                <div className="bg-background group-data-[state=active]:block hidden w-full p-4 rounded-2xl border shadow-lg mt-4 lg:hidden">
                  <div className="flex flex-col gap-3 w-full">
                    <Button variant="ghost" size="sm" className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 w-full justify-center">
                      Login
                    </Button>
                    <Button size="sm" className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-300 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 w-full">
                      Sign Up
                    </Button>
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
                          staggerChildren: isMobile ? 0.05 : 0.1,
                          delayChildren: isMobile ? 0 : 0.1
                        }
                      }
                    },
                    item: currentVariants.item
                  }}>
                    <div className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950">
                      <span className="text-foreground text-sm">🚀 Tecnología IA Avanzada para Asesoramiento Legal</span>
                      <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>
                      <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                        <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                          <span className="flex size-6">
                            <ArrowRight className="m-auto size-3" />
                          </span>
                          <span className="flex size-6">
                            <ArrowRight className="m-auto size-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                
                    <h1 className="mt-8 max-w-4xl mx-auto text-balance text-4xl sm:text-5xl md:text-6xl lg:text-7xl lg:mt-16 xl:text-[5.25rem] font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
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
                        <Zap className="h-4 w-4" />
                        <span>Atención Virtual en toda España</span>
                      </div>
                    </div>
                  </AnimatedGroup>

                  {/* Consultation Form */}
                  <AnimatedGroup variants={{
                  container: {
                    visible: {
                      transition: {
                        staggerChildren: isMobile ? 0.02 : 0.05,
                        delayChildren: isMobile ? 0.1 : 0.3
                      }
                    }
                  },
                  item: currentVariants.item
                }} className="mt-12">
                    <div className="max-w-2xl mx-auto">
                      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border-2 border-blue-200 dark:border-blue-500/30 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-900/20 dark:to-cyan-900/20 animate-pulse"></div>
                        <div className="relative z-10">
                          <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-4 animate-bounce">
                              <MessageCircle className="h-8 w-8 text-white" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                              🚀 ¡Cuéntanos tu caso ahora!
                            </h2>
                            <p className="text-lg text-blue-600 dark:text-blue-400 font-semibold">
                              VitorIA te responderá al instante
                            </p>
                          </div>

                          <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                              <label htmlFor="consultation" className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                ✍️ Describe tu situación legal aquí
                              </label>
                              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
                                💡 <strong>Tip:</strong> Cuanto más detalles proporciones, mejor podrá ayudarte VitorIA
                              </p>
                              <div className="relative">
                                <Textarea id="consultation" placeholder="Ejemplo: Tuve un accidente de tráfico la semana pasada y el otro conductor no tenía seguro. Qué opciones legales tengo para recuperar los gastos médicos y reparaciones" value={consultation} onChange={e => setConsultation(e.target.value)} className="min-h-40 text-base resize-none border-2 border-blue-300 dark:border-blue-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl font-medium bg-white/80 dark:bg-gray-900/80 shadow-inner dark:placeholder:text-opacity-30 placeholder:text-opacity-30 placeholder:text-gray-500 dark:placeholder:text-gray-400" required />
                                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                                  {consultation.length}/500 caracteres
                                </div>
                              </div>
                            </div>
                            <Button type="submit" disabled={isSubmitting || !consultation.trim()} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-6 px-8 rounded-xl text-lg sm:text-xl shadow-2xl transform transition-all duration-200 hover:scale-105 hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                              {isSubmitting ? <div className="flex items-center justify-center gap-2 sm:gap-3 relative z-10">
                                  <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white"></div>
                                  <span className="text-sm sm:text-base">Conectando con VitorIA...</span>
                                </div> : <div className="flex items-center justify-center gap-2 sm:gap-3 relative z-10">
                                  <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                                  <span className="text-sm sm:text-base">Consultar con VitorIA GRATIS</span>
                                </div>}
                            </Button>
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
                              🔒 Tu consulta es <strong>100% confidential</strong> y sin compromiso
                            </p>
                          </form>
                        </div>
                      </div>
                    </div>
                  </AnimatedGroup>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-16 md:py-32">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-3 gap-8 mb-20">
                <div className="text-center p-8 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Tecnología IA Avanzada</h3>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">Utilizamos las últimas herramientas de inteligencia artificial para brindarte el mejor asesoramiento legal.</p>
                </div>

                <div className="text-center p-8 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Seguridad Garantizada</h3>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">Tus datos y consultas están protegidos con los más altos estándares de seguridad y confidencialidad.</p>
                </div>

                <div className="text-center p-8 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Especialistas Expertos</h3>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">Nuestro equipo de abogados especialistas está disponible para resolver tus consultas más complejas.</p>
                </div>
              </div>

              {/* Contact Section */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-8 md:p-12 text-white text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">¿Necesitas contacto directo?</h2>
                <p className="text-xl mb-8 opacity-90 font-medium">Estamos aquí para ayudarte en Valencia y toda España</p>
                <div className="flex flex-wrap justify-center gap-8 text-lg font-medium">
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    <span>632 018 899</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    <span>contacto@klamai.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span>Valencia, España</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 font-medium">
          <p>&copy; 2024 klamAI. Todos los derechos reservados. | Asesoramiento jurídico con IA en España</p>
        </footer>
      </div>
    </div>;
};

export default Index;
