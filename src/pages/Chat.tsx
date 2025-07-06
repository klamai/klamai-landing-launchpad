import { useState, useEffect } from "react";
import { Moon, Sun, Scale, Menu, X, Sidebar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Standard } from "@typebot.io/react";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import ChatHistory from "@/components/ChatHistory";
import ChatHistoryAnonymous from "@/components/ChatHistoryAnonymous";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useAuth } from "@/hooks/useAuth";
import SignOutButton from "@/components/SignOutButton";
import AuthModal from "@/components/AuthModal";
import PricingModal from "@/components/PricingModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Chat = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [menuState, setMenuState] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userConsultation, setUserConsultation] = useState("");
  const [casoId, setCasoId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [currentCasoId, setCurrentCasoId] = useState<string | null>(null);
  
  const { user, loading } = useAuth();
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

  useEffect(() => {
    const savedConsultation = localStorage.getItem('userConsultation');
    const savedCasoId = localStorage.getItem('casoId');
    
    if (!savedConsultation || !savedCasoId) {
      navigate('/');
      return;
    }
    
    setUserConsultation(savedConsultation);
    setCasoId(savedCasoId);
    setCurrentCasoId(savedCasoId);
    
    localStorage.removeItem('userConsultation');
    localStorage.removeItem('casoId');

    console.log('Datos recuperados del localStorage:', {
      consultation: savedConsultation,
      casoId: savedCasoId
    });
  }, [navigate]);

  useEffect(() => {
    if (!user || !currentCasoId) return;

    console.log('Setting up realtime listener for caso:', currentCasoId);

    const channel = supabase
      .channel('casos-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'casos',
          filter: `cliente_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Caso status change detected:', payload);
          
          const newRecord = payload.new as any;
          
          if (newRecord.estado === 'listo_para_propuesta' && newRecord.id === currentCasoId) {
            console.log('Case ready for proposal, showing pricing modal');
            setShowChat(false);
            setShowPricingModal(true);
            
            toast({
              title: "¡Tu análisis está listo!",
              description: "Hemos completado el análisis de tu caso. Elige un plan para continuar.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user, currentCasoId, toast]);

  useEffect(() => {
    const handleTypebotMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') {
        console.log('Invalid message format received');
        return;
      }

      const { type, mode } = event.data;

      if (type === 'SHOW_AUTH_MODAL' && (mode === 'login' || mode === 'signup')) {
        console.log('Valid auth modal request received:', { type, mode });
        setAuthModalMode(mode);
        setShowAuthModal(true);
      } else {
        console.log('Unknown message type or invalid mode:', { type, mode });
      }
    };

    window.addEventListener('message', handleTypebotMessage);

    return () => {
      window.removeEventListener('message', handleTypebotMessage);
    };
  }, []);

  const handleSelectPlan = async (planType: 'one-time' | 'subscription', isYearly?: boolean) => {
    if (!user || !currentCasoId) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para continuar",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Selected plan:', { planType, isYearly, casoId: currentCasoId });

      let functionName = '';
      let payload: any = { casoId: currentCasoId };

      if (planType === 'one-time') {
        functionName = 'create-one-time-payment';
      } else {
        functionName = 'create-subscription';
        payload.isYearly = isYearly || false;
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
        
        toast({
          title: "Redirigiendo al pago",
          description: "Se ha abierto una nueva pestaña con el checkout de Stripe",
        });
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast({
        title: "Error al procesar el pago",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    }
  };

  const handleReturnToChat = () => {
    setShowPricingModal(false);
    setShowChat(true);
  };

  const handleLogoClick = () => {
    window.location.href = '/';
  };

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    console.log('Selected session:', sessionId);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    toast({
      title: "¡Bienvenido!",
      description: "Tu conversación ha sido guardada y ahora puedes acceder a tu historial.",
    });

    const successMessage = {
      type: 'AUTH_SUCCESS',
      user: user ? {
        email: user.email,
        id: user.id,
        authenticated: true
      } : null
    };

    const typebotIframe = document.querySelector('iframe');
    if (typebotIframe && typebotIframe.contentWindow) {
      typebotIframe.contentWindow.postMessage(successMessage, '*');
      console.log('Auth success message sent to Typebot:', successMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 font-sans ${darkMode ? 'dark' : ''}`}>
      <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800 flex flex-col">
        <AnimatedBackground darkMode={darkMode} />
        
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
                    <Button 
                      onClick={() => setSidebarOpen(!sidebarOpen)} 
                      variant="outline" 
                      size="icon" 
                      className="rounded-full"
                    >
                      <Sidebar className="h-4 w-4" />
                    </Button>
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
                  <Button 
                    onClick={() => setSidebarOpen(!sidebarOpen)} 
                    variant="outline" 
                    size="icon" 
                    className="rounded-full"
                  >
                    <Sidebar className="h-4 w-4" />
                  </Button>
                  <Button onClick={toggleDarkMode} variant="outline" size="icon" className="rounded-full">
                    {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                  
                  {user ? (
                    <SignOutButton />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={() => setShowAuthModal(true)}
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200"
                      >
                        Iniciar Sesión
                      </Button>
                      <Button 
                        onClick={() => setShowAuthModal(true)}
                        size="sm" 
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Registrarse
                      </Button>
                    </div>
                  )}
                </div>

                <div className="bg-background group-data-[state=active]:block hidden w-full p-4 rounded-2xl border shadow-lg mt-4 lg:hidden">
                  <div className="flex flex-col gap-3 w-full">
                    {user ? (
                      <SignOutButton className="w-full justify-center" />
                    ) : (
                      <>
                        <Button 
                          onClick={() => setShowAuthModal(true)}
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 w-full justify-center"
                        >
                          Iniciar Sesión
                        </Button>
                        <Button 
                          onClick={() => setShowAuthModal(true)}
                          size="sm" 
                          className="bg-blue-600 text-white hover:bg-blue-700 w-full"
                        >
                          Registrarse
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </header>

        <main className="pt-20 flex flex-1 h-[calc(100vh-12rem)] relative z-10">
          <div className={cn(
            "fixed lg:relative inset-y-0 left-0 z-30 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out pt-20 lg:pt-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            !sidebarOpen && "lg:w-0 lg:border-r-0"
          )}>
            {sidebarOpen && (
              <div className="h-full p-4">
                {user ? (
                  <ChatHistory onSelectSession={handleSelectSession} />
                ) : (
                  <ChatHistoryAnonymous onAuthClick={(mode) => {
                    setAuthModalMode(mode);
                    setShowAuthModal(true);
                  }} />
                )}
              </div>
            )}
          </div>

          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div className={cn(
            "flex-1 transition-all duration-300 relative z-10",
            sidebarOpen ? "lg:ml-0" : "lg:ml-0"
          )}>
            {showChat && (
              <div className="h-full">
                <Standard
                  typebot="klamai-test-supabase-wyqehpx"
                  apiHost="https://bot.autoiax.com"
                  style={{ width: "100%", height: "100%" }}
                  prefilledVariables={{
                    "utm_value": userConsultation || "Hola, necesito asesoramiento legal",
                    "caso_id": casoId || ""
                  }}
                />
              </div>
            )}

            {!showChat && !showPricingModal && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Scale className="h-16 w-16 text-blue-600 mx-auto animate-pulse" />
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Procesando tu análisis...
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Nuestro equipo está preparando tu propuesta legal personalizada
                  </p>
                  <Button 
                    onClick={handleReturnToChat}
                    variant="outline"
                    className="mt-4"
                  >
                    Volver al chat
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="relative z-10 bg-gray-800 dark:bg-gray-900 text-white py-4 px-4">
          <div className="flex items-center justify-center text-sm">
            <p className="text-center">
              Al enviar un mensaje a VitorIA, aceptas nuestras{" "}
              <Link 
                to="/aviso-legal" 
                className="text-blue-400 hover:text-blue-300 underline transition-colors"
              >
                condiciones
              </Link>
              {" "}y confirmas que has leído nuestra{" "}
              <Link 
                to="/politicas-privacidad" 
                className="text-blue-400 hover:text-blue-300 underline transition-colors"
              >
                política de privacidad
              </Link>
              .
            </p>
          </div>
        </footer>

        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          initialMode={authModalMode}
        />

        <PricingModal 
          isOpen={showPricingModal}
          onClose={() => {
            setShowPricingModal(false);
            setShowChat(true);
          }}
          onSelectPlan={handleSelectPlan}
          caseId={currentCasoId || undefined}
        />
      </div>
    </div>
  );
};

export default Chat;
