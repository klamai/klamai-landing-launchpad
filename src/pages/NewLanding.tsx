import { useState, useEffect } from "react";
import {
  Moon,
  Sun,
  Scale,
  MapPin,
  ArrowRight,
  ChevronRight,
  Menu,
  X,
  MessageCircle,
  Zap,
  Phone,
  Mail,
  Sparkles,
  Clock,
  Users2,
  Shield,
  Square,
  Briefcase,
  Gavel,
  Award,
  BookOpen,
  User,
  CheckCircle,
  Star,
  Heart,
  Lightbulb,
  Target,
  TrendingUp,
  FileText,
  Calendar,
  HeadphonesIcon,
  Globe,
  Play,
  Youtube
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { Testimonial } from "@/components/ui/testimonial-card";
import { PromptInput, PromptInputTextarea, PromptInputActions, PromptInputAction } from "@/components/ui/prompt-input";
import { cn } from "@/lib/utils";
import { useNavigate, Link } from "react-router-dom";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import SignOutButton from "@/components/SignOutButton";
import { SecureLogger } from '@/utils/secureLogging';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ConsentCheckbox } from "@/components/shared/ConsentCheckbox";

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

const testimonials = [
  {
    name: "María González",
    role: "Emprendedora",
    company: "Tech Startup",
    rating: 5,
    image: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=150&h=150&fit=crop&crop=face",
    testimonial: "Klamai revolucionó mi forma de resolver problemas legales. Vitoria me guió perfectamente y encontré al abogado ideal en minutos. ¡Increíble experiencia!"
  },
  {
    name: "Carlos Martín",
    role: "Director General",
    company: "Empresa Familiar",
    rating: 5,
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    testimonial: "Como empresario, el tiempo es oro. Klamai me conectó con un especialista que entendió mi caso al instante. El proceso fue transparente y eficiente."
  },
  {
    name: "Ana Rodríguez",
    role: "Abogada Independiente",
    company: "Consultoría Legal",
    rating: 5,
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&h=150&fit=crop&crop=face",
    testimonial: "Como profesional del derecho, aprecio la calidad del servicio. Klamai filtra perfectamente los casos y conecta con los abogados adecuados."
  }
];

const frequentQuestions = [
  "¿Me han despedido injustamente de mi trabajo en Valencia?",
  "¿Cómo puedo divorciarme en Alicante sin acuerdo?",
  "¿Me han multado por exceso de velocidad, qué puedo hacer?",
  "¿Mi casero no me devuelve la fianza en Castellón?",
  "¿Cómo reclamar daños por accidente de tráfico en Valencia?",
  "¿Puedo impugnar una herencia en Alicante?",
  "¿Me han despedido por embarazo en Valencia?",
  "¿Cómo recuperar mi vivienda por desahucio en Castellón?",
  "¿Problemas con mi contrato de alquiler en Alicante?",
  "¿Cómo defenderse de una demanda civil en Valencia?"
];

const consultationSchema = z.object({
  consultation: z.string()
    .min(10, 'La consulta debe tener al menos 10 caracteres')
    .max(500, 'La consulta no puede exceder 500 caracteres')
    .refine(val => val.trim().length > 0, 'La consulta no puede estar vacía'),
});

type ConsultationFormData = z.infer<typeof consultationSchema>;

