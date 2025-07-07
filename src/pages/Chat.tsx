import { useState, useEffect } from "react";
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

  // Verificar que haya datos de consulta
  useEffect(() => {
    const savedConsultation = localStorage.getItem('userConsultation');
    const savedCasoId = localStorage.getItem('casoId');
    
    if (!savedConsultation || !savedCasoId) {
      navigate('/');
      return;
    }
    
    setUserConsultation(savedConsultation);
    setCasoId(savedCasoId);
    
    localStorage.removeItem('userConsultation');
    localStorage.removeItem('casoId');

    console.log('Datos recuperados del localStorage:', {
      consultation: savedConsultation,
      casoId: savedCasoId
    });
  }, [navigate]);

  // Función para vincular caso con usuario autenticado
  const linkCaseToUser = async (userId: string, caseId: string) => {
    if (!userId || !caseId || caseLinked) {
      console.log('Skipping case linking:', { userId: !!userId, caseId: !!caseId, caseLinked });
      return;
    }

    try {
      console.log('Linking case to user:', { userId, caseId });
      
      // Verificar si el caso ya está vinculado
      const { data: existingCase, error: checkError } = await supabase
        .from('casos')
        .select('cliente_id')
        .eq('id', caseId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing case:', checkError);
        return;
      }

      if (existingCase?.cliente_id === userId) {
        console.log('Case already linked to this user');
        setCaseLinked(true);
        return;
      }

      // Vincular el caso con el usuario
      const { error: linkError } = await supabase
        .from('casos')
        .update({ cliente_id: userId })
        .eq('id', caseId);

      if (linkError) {
        console.error('Error linking case to user:', linkError);
        toast({
          title: "Error",
          description: "Hubo un error al vincular el caso con tu perfil.",
          variant: "destructive"
        });
      } else {
        console.log('Case linked to user successfully');
        setCaseLinked(true);
        toast({
          title: "¡Caso vinculado!",
          description: "Tu caso ha sido asociado con tu perfil correctamente.",
        });
      }
    } catch (error) {
      console.error('Error in linkCaseToUser:', error);
    }
  };

  // Vincular caso cuando el usuario ya está autenticado desde el inicio
  useEffect(() => {
    if (user && casoId && !loading && !caseLinked) {
      console.log('User is already authenticated, linking case:', { userId: user.id, casoId });
      linkCaseToUser(user.id, casoId);
    }
  }, [user, casoId, loading, caseLinked]);

  // Función para verificar el estado del caso
  const checkCaseStatus = async (caseId: string) => {
    if (!caseId) return;
    
    try {
      console.log('Checking case status for ID:', caseId);
      console.log('Current auth state:', { 
        user: user?.id, 
        isAuthenticated: !!user 
      });
      
      const { data, error } = await supabase
        .from('casos')
        .select('estado, propuesta_estructurada')
        .eq('id', caseId)
        .maybeSingle();

      if (error) {
        console.error('Error checking case status:', error);
        return;
      }

      console.log('Current case data:', data);

      if (!data) {
        console.log('No case found with ID:', caseId);
        return;
      }

      if (data.estado === 'listo_para_propuesta' && data.propuesta_estructurada) {
        console.log('Case is ready for proposal! Showing modal...');
        setProposalData(data.propuesta_estructurada);
        setShowProposal(true);
        setShowPaymentButton(false);
        
        toast({
          title: "¡Tu propuesta está lista!",
          description: "Hemos preparado una propuesta personalizada para tu caso.",
        });
      } else {
        console.log('Case not ready for proposal:', {
          estado: data.estado,
          hasPropuesta: !!data.propuesta_estructurada
        });
      }
    } catch (error) {
      console.error('Error in checkCaseStatus:', error);
    }
  };

  // Verificación inicial del estado del caso
  useEffect(() => {
    if (casoId && !showProposal) {
      console.log('Setting up initial case status check for:', casoId);
      checkCaseStatus(casoId);
    }
  }, [casoId]);

  // Realtime subscription para detectar cambios de estado
  useEffect(() => {
    if (!casoId) return;

    console.log('Setting up realtime subscription for caso:', casoId);

    const channel = supabase
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
          console.log('Realtime: Caso updated via realtime:', payload);
          const newCaso = payload.new;
          
          if (newCaso && newCaso.estado === 'listo_para_propuesta' && newCaso.propuesta_estructurada) {
            console.log('Realtime: Showing proposal with data:', newCaso.propuesta_estructurada);
            setProposalData(newCaso.propuesta_estructurada);
            setShowProposal(true);
            
            toast({
              title: "¡Tu propuesta está lista!",
              description: "Hemos preparado una propuesta personalizada para tu caso.",
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [casoId, toast]);

  // Polling fallback - verificar cada 30 segundos como respaldo
  useEffect(() => {
    if (!casoId || showProposal) return;

    console.log('Setting up polling fallback for case:', casoId);
    
    const pollingInterval = setInterval(() => {
      if (!showProposal) {
        console.log('Polling: Checking case status...');
        checkCaseStatus(casoId);
      }
    }, 30000); // Cada 30 segundos

    return () => {
      console.log('Cleaning up polling interval');
      clearInterval(pollingInterval);
    };
  }, [casoId]);

  // Secure communication with Typebot
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

  const handleLogoClick = () => {
    window.location.href = '/';
  };

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    console.log('Selected session:', sessionId);
  };

  // Manejar cierre del modal de propuesta
  const handleProposalClose = () => {
    setShowProposal(false);
    setShowPaymentButton(true);
  };

  // Función mejorada para transferir datos del caso al perfil
  const transferCaseDataToProfile = async (userId: string, caseId: string) => {
    try {
      console.log('Starting data transfer process for user:', userId, 'case:', caseId);
      
      // Verificar si es un perfil nuevo (sin datos previos)
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('nombre, apellido, email, telefono')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error checking existing profile:', profileError);
        return;
      }

      console.log('Existing profile:', existingProfile);

      // Solo transferir datos si el perfil está vacío o es nuevo
      const isNewProfile = !existingProfile || 
        (!existingProfile.nombre && !existingProfile.apellido) ||
        existingProfile.nombre === '' || existingProfile.apellido === '';

      console.log('Is new profile?', isNewProfile);

      if (isNewProfile) {
        // Obtener todos los datos borrador del caso
        const { data: casoData, error: casoError } = await supabase
          .from('casos')
          .select(`
            nombre_borrador, apellido_borrador, email_borrador, telefono_borrador, 
            razon_social_borrador, nif_cif_borrador, tipo_perfil_borrador,
            ciudad_borrador, direccion_fiscal_borrador, nombre_gerente_borrador
          `)
          .eq('id', caseId)
          .maybeSingle();

        if (casoError) {
          console.error('Error fetching case data:', casoError);
        } else if (casoData) {
          console.log('Case data to transfer:', casoData);
          
          // Obtener datos del usuario autenticado
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          
          // Preparar datos para actualizar, usando valores del caso o fallbacks
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

          console.log('Profile update data:', profileUpdate);

          // Actualizar perfil con todos los datos disponibles
          const { error: updateError } = await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('id', userId);

          if (updateError) {
            console.error('Error updating profile:', updateError);
            toast({
              title: "Error",
              description: "Hubo un error al guardar tus datos. Por favor, actualízalos manualmente en tu perfil.",
              variant: "destructive"
            });
          } else {
            console.log('Profile updated successfully with case data');
            toast({
              title: "¡Datos guardados!",
              description: "Tus datos han sido transferidos correctamente a tu perfil.",
            });
          }
        }
      } else {
        console.log('Profile already has data, skipping transfer');
      }
    } catch (error) {
      console.error('Error in transferCaseDataToProfile:', error);
      toast({
        title: "Error",
        description: "Hubo un error al procesar tus datos. Por favor, revisa tu perfil.",
        variant: "destructive"
      });
    }
  };

  // Manejar éxito de autenticación y copia de datos del caso
  const handleAuthSuccessWithCaseData = async () => {
    console.log('Starting handleAuthSuccessWithCaseData process...');
    setShowAuthModal(false);
    
    // Esperar un momento para que el estado de autenticación se estabilice
    setTimeout(async () => {
      console.log('Processing auth success with case data...');
      
      // Obtener el usuario actual para asegurar datos frescos
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('Current user from auth:', currentUser?.id);
      
      if (currentUser && casoId) {
        // Transferir datos del caso al perfil
        await transferCaseDataToProfile(currentUser.id, casoId);
        
        // Vincular el caso con el usuario
        await linkCaseToUser(currentUser.id, casoId);
      } else {
        console.log('No user or case ID available for data transfer');
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
        console.log('Auth success message sent to Typebot:', successMessage);
      }
    }, 1000); // Esperar 1 segundo para que el perfil se cree completamente
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
              <Standard
                typebot="klamai-test-supabase-wyqehpx"
                apiHost="https://bot.autoiax.com"
                style={{ width: "100%", height: "100%" }}
                prefilledVariables={{
                  "utm_value": userConsultation || "Hola, necesito asesoramiento legal",
                  "caso_id": casoId || ""
                }}
              />
              
              {/* Botón flotante para continuar con planes */}
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

        {/* Modal de Autenticación */}
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccessWithCaseData}
          initialMode={authModalMode}
        />

        {/* Modal de Propuesta */}
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
