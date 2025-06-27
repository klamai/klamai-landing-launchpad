import { useState, useEffect } from "react";
import { Moon, Sun, Scale, MapPin, ArrowRight, ChevronRight, Menu, X, MessageCircle, Zap, Phone, Mail, Sparkles, Clock, Users2, Shield, ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { Testimonial } from "@/components/ui/testimonial-card";
import { FeaturesSectionWithHoverEffects } from "@/components/ui/feature-section-with-hover-effects";
import { FooterSection } from "@/components/ui/footer-section";
import { PromptInput, PromptInputTextarea, PromptInputActions, PromptInputAction } from "@/components/ui/prompt-input";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { ShimmerButton } from "@/components/ui/shimmer-button";

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

const Index = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [consultation, setConsultation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuState, setMenuState] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
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

    // Guardar el texto de consulta en localStorage antes de redirigir
    localStorage.setItem('userConsultation', consultation.trim());

    // Redirect to chat page
    setTimeout(() => {
      navigate('/chat');
    }, 500);
  };

  const handleValueChange = (value: string) => {
    setConsultation(value);
  };

  const handleFrequentQuestion = (question: string) => {
    setConsultation(question);
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

  const frequentQuestions = [
    "Quiero vender mi casa, cuál es el proceso legal?",
    "Cómo proteger la propiedad intelectual de mi negocio?",
    "Puedo modificar el acuerdo de custodia de mis hijos?",
    "Qué hacer si recibo una demanda por accidente de tráfico?",
    "Cómo resolver una disputa contractual con un proveedor?",
    "Qué pasos seguir si quiero divorciarme?"
];

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
                        staggerChildren: 0.1,
                        delayChildren: 0.1
                      }
                    }
                  },
                  item: transitionVariants.item
                }}>
                    <div className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950">
                      <span className="text-foreground text-sm">
                        <Sparkles className="inline h-4 w-4 mr-2" />
                        Tecnología IA Avanzada para Asesoramiento Legal
                      </span>
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

                  {/* New Consultation Form */}
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
                              <Sparkles className="inline h-6 w-6 mr-2" />
                              ¡Cuéntanos tu caso ahora!
                            </h2>
                            <p className="text-lg text-blue-600 dark:text-blue-400 font-semibold">
                              VitorIA te responderá al instante
                            </p>
                          </div>

                          <div className="space-y-6">
                            <div className="space-y-4">
                              <label htmlFor="consultation" className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <MessageCircle className="h-5 w-5" />
                                Describe tu situación legal aquí
                              </label>
                              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
                                <Zap className="inline h-4 w-4 mr-2" />
                                <strong>Tip:</strong> Cuanto más detalles proporciones, mejor podrá ayudarte VitorIA
                              </p>
                              
                              <PromptInput
                                value={consultation}
                                onValueChange={handleValueChange}
                                isLoading={isSubmitting}
                                onSubmit={handleSubmit}
                                className="w-full border-2 border-blue-300 dark:border-blue-600 focus-within:border-blue-500 dark:focus-within:border-blue-400 bg-white/80 dark:bg-gray-900/80 shadow-inner"
                              >
                                <PromptInputTextarea 
                                  placeholder="Ejemplo: Tengo una propiedad en disputa con un familiar. Cuáles son mis opciones legales para resolver esto?"
                                  className="min-h-32 text-base font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 placeholder:opacity-70"
                                />
                                <PromptInputActions className="justify-end pt-2">
                                  <PromptInputAction
                                    tooltip={isSubmitting ? "Conectando con VitorIA..." : "Consultar con VitorIA GRATIS"}
                                  >
                                    
                                  </PromptInputAction>
                                </PromptInputActions>
                              </PromptInput>
                              
                              <div className="text-right text-xs text-gray-400">
                                {consultation.length}/500 caracteres
                              </div>
                            </div>
                            {/* Botón centrado fuera del cuadro */}
                      <div className="mt-8 flex justify-center">
                        <ShimmerButton
                          onClick={handleSubmit}
                          disabled={isSubmitting || !consultation.trim()}
                          background="linear-gradient(45deg, #2563eb, #06b6d4)"
                          shimmerColor="#ffffff"
                          shimmerDuration="2s"
                          borderRadius="50px"
                          className={cn(
                            "h-14 px-8 text-white dark:text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300",
                            !consultation.trim() ? "opacity-50" : "opacity-100"
                          )}
                        >
                          {isSubmitting ? (
                            <div className="flex items-center gap-3">
                              <Square className="size-5 fill-current animate-pulse" />
                              <span>Conectando con VitorIA...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <MessageCircle className="size-5" />
                              <span>Consultar con VitorIA GRATIS</span>
                            </div>
                          )}
                        </ShimmerButton>
                      </div>
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
                              <Shield className="inline h-4 w-4 mr-2" />
                              Tu consulta es <strong>100% confidencial</strong> y sin compromiso
                            </p>
                          </div>
                        </div>
                      </div>

                      

                      {/* Frequent Questions */}
                      <div className="mt-8">
                        <h3 className="text-center text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Consultas frecuentes
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {frequentQuestions.map((question, index) => (
                            <button
                              key={index}
                              onClick={() => handleFrequentQuestion(question)}
                              className="text-left p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-blue-200/50 dark:border-blue-500/30 hover:bg-blue-50/80 dark:hover:bg-blue-900/40 hover:border-blue-300 dark:hover:border-blue-400 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300"
                            >
                              {question}
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
