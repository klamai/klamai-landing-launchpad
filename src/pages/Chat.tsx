
import { useState, useEffect, useCallback } from "react";
import { Moon, Sun, Scale, Menu, X, Sidebar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Standard } from "@typebot.io/react";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import ChatHistory from "@/components/ChatHistory";
import ChatHistoryAnonymous from "@/components/ChatHistoryAnonymous";
import AnimatedBackground from "@/components/AnimatedBackground";
import ProposalDisplay from "@/components/ProposalDisplay";
import { useAuth } from "@/hooks/useAuth";
import SignOutButton from "@/components/SignOutButton";
import AuthModal from "@/components/AuthModal";
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
  const [showProposal, setShowProposal] = useState(false);
  const [proposalData, setProposalData] = useState<any>(null);
  const [showPaymentButton, setShowPaymentButton] = useState(false);
  const [caseLinked, setCaseLinked] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  // Function to link case with authenticated user
  const linkCaseToUser = useCallback(async (userId: string, caseId: string) => {
    if (!userId || !caseId || caseLinked) {
      return;
    }

    try {
      const sessionToken = localStorage.getItem('current_session_token');
      
      if (!sessionToken) {
        console.error('No session token found for case linking');
        return;
      }

      const { data, error } = await supabase.rpc('assign_anonymous_case_to_user', {
        p_caso_id: caseId,
        p_session_token: sessionToken,
        p_user_id: userId
      });

      if (error || !data) {
        console.error('Error in assign_anonymous_case_to_user function:', error);
        return;
      }

      setCaseLinked(true);
      localStorage.removeItem('current_caso_id');
      localStorage.removeItem('current_session_token');
      
    } catch (error) {
      console.error('Error in linkCaseToUser:', error);
    }
  }, [caseLinked]);

  // Function to check case status
  const checkCaseStatus = useCallback(async (caseId: string) => {
    if (!caseId) return;
    
    try {
      const { data, error } = await supabase
        .from('casos')
        .select('estado, propuesta_estructurada')
        .eq('id', caseId)
        .maybeSingle();

      if (error || !data) return;

      if (data.estado === 'listo_para_propuesta' && data.propuesta_estructurada) {
        setProposalData(data.propuesta_estructurada);
        setShowProposal(true);
        setShowPaymentButton(false);
        
        toast({
          title: "¡Tu propuesta está lista!",
          description: "Hemos preparado una propuesta personalizada para tu caso.",
        });
      }
    } catch (error) {
      console.error('Error in checkCaseStatus:', error);
    }
  }, [toast]);

  // Transfer case data to profile
  const transferCaseDataToProfile = useCallback(async (userId: string, caseId: string) => {
    try {
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('nombre, apellido, email, telefono')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) return;

      const isNewProfile = !existingProfile || 
        (!existingProfile.nombre && !existingProfile.apellido) ||
        existingProfile.nombre === '' || existingProfile.apellido === '';

      if (isNewProfile) {
        const { data: casoData, error: casoError } = await supabase
          .from('casos')
          .select(`
            nombre_borrador, apellido_borrador, email_borrador, telefono_borrador, 
            razon_social_borrador, nif_cif_borrador, tipo_perfil_borrador,
            ciudad_borrador, direccion_fiscal_borrador, nombre_gerente_borrador
          `)
          .eq('id', caseId)
          .maybeSingle();

        if (casoError || !casoData) return;
        
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        const profileUpdate = {
          nombre: casoData.nombre_borrador || currentUser?.user_metadata?.nombre || '',
          apellido: casoData.apellido_borrador || currentUser?.user_metadata?.apellido || '',
          email: casoData.email_borrador || currentUser?.email || '',
          telefono: casoData.telefono_borrador || null,
          razon_social: casoData.razon_social_borrador || null,
          nif_cif: casoData.nif_cif_borrador || null,
          tipo_perfil: casoData.tipo_perfil_borrador || 'individual',
          ciudad: casoData.ciudad_borrador || null,
          direccion_fiscal: casoData.direccion_fiscal_borrador || null,
          nombre_gerente: casoData.nombre_gerente_borrador || null
        };

        await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', userId);
      }
    } catch (error) {
      console.error('Error in transferCaseDataToProfile:', error);
    }
  }, []);

  // Combined initialization effect - runs once on mount
  useEffect(() => {
    if (loading) return;

    const savedConsultation = localStorage.getItem('userConsultation');
    const savedCasoId = localStorage.getItem('casoId');
    
    if (!savedConsultation || !savedCasoId) {
      navigate('/');
      return;
    }
    
    setUserConsultation(savedConsultation);
    setCasoId(savedCasoId);
    setIsInitialized(true);
    
    localStorage.removeItem('userConsultation');
    localStorage.removeItem('casoId');

    // If user is already authenticated, link case immediately
    if (user && savedCasoId) {
      linkCaseToUser(user.id, savedCasoId);
      transferCaseDataToProfile(user.id, savedCasoId);
    }

    // Check case status initially
    checkCaseStatus(savedCasoId);
  }, [navigate, loading, user, linkCaseToUser, transferCaseDataToProfile, checkCaseStatus]);

  // Setup realtime subscription and polling (lazy loaded after initialization)
  useEffect(() => {
    if (!casoId || !isInitialized || showProposal) return;

    let channel: any;
    let pollingInterval: NodeJS.Timeout;

    // Delay realtime setup slightly to allow Typebot to load first
    const setupRealtime = () => {
      channel = supabase
        .channel('caso-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'casos',
            filter: `id=eq.${casoId}`
          },
          (payload) => {
            const newCaso = payload.new;
            
            if (newCaso && newCaso.estado === 'listo_para_propuesta' && newCaso.propuesta_estructurada) {
              setProposalData(newCaso.propuesta_estructurada);
              setShowProposal(true);
            }
          }
        )
        .subscribe();

      // Polling fallback - check every 30 seconds
      pollingInterval = setInterval(() => {
        if (!showProposal) {
          checkCaseStatus(casoId);
        }
      }, 30000);
    };

    // Setup with a small delay to prioritize Typebot loading
    const timeoutId = setTimeout(setupRealtime, 2000);

    return () => {
      clearTimeout(timeoutId);
      if (channel) supabase.removeChannel(channel);
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [casoId, isInitialized, showProposal, checkCaseStatus]);

  // Handle user authentication changes
  useEffect(() => {
    if (user && casoId && !caseLinked && isInitialized) {
      linkCaseToUser(user.id, casoId);
      transferCaseDataToProfile(user.id, casoId);
    }
  }, [user, casoId, caseLinked, isInitialized, linkCaseToUser, transferCaseDataToProfile]);

  // Secure communication with Typebot
  useEffect(() => {
    const handleTypebotMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      const { type, mode } = event.data;

      if (type === 'SHOW_AUTH_MODAL' && (mode === 'login' || mode === 'signup')) {
        setAuthModalMode(mode);
        setShowAuthModal(true);
      }
    };

    window.addEventListener('message', handleTypebotMessage);
    return () => window.removeEventListener('message', handleTypebotMessage);
  }, []);

  const handleLogoClick = () => {
    window.location.href = '/';
  };

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleProposalClose = () => {
    setShowProposal(false);
    setShowPaymentButton(true);
  };

  const handleAuthSuccessWithCaseData = async () => {
    setShowAuthModal(false);
    
    setTimeout(async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser && casoId) {
        await transferCaseDataToProfile(currentUser.id, casoId);
        await linkCaseToUser(currentUser.id, casoId);
      }

      toast({
        title: "¡Bienvenido!",
        description: "Tu conversación ha sido guardada y vinculada a tu perfil.",
      });

      const successMessage = {
        type: 'AUTH_SUCCESS',
        user: currentUser ? {
          email: currentUser.email,
          id: currentUser.id,
          authenticated: true
        } : null
      };

      const typebotIframe = document.querySelector('iframe');
      if (typebotIframe && typebotIframe.contentWindow) {
        typebotIframe.contentWindow.postMessage(successMessage, '*');
      }
    }, 1000);
  };

  if (loading || !isInitialized) {
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
                        className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-200 dark:bg-black-800 dark:hover:bg-black"
                      >
                        Iniciar Sesión
                      </Button>
                      <Button 
                        onClick={() => setShowAuthModal(true)}
                        size="sm" 
                        className="bg-black text-white hover:bg-gray-100 hover:text-black border border-gray-300 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                      >
                        Registrarse
                      </Button>
                    </div>
                  )}
                </div>

                {/* Mobile menu */}
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

        {/* Main Content with Sidebar */}
        <main className="pt-20 flex flex-1 h-[calc(100vh-12rem)] relative z-10">
          {/* Sidebar */}
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

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Chat Container */}
          <div className={cn(
            "flex-1 transition-all duration-300 relative z-10",
            sidebarOpen ? "lg:ml-0" : "lg:ml-0"
          )}>
            <div className="h-full relative">
              {/* Show Typebot only when we have the required data */}
              {userConsultation && casoId && (
                <Standard
                  typebot="klamai-test-supabase-wyqehpx"
                  apiHost="https://bot.autoiax.com"
                  style={{ width: "100%", height: "100%" }}
                  prefilledVariables={{
                    "utm_value": userConsultation,
                    "caso_id": casoId
                  }}
                />
              )}
              
              {/* Floating payment button */}
              {showPaymentButton && (
                <div className="absolute bottom-4 right-4 z-20">
                  <Button 
                    onClick={() => setShowProposal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg animate-pulse"
                    size="lg"
                  >
                    Ver Planes de Asesoría
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Legal Footer */}
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

        {/* Authentication Modal */}
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccessWithCaseData}
          initialMode={authModalMode}
        />

        {/* Proposal Modal */}
        {showProposal && proposalData && (
          <ProposalDisplay 
            proposalData={proposalData} 
            casoId={casoId}
            isModal={true}
            onClose={handleProposalClose}
          />
        )}
      </div>
    </div>
  );
};

export default Chat;