const NewLanding = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuState, setMenuState] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  const {
    register,
    handleSubmit: handleFormSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    mode: 'onChange',
    defaultValues: {
      consultation: '',
    }
  });

  const consultationValue = watch('consultation');

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
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const onSubmit = async (formData: ConsultationFormData) => {
    if (!formData.consultation?.trim()) return;
    setIsSubmitting(true);

    try {
      // 1. Generate session token for security
      const sessionToken = crypto.randomUUID();

      // 2. Create draft case in Supabase
      const { data, error } = await supabase.functions.invoke('crear-borrador-caso', {
        body: {
          motivo_consulta: formData.consultation.trim(),
          session_token: sessionToken,
          cliente_id: user?.id
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

      // 2.5. Record consent
      // Al hacer clic en el botón se considera aceptación de políticas
      supabase.functions.invoke('record-consent', {
        body: {
          caso_id: casoId,
          consent_type: 'initial_consultation',
          accepted_terms: true,
          accepted_privacy: true,
          policy_terms_version: 1, // Asignar versión actual
          policy_privacy_version: 1, // Asignar versión actual
        },
      });

      // 3. Save essential data for immediate Typebot loading
      localStorage.setItem('userConsultation', formData.consultation.trim());
      localStorage.setItem('casoId', casoId);
      localStorage.setItem('current_session_token', sessionToken);

      SecureLogger.info('Case created successfully', 'new-landing');
      SecureLogger.info('Consultation saved successfully', 'new-landing');

      // 4. Navigate immediately - no delay
      navigate('/chat');

    } catch (error) {
      SecureLogger.error(error, 'handle_submit');
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  const handleFrequentQuestion = (question: string) => {
    setValue('consultation', question, { shouldValidate: true });
  };

  return (
    <div className={`min-h-screen transition-all duration-300 font-sans ${darkMode ? 'dark' : ''}`}>
      {/* Background with gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F7F9FB] via-white to-[#E3F2FD] dark:from-gray-900 dark:via-blue-950 dark:to-gray-800" />
        <div className="absolute inset-0 bg-[url('/patterns/legal-pattern.svg')] bg-repeat opacity-5 dark:opacity-3" />
      </div>

      {/* Header */}
      <header>
        <nav data-state={menuState && 'active'} className="fixed z-20 w-full px-2 group">
          <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-white/90 dark:bg-gray-900/95 max-w-4xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-lg lg:px-5')}>
            <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
              <div className="flex w-full justify-between lg:w-auto">
                <button onClick={handleLogoClick} className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
                  <img src="/logo.svg" alt="klamAI Logo" className="h-8" />
                  <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style={{fontFamily: 'Poppins, sans-serif'}}>KlamAI</span>
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
                        {/* Usuario autenticado - mostrar dashboard según su rol */}
                        {user.user_metadata?.role === 'abogado' ? (
                          <Link to="/abogados/dashboard">
                            <Button variant="ghost" size="sm" className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200">
                              Panel Abogado
                            </Button>
                          </Link>
                        ) : (
                          <Link to="/dashboard">
                            <Button variant="ghost" size="sm" className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200">
                              Mi Cuenta
                            </Button>
                          </Link>
                        )}
                        <SignOutButton />
                      </div>
                    ) : (
                      <>
                        {/* Usuario NO autenticado - mostrar opciones de acceso */}
                        <Link to="/auth">
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-[#007BFF] to-[#4D8CFF] hover:from-[#0056CC] hover:to-[#3B7DD8] text-white px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border-0 font-medium group relative overflow-hidden"
                          >
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                            <User className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                            Acceso Clientes

                            {/* Subtle glow */}
                            <div className="absolute inset-0 bg-[#4D8CFF]/20 rounded-full blur-sm group-hover:bg-[#4D8CFF]/30 transition-all duration-300"></div>
                          </Button>
                        </Link>
                        <Link to="/abogados">
                          <Button variant="outline" size="sm" className="text-gray-700 dark:text-white hover:text-[#007BFF] dark:hover:text-[#4D8CFF] dark:bg-gray-800 dark:hover:bg-gray-700 border-gray-300 hover:border-[#007BFF]">
                            <Scale className="w-4 h-4 mr-2" />
                            Soy Abogado
                          </Button>
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Mobile menu */}
              <div className="bg-white/95 dark:bg-gray-900/95 group-data-[state=active]:block hidden w-full p-4 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg mt-4 lg:hidden backdrop-blur-lg">
                <div className="flex flex-col gap-3 w-full">
                  {!loading && (
                    <>
                      {user ? (
                        <>
                          {/* Usuario autenticado - mostrar dashboard según su rol */}
                          {user.user_metadata?.role === 'abogado' ? (
                            <Link to="/abogados/dashboard">
                              <Button variant="ghost" size="sm" className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 w-full justify-center">
                                Panel Abogado
                              </Button>
                            </Link>
                          ) : (
                            <Link to="/dashboard">
                              <Button variant="ghost" size="sm" className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 w-full justify-center">
                                Mi Cuenta
                              </Button>
                            </Link>
                          )}
                          <SignOutButton className="w-full justify-center" />
                        </>
                      ) : (
                        <>
                          {/* Usuario NO autenticado - mostrar opciones de acceso */}
                          <Link to="/auth">
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-[#007BFF] to-[#4D8CFF] hover:from-[#0056CC] hover:to-[#3B7DD8] text-white px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 font-medium group relative overflow-hidden w-full justify-center"
                            >
                              {/* Shimmer effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                              <User className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                              Acceso Clientes

                              {/* Subtle glow */}
                              <div className="absolute inset-0 bg-[#4D8CFF]/20 rounded-xl blur-sm group-hover:bg-[#4D8CFF]/30 transition-all duration-300"></div>
                            </Button>
                          </Link>
                          <Link to="/abogados">
                            <Button variant="outline" size="sm" className="text-gray-700 dark:text-white hover:text-[#007BFF] dark:hover:text-[#4D8CFF] dark:bg-gray-800 dark:hover:bg-gray-700 w-full justify-center border-gray-300 hover:border-[#007BFF]">
                              <Scale className="w-4 h-4 mr-2" />
                              Soy Abogado
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
        <section className="relative bg-[#0A1931] text-white pt-24 md:pt-32">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A1931] via-[#0F1419] to-[#1a1f35]" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-10" />

          <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
            <div className="text-center">
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
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#007BFF]/20 border border-[#007BFF]/30 mb-6">
                    <Sparkles className="h-4 w-4 text-[#4D8CFF]" />
                    <span className="text-sm font-medium text-[#4D8CFF]">Tecnología Legal Inteligente</span>
                  </div>
                </div>

                <h1 className="max-w-5xl mx-auto text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6" style={{fontFamily: 'Poppins, sans-serif'}}>
                  Asesoría Legal
                  <span className="bg-gradient-to-r from-[#007BFF] to-[#4D8CFF] bg-clip-text text-transparent"> Online Instantánea</span>
                </h1>

                <p className="max-w-3xl mx-auto text-lg md:text-xl text-[#F0F0F0] leading-relaxed mb-12" style={{fontFamily: 'Roboto, sans-serif'}}>
                  Conecta con abogados especializados en minutos. Nuestra IA Vitoria te guía en tu caso y te conecta con el profesional perfecto para resolver tus problemas legales.
                </p>

                {/* Consultation Form */}
                <div className="max-w-4xl mx-auto mb-12">
                  <form onSubmit={handleFormSubmit(onSubmit)}>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#007BFF] to-[#4D8CFF] rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>

                      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 hover:shadow-3xl transition-all duration-500 group-hover:scale-[1.02]">
                        <div className="p-2">
                          <textarea
                            {...register("consultation")}
                            maxLength={500}
                            placeholder="Describe tu caso legal... (ej: Quiero vender mi casa, cuáles son los pasos legales?)"
                            className="w-full px-6 py-4 text-base md:text-lg bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 resize-none min-h-[120px] rounded-xl"
                            disabled={isSubmitting}
                          />

                          <div className="flex items-center justify-between px-6 pb-4">
                            <div className="flex items-center gap-4">
                              {consultationValue && consultationValue.trim() && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {consultationValue.length}/500 caracteres
                                </div>
                              )}
                            </div>

                            <Button
                              type="submit"
                              disabled={isSubmitting || !consultationValue?.trim()}
                              className="bg-gradient-to-r from-[#007BFF] to-[#4D8CFF] hover:from-[#0056CC] hover:to-[#3B7DD8] text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 font-medium group relative overflow-hidden"
                            >
                              {isSubmitting ? (
                                <Square className="h-5 w-5 animate-pulse mr-2" />
                              ) : (
                                <ArrowRight className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform" />
                              )}
                              {isSubmitting ? 'Procesando...' : 'Enviar Consulta'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Consent Notice */}
                    <div className="mt-6 max-w-2xl mx-auto">
                      <div className="bg-[#E3F2FD]/10 border border-[#007BFF]/20 rounded-xl p-4">
                        <p className="text-sm text-[#F0F0F0] text-center leading-relaxed">
                          Al enviar tu consulta, aceptas nuestros{" "}
                          <a href="/aviso-legal" className="text-[#007BFF] hover:text-[#4D8CFF] hover:underline font-medium" target="_blank" rel="noopener noreferrer">
                            Términos y Condiciones
                          </a>{" "}
                          y{" "}
                          <a href="/politicas-privacidad" className="text-[#007BFF] hover:text-[#4D8CFF] hover:underline font-medium" target="_blank" rel="noopener noreferrer">
                            Política de Privacidad
                          </a>
                        </p>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Quick Suggestions */}
                <div className="max-w-4xl mx-auto">
                  <p className="text-center text-[#F0F0F0] text-sm mb-6 flex items-center justify-center gap-2">
                    <Zap className="h-4 w-4 text-[#007BFF]" />
                    Consultas populares:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {frequentQuestions.slice(0, 6).map((question, index) => (
                      <button
                        type="button"
                        key={index}
                        onClick={() => handleFrequentQuestion(question)}
                        className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm text-left text-[#F0F0F0] hover:text-white transition-all duration-300 border border-white/20 hover:border-[#007BFF]/50 hover:scale-105"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#007BFF]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-8 w-8 text-[#4D8CFF]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2" style={{fontFamily: 'Poppins, sans-serif'}}>100% Confidencial</h3>
                    <p className="text-[#F0F0F0] text-sm">Tu información está protegida por secreto profesional</p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#007BFF]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-8 w-8 text-[#4D8CFF]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2" style={{fontFamily: 'Poppins, sans-serif'}}>Respuesta Rápida</h3>
                    <p className="text-[#F0F0F0] text-sm">Abogados especializados responden en minutos</p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#007BFF]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="h-8 w-8 text-[#4D8CFF]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2" style={{fontFamily: 'Poppins, sans-serif'}}>Abogados Verificados</h3>
                    <p className="text-[#F0F0F0] text-sm">Solo profesionales certificados y con experiencia</p>
                  </div>
                </div>
              </AnimatedGroup>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 md:py-32 bg-[#F7F9FB] dark:bg-gray-900">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-[#0A1931] dark:text-white mb-6" style={{fontFamily: 'Poppins, sans-serif'}}>
                ¿Cómo Funciona Klamai?
              </h2>
              <p className="text-xl text-[#6c757d] dark:text-gray-300 max-w-3xl mx-auto" style={{fontFamily: 'Roboto, sans-serif'}}>
                Tres pasos simples para resolver tu consulta legal con la ayuda de tecnología avanzada
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Step 1 */}
              <div className="text-center group">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-r from-[#007BFF] to-[#4D8CFF] rounded-full flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110">
                    <MessageCircle className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#007BFF] text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                    1
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-[#0A1931] dark:text-white mb-4" style={{fontFamily: 'Poppins, sans-serif'}}>
                  Envía tu Consulta
                </h3>
                <p className="text-[#6c757d] dark:text-gray-300 leading-relaxed text-lg" style={{fontFamily: 'Roboto, sans-serif'}}>
                  Describe tu caso legal de forma clara y detallada. Nuestra IA analizará tu consulta y te ayudará a estructurar mejor la información.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center group">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-r from-[#007BFF] to-[#4D8CFF] rounded-full flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110">
                    <Users2 className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#007BFF] text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                    2
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-[#0A1931] dark:text-white mb-4" style={{fontFamily: 'Poppins, sans-serif'}}>
                  Conecta con Vitoria
                </h3>
                <p className="text-[#6c757d] dark:text-gray-300 leading-relaxed text-lg" style={{fontFamily: 'Roboto, sans-serif'}}>
                  Nuestra asistente inteligente Vitoria te guiará paso a paso, recopilará información adicional y te preparará para la consulta con el abogado.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center group">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-r from-[#007BFF] to-[#4D8CFF] rounded-full flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110">
                    <Shield className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#007BFF] text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                    3
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-[#0A1931] dark:text-white mb-4" style={{fontFamily: 'Poppins, sans-serif'}}>
                  Abogado Especializado
                </h3>
                <p className="text-[#6c757d] dark:text-gray-300 leading-relaxed text-lg" style={{fontFamily: 'Roboto, sans-serif'}}>
                  Un abogado especializado en tu área contactará contigo en minutos. Consulta online segura, confidencial y efectiva.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Video Section */}
        <section className="py-20 md:py-32 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-[#0A1931] dark:text-white mb-6" style={{fontFamily: 'Poppins, sans-serif'}}>
                Descubre Klamai en Acción
              </h2>
              <p className="text-xl text-[#6c757d] dark:text-gray-300 max-w-3xl mx-auto" style={{fontFamily: 'Roboto, sans-serif'}}>
                Mira cómo nuestra plataforma revoluciona el asesoramiento legal con tecnología de vanguardia
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="relative bg-gradient-to-br from-[#007BFF]/10 to-[#4D8CFF]/10 rounded-2xl p-8">
                <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center relative overflow-hidden">
                  {/* Placeholder for YouTube video */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#007BFF] to-[#4D8CFF] opacity-20"></div>
                  <div className="relative z-10 text-center text-white">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                      <Play className="h-10 w-10 text-white ml-1" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2" style={{fontFamily: 'Poppins, sans-serif'}}>
                      Video Explicativo
                    </h3>
                    <p className="text-lg opacity-90" style={{fontFamily: 'Roboto, sans-serif'}}>
                      Próximamente disponible
                    </p>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <Youtube className="h-6 w-6 text-white" />
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <p className="text-[#6c757d] dark:text-gray-300 leading-relaxed" style={{fontFamily: 'Roboto, sans-serif'}}>
                    En este video te mostramos cómo funciona nuestra plataforma paso a paso,
                    desde el envío de tu consulta hasta la conexión con el abogado especialista.
                    Descubre todas las ventajas de usar Klamai para resolver tus problemas legales.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-[#007BFF]/5 to-[#4D8CFF]/5">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-[#007BFF] mb-2" style={{fontFamily: 'Poppins, sans-serif'}}>
                  500+
                </div>
                <div className="text-[#6c757d] font-medium" style={{fontFamily: 'Roboto, sans-serif'}}>
                  Abogados Verificados
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-[#007BFF] mb-2" style={{fontFamily: 'Poppins, sans-serif'}}>
                  10k+
                </div>
                <div className="text-[#6c757d] font-medium" style={{fontFamily: 'Roboto, sans-serif'}}>
                  Casos Resueltos
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-[#007BFF] mb-2" style={{fontFamily: 'Poppins, sans-serif'}}>
                  24/7
                </div>
                <div className="text-[#6c757d] font-medium" style={{fontFamily: 'Roboto, sans-serif'}}>
                  Atención Continua
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-[#007BFF] mb-2" style={{fontFamily: 'Poppins, sans-serif'}}>
                  95%
                </div>
                <div className="text-[#6c757d] font-medium" style={{fontFamily: 'Roboto, sans-serif'}}>
                  Satisfacción Cliente
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Specialties Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#0A1931] mb-4" style={{fontFamily: 'Poppins, sans-serif'}}>
                Especialidades Jurídicas
              </h2>
              <p className="text-xl text-[#6c757d] max-w-2xl mx-auto" style={{fontFamily: 'Roboto, sans-serif'}}>
                Contamos con abogados especializados en todas las áreas del derecho
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {[
                {
                  icon: <Scale className="h-6 w-6" />,
                  name: "Derecho Penal",
                  color: "from-red-500 to-red-600",
                  description: "Defensa penal, juicios, recursos"
                },
                {
                  icon: <Briefcase className="h-6 w-6" />,
                  name: "Derecho Mercantil",
                  color: "from-blue-500 to-blue-600",
                  description: "Empresas, contratos, sociedades"
                },
                {
                  icon: <Users2 className="h-6 w-6" />,
                  name: "Derecho Laboral",
                  color: "from-green-500 to-green-600",
                  description: "Trabajadores, despidos, sindicatos"
                },
                {
                  icon: <Shield className="h-6 w-6" />,
                  name: "Protección de Datos",
                  color: "from-purple-500 to-purple-600",
                  description: "RGPD, LOPD, privacidad"
                },
                {
                  icon: <Award className="h-6 w-6" />,
                  name: "Propiedad Intelectual",
                  color: "from-orange-500 to-orange-600",
                  description: "Marcas, patentes, copyright"
                },
                {
                  icon: <BookOpen className="h-6 w-6" />,
                  name: "Derecho Administrativo",
                  color: "from-teal-500 to-teal-600",
                  description: "Administración pública, licencias"
                },
                {
                  icon: <MapPin className="h-6 w-6" />,
                  name: "Derecho Inmobiliario",
                  color: "from-indigo-500 to-indigo-600",
                  description: "Compra-venta, alquileres, hipotecas"
                },
                {
                  icon: <Gavel className="h-6 w-6" />,
                  name: "Derecho Civil",
                  color: "from-cyan-500 to-cyan-600",
                  description: "Familia, herencias, contratos"
                },
              ].map((specialty, index) => (
                <div
                  key={index}
                  className="group bg-white border border-[#E3F2FD] rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-[#007BFF]/30"
                >
                  <div className={`w-12 h-12 bg-gradient-to-r ${specialty.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <div className="text-white">
                      {specialty.icon}
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-[#0A1931] text-center mb-2" style={{fontFamily: 'Poppins, sans-serif'}}>
                    {specialty.name}
                  </h3>
                  <p className="text-xs text-[#6c757d] text-center leading-relaxed" style={{fontFamily: 'Roboto, sans-serif'}}>
                    {specialty.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Lawyer Section */}
        <section className="py-16 md:py-24 bg-[#F7F9FB]">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Image Side */}
                <div className="order-2 lg:order-1">
                  <div className="relative">
                    <div className="aspect-square bg-gradient-to-br from-[#007BFF]/10 to-[#4D8CFF]/10 rounded-2xl p-8 flex items-center justify-center">
                      <div className="w-full h-full bg-gradient-to-br from-[#007BFF] to-[#4D8CFF] rounded-xl flex items-center justify-center shadow-lg">
                        <Scale className="h-24 w-24 text-white" />
                      </div>
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#007BFF] rounded-full flex items-center justify-center">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-[#4D8CFF] rounded-full flex items-center justify-center">
                      <Award className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Content Side */}
                <div className="order-1 lg:order-2 text-center lg:text-left">
                  <h2 className="text-3xl md:text-4xl font-bold text-[#0A1931] mb-6" style={{fontFamily: 'Poppins, sans-serif'}}>
                    Abogados expertos a tu alcance
                  </h2>
                  <p className="text-lg text-[#6c757d] mb-8 leading-relaxed" style={{fontFamily: 'Roboto, sans-serif'}}>
                    Accede a una red de profesionales verificados con años de experiencia en todas las especialidades del derecho.
                    Cada abogado en nuestra plataforma ha sido cuidadosamente seleccionado y verificado.
                  </p>
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#007BFF]" style={{fontFamily: 'Poppins, sans-serif'}}>500+</div>
                      <div className="text-sm text-[#6c757d]" style={{fontFamily: 'Roboto, sans-serif'}}>Abogados verificados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#007BFF]" style={{fontFamily: 'Poppins, sans-serif'}}>10k+</div>
                      <div className="text-sm text-[#6c757d]" style={{fontFamily: 'Roboto, sans-serif'}}>Casos resueltos</div>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-[#007BFF] to-[#4D8CFF] hover:from-[#0056CC] hover:to-[#3B7DD8] text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Users2 className="w-5 h-5 mr-2" />
                    Conoce nuestros abogados
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lawyer Profiles Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#0A1931] mb-4" style={{fontFamily: 'Poppins, sans-serif'}}>
                Nuestros Abogados Destacados
              </h2>
              <p className="text-xl text-[#6c757d] max-w-2xl mx-auto" style={{fontFamily: 'Roboto, sans-serif'}}>
                Profesionales con amplia experiencia en diferentes especialidades del derecho
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  name: "Dra. María González",
                  specialty: "Derecho Mercantil",
                  experience: "15 años",
                  image: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=150&h=150&fit=crop&crop=face",
                  rating: 5
                },
                {
                  name: "Dr. Carlos Rodríguez",
                  specialty: "Derecho Penal",
                  experience: "12 años",
                  image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
                  rating: 5
                },
                {
                  name: "Dra. Ana Martínez",
                  specialty: "Derecho Laboral",
                  experience: "10 años",
                  image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&h=150&fit=crop&crop=face",
                  rating: 5
                }
              ].map((lawyer, index) => (
                <div key={index} className="bg-white border border-[#E3F2FD] rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-[#007BFF]/30">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-[#007BFF]/20">
                      <img
                        src={lawyer.image}
                        alt={lawyer.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-lg font-bold text-[#0A1931] mb-1" style={{fontFamily: 'Poppins, sans-serif'}}>
                      {lawyer.name}
                    </h3>
                    <p className="text-[#007BFF] font-medium mb-2" style={{fontFamily: 'Roboto, sans-serif'}}>
                      {lawyer.specialty}
                    </p>
                    <p className="text-sm text-[#6c757d] mb-3" style={{fontFamily: 'Roboto, sans-serif'}}>
                      {lawyer.experience} de experiencia
                    </p>
                    <div className="flex items-center justify-center gap-1 mb-4">
                      {[...Array(lawyer.rating)].map((_, i) => (
                        <Award key={i} className="h-4 w-4 text-[#007BFF] fill-current" />
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#007BFF] text-[#007BFF] hover:bg-[#007BFF] hover:text-white rounded-full"
                    >
                      Ver perfil
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 md:py-32 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-[#0A1931] dark:text-white mb-6" style={{fontFamily: 'Poppins, sans-serif'}}>
                Lo que dicen nuestros clientes
              </h2>
              <p className="text-xl text-[#6c757d] dark:text-gray-300 max-w-3xl mx-auto" style={{fontFamily: 'Roboto, sans-serif'}}>
                Miles de personas ya han resuelto sus problemas legales con Klamai
              </p>
            </div>

            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
              {testimonials.map(testimonial => (
                <div key={testimonial.name} className="bg-white dark:bg-gray-700 border border-[#E3F2FD] dark:border-gray-600 rounded-2xl p-8 hover:shadow-xl transition-all duration-500 hover:scale-105">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-[#6c757d] dark:text-gray-300 leading-relaxed mb-6 italic" style={{fontFamily: 'Roboto, sans-serif'}}>
                    "{testimonial.testimonial}"
                  </p>
                  <div className="flex items-center gap-3">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-[#0A1931] dark:text-white" style={{fontFamily: 'Poppins, sans-serif'}}>
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-[#6c757d] dark:text-gray-300" style={{fontFamily: 'Roboto, sans-serif'}}>
                        {testimonial.role}, {testimonial.company}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative border-t bg-[#0A1931] text-white transition-colors duration-300">
        <div className="container mx-auto px-6 py-16 md:px-8 lg:px-12">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            {/* Newsletter Section */}
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <img src="/logo.svg" alt="KlamAI Logo" className="h-8" />
                <h2 className="text-2xl font-bold tracking-tight text-white" style={{fontFamily: 'Poppins, sans-serif'}}>KlamAI</h2>
              </div>
              <p className="mb-6 text-[#F0F0F0]">
                Recibe las últimas noticias sobre tecnología legal y consejos de Vitoria directamente en tu email.
              </p>
              <form className="relative">
                <input
                  type="email"
                  placeholder="Tu email aquí"
                  className="pr-12 w-full backdrop-blur-sm bg-white/20 border-white/30 text-white placeholder:text-[#F0F0F0]/70 rounded-lg px-4 py-3 focus:bg-white/30 focus:border-[#007BFF]/50 transition-all duration-300"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8 rounded-full bg-[#007BFF] hover:bg-[#4D8CFF] text-white hover:scale-105 transition-all duration-300"
                >
                  <Mail className="h-4 w-4" />
                  <span className="sr-only">Suscribirse</span>
                </Button>
              </form>
              <div className="absolute -right-4 top-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="mb-6 text-lg font-semibold text-white" style={{fontFamily: 'Poppins, sans-serif'}}>Enlaces Rápidos</h3>
              <nav className="space-y-3 text-sm">
                <a href="/" className="block transition-colors hover:text-[#007BFF] text-[#F0F0F0]">
                  Inicio
                </a>
                <a href="/areas-de-practica" className="block transition-colors hover:text-[#007BFF] text-[#F0F0F0]">
                  Áreas de Práctica
                </a>
                <a href="/mercantil" className="block transition-colors hover:text-[#007BFF] text-[#F0F0F0]">
                  Derecho Mercantil
                </a>
                <a href="/contacto" className="block transition-colors hover:text-[#007BFF] text-[#F0F0F0]">
                  Contacto
                </a>
                <a href="/chat" className="block transition-colors hover:text-[#007BFF] text-[#F0F0F0]">
                  Consultar con Vitoria
                </a>
              </nav>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="mb-6 text-lg font-semibold text-white" style={{fontFamily: 'Poppins, sans-serif'}}>Contacto</h3>
              <address className="space-y-4 text-sm not-italic">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-[#007BFF] flex-shrink-0" />
                  <span className="text-[#F0F0F0]">Valencia, España</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-[#007BFF] flex-shrink-0" />
                  <span className="text-[#F0F0F0]">+34 123 456 789</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-[#007BFF] flex-shrink-0" />
                  <span className="text-[#F0F0F0]">gestiones@klamai.com</span>
                </div>
              </address>
            </div>

            {/* Social Media & Theme Toggle */}
            <div className="relative">
              <h3 className="mb-6 text-lg font-semibold text-white" style={{fontFamily: 'Poppins, sans-serif'}}>Síguenos</h3>
              <div className="mb-8 flex space-x-3">
                <Button variant="outline" size="icon" className="rounded-full bg-white/20 border-white/30 text-white hover:bg-[#007BFF]/30 hover:border-[#007BFF]/50 transition-all duration-200">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </Button>
                <Button variant="outline" size="icon" className="rounded-full bg-white/20 border-white/30 text-white hover:bg-[#007BFF]/30 hover:border-[#007BFF]/50 transition-all duration-200">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </Button>
                <Button variant="outline" size="icon" className="rounded-full bg-white/20 border-white/30 text-white hover:bg-[#007BFF]/30 hover:border-[#007BFF]/50 transition-all duration-200">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-white/30 pt-8 text-center md:flex-row">
            <p className="text-sm text-[#F0F0F0]">
              © 2025 KlamAI. Todos los derechos reservados. | Asesoramiento jurídico con IA en España
            </p>
            <nav className="flex gap-6 text-sm">
              <a href="/politicas-privacidad" className="transition-colors hover:text-[#007BFF] text-[#F0F0F0]">
                Política de Privacidad
              </a>
              <a href="/aviso-legal" className="transition-colors hover:text-[#007BFF] text-[#F0F0F0]">
                Aviso Legal
              </a>
              <a href="#" className="transition-colors hover:text-[#007BFF] text-[#F0F0F0]">
                Cookies
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NewLanding;