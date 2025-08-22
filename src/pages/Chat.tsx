
import { useState, useEffect } from "react";
import { Moon, Sun, Scale, Menu, X, Sidebar, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Standard } from "@typebot.io/react";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import ChatHistory from "@/components/ChatHistory";
import ChatHistoryAnonymous from "@/components/client/ChatHistoryAnonymous";
import AnimatedBackground from "@/components/AnimatedBackground";
import ProposalDisplay from "@/components/ProposalDisplay";
import { useAuth } from "@/hooks/useAuth";
import SignOutButton from "@/components/SignOutButton";
import AuthModal from "@/components/AuthModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TYPEBOT_CONFIG } from "@/config/constants";
import { SecureLogger } from '@/utils/secureLogging';

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
  const [typebotReady, setTypebotReady] = useState(false);
  const [proposalNotificationShown, setProposalNotificationShown] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize dark mode from localStorage immediately
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

  // PRIORITY 1: Get essential data immediately for Typebot loading
  useEffect(() => {
    const savedConsultation = localStorage.getItem('userConsultation');
    const savedCasoId = localStorage.getItem('casoId');
    
    if (!savedConsultation || !savedCasoId) {
      navigate('/');
      return;
    }
    
    // Set data immediately for Typebot
    setUserConsultation(savedConsultation);
    setCasoId(savedCasoId);
    setTypebotReady(true);
    
    // Clean up localStorage after getting data
    localStorage.removeItem('userConsultation');
    localStorage.removeItem('casoId');

    SecureLogger.info('Essential data loaded for Typebot', 'chat');
  }, [navigate]);

  // PRIORITY 2: Background operations - only run after Typebot is ready
  useEffect(() => {
    if (!typebotReady || !casoId) return;

    // Longer delay to ensure Typebot loads completely first
    const backgroundTimer = setTimeout(() => {
      SecureLogger.info('Starting background operations', 'chat');
      
      // Check case status immediately
      checkCaseStatus(casoId);
      
      // Setup realtime subscriptions
      const cleanupRealtime = setupRealtimeSubscriptions();
      
      // Setup polling fallback
      const cleanupPolling = setupPollingFallback();
      
      return () => {
        cleanupRealtime?.();
        cleanupPolling?.();
      };
    }, 3000); // 3 seconds delay

    return () => clearTimeout(backgroundTimer);
  }, [typebotReady, casoId]);

  // Debug effect to monitor proposal state
  useEffect(() => {
    if (showProposal) {
      SecureLogger.info(`Proposal modal state: showProposal=${showProposal}, proposalData=${!!proposalData}`, 'chat');
    }
  }, [showProposal, proposalData]);

  const backgroundOperations = async () => {
    SecureLogger.info('Starting background operations', 'chat');
    
    // Link case to user if authenticated
    if (user && !caseLinked) {
      await linkCaseToUser(user.id, casoId);
    }
    
    // Check case status
    await checkCaseStatus(casoId);
    
    // Set up real-time subscriptions after a longer delay
    setTimeout(() => {
      setupRealtimeSubscriptions();
      setupPollingFallback();
    }, 2000);
  };

  const linkCaseToUser = async (userId: string, caseId: string) => {
    if (!userId || !caseId || caseLinked) return;

    try {
      SecureLogger.info('Linking case to user', 'chat');
      
      const sessionToken = localStorage.getItem('current_session_token');
      
      if (!sessionToken) {
        SecureLogger.error('No session token found for case linking', 'chat');
        return;
      }

      const { data, error } = await supabase.rpc('assign_anonymous_case_to_user', {
        p_caso_id: caseId,
        p_session_token: sessionToken,
        p_user_id: userId
      });

      if (error) {
        SecureLogger.error(error, 'assign_anonymous_case_error');
        return;
      }

      if (!data) {
        SecureLogger.error('Case assignment returned false', 'chat');
        return;
      }

      SecureLogger.info('Case linked to user successfully', 'chat');
      setCaseLinked(true);

      // Transfer case data to profile
      await transferCaseDataToProfile(userId, caseId);

      // Clean up tokens after successful assignment
      localStorage.removeItem('current_caso_id');
      localStorage.removeItem('current_session_token');
      
    } catch (error) {
      SecureLogger.error(error, 'link_case_to_user');
    }
  };

  const checkCaseStatus = async (caseId: string) => {
    if (!caseId) return;
    
    try {
      SecureLogger.info('Checking case status', 'chat');
      
      const { data, error } = await supabase
        .from('casos')
        .select('estado, propuesta_estructurada')
        .eq('id', caseId)
        .maybeSingle();

      if (error) {
        SecureLogger.error(error, 'check_case_status');
        return;
      }

      if (!data) {
        SecureLogger.info('No case found', 'chat');
        return;
      }

      SecureLogger.info(`Case status: ${data.estado}, has proposal: ${!!data.propuesta_estructurada}`, 'chat');

      if (data && data.estado === 'listo_para_propuesta' && data.propuesta_estructurada) {
        SecureLogger.info('Case is ready for proposal - SHOWING MODAL', 'chat');
        setProposalData(data.propuesta_estructurada);
        setShowProposal(true);
        setShowPaymentButton(false);
        setProposalNotificationShown(true);
      }
    } catch (error) {
      SecureLogger.error(error, 'check_case_status');
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!casoId) return () => {};

    SecureLogger.info('Setting up realtime subscription for caso', 'chat');

    const channel = supabase
      .channel(`caso-${casoId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'casos',
          filter: `id=eq.${casoId}`,
        },
        (payload) => {
          SecureLogger.info('Realtime: Caso updated', 'chat');
          const newCaso = payload.new;
          
          if (newCaso && newCaso.estado === 'listo_para_propuesta' && newCaso.propuesta_estructurada) {
            SecureLogger.info('Realtime: Showing proposal', 'chat');
            setProposalData(newCaso.propuesta_estructurada);
            setShowProposal(true);
            setShowPaymentButton(false);
            setProposalNotificationShown(true);
          }
        }
      )
      .subscribe((status) => {
        SecureLogger.info('Realtime subscription status', 'chat');
      });

    // Clean up on unmount
    return () => {
      SecureLogger.info('Cleaning up realtime subscription', 'chat');
      supabase.removeChannel(channel);
    };
  };

  const setupPollingFallback = () => {
    if (!casoId) return () => {};

    SecureLogger.info('Setting up polling fallback for case', 'chat');
    
    // Polling más agresivo al inicio, luego más lento
    let pollCount = 0;
    const initialInterval = setInterval(() => {
      if (pollCount < 10) { // Primeros 10 polls cada 5 segundos
        SecureLogger.info('Initial polling: Checking case status', 'chat');
        checkCaseStatus(casoId);
        pollCount++;
      } else {
        clearInterval(initialInterval);
        // Después de 10 polls, cambiar a polling más lento
        const slowInterval = setInterval(() => {
          if (!showProposal) {
            SecureLogger.info('Slow polling: Checking case status', 'chat');
            checkCaseStatus(casoId);
          } else {
            clearInterval(slowInterval);
          }
        }, 30000); // Cada 30 segundos
      }
    }, 5000); // Cada 5 segundos al inicio

    return () => {
      clearInterval(initialInterval);
    };
  };

  const transferCaseDataToProfile = async (userId: string, caseId: string) => {
    try {
      SecureLogger.info('Starting data transfer process for user', 'chat');
      
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('nombre, apellido, email, telefono')
        .eq('id', userId)
        .single();

      if (profileError) {
        SecureLogger.error(profileError, 'profile_error');
        return;
      }

      // Solo actualizar si no hay datos existentes
      if (existingProfile && (!existingProfile.nombre || !existingProfile.apellido)) {
        const { data: casoData, error: casoError } = await supabase
          .from('casos')
          .select('nombre_borrador, apellido_borrador, email_borrador, telefono_borrador, nombre_gerente_borrador, apellido_gerente_borrador, email_gerente_borrador, telefono_gerente_borrador')
          .eq('id', caseId)
          .single();

        if (casoError) {
          SecureLogger.error(casoError, 'case_data_error');
        } else if (casoData) {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          
          if (currentUser) {
          const profileUpdate = {
              nombre: casoData.nombre_borrador || existingProfile.nombre,
              apellido: casoData.apellido_borrador || existingProfile.apellido,
              email: casoData.email_borrador || existingProfile.email || currentUser.email,
              telefono: casoData.telefono_borrador || existingProfile.telefono,
          };

          const { error: updateError } = await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('id', userId);

          if (updateError) {
              SecureLogger.error(updateError, 'profile_update');
          } else {
              SecureLogger.info('Profile updated successfully with case data', 'chat');
            toast({
              title: "¡Datos guardados!",
              description: "Tus datos han sido transferidos correctamente a tu perfil.",
            });
            }
          }
        }
      }
    } catch (error) {
      SecureLogger.error(error, 'transfer_case_data_to_profile');
    }
  };

  // Secure communication with Typebot
  useEffect(() => {
    const handleTypebotMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      const { type, mode } = event.data;

      if (type === 'SHOW_AUTH_MODAL' && (mode === 'login' || mode === 'signup')) {
        SecureLogger.info('Valid auth modal request received', 'chat');
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
    SecureLogger.info('Selected session', 'chat');
  };

  const handleProposalClose = () => {
    setShowProposal(false);
    setShowPaymentButton(true);
  };

  const handleAuthSuccessWithCaseData = async () => {
    SecureLogger.info('Starting handleAuthSuccessWithCaseData process', 'chat');
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
        SecureLogger.info('Auth success message sent to Typebot', 'chat');
      }
    }, 1000);
  };

  // Validate Typebot configuration
  if (!TYPEBOT_CONFIG.TYPEBOT_NAME || !TYPEBOT_CONFIG.TYPEBOT_API_HOST) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Error de Configuración
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Falta configurar las variables de entorno para Typebot. Por favor, contacta al administrador.
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-500 space-y-2">
            <p>Variables requeridas:</p>
            <ul className="text-left space-y-1">
              <li>• VITE_TYPEBOT_NAME</li>
              <li>• VITE_TYPEBOT_API_HOST</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while we get essential data
  if (!typebotReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Iniciando VitorIA...</p>
        </div>
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
                    <img src="/logo.svg" alt="klamAI Logo" className="h-8" />                    <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">KlamAI</span>
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

          {/* Chat Container - Typebot loads immediately */}
          <div className={cn(
            "flex-1 transition-all duration-300 relative z-10",
            sidebarOpen ? "lg:ml-0" : "lg:ml-0"
          )}>
            <div className="h-full relative">
              <Standard
                typebot={TYPEBOT_CONFIG.TYPEBOT_NAME}
                apiHost={TYPEBOT_CONFIG.TYPEBOT_API_HOST}
                style={{ width: "100%", height: "100%" }}
                prefilledVariables={{
                  "utm_value": userConsultation || "Hola, necesito asesoramiento legal",
                  "caso_id": casoId || ""
                }}
                isPreview={false}
              />
              
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
