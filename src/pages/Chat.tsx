
import { useState, useEffect } from "react";
import { Moon, Sun, Scale, Menu, X, Sidebar, Copyright } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Standard } from "@typebot.io/react";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import ChatHistory from "@/components/ChatHistory";
import AnimatedBackground from "@/components/AnimatedBackground";

const Chat = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [menuState, setMenuState] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userConsultation, setUserConsultation] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
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

  useEffect(() => {
    // Obtener el texto de consulta guardado en localStorage
    const savedConsultation = localStorage.getItem('userConsultation');
    if (savedConsultation) {
      setUserConsultation(savedConsultation);
      // Opcional: limpiar el localStorage después de usarlo
      localStorage.removeItem('userConsultation');
    }
  }, []);

  const handleLogoClick = () => {
    // Force a page reload when going back to home
    window.location.href = '/';
  };

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    // Aquí podrías cargar la conversación específica si es necesario
    console.log('Selected session:', sessionId);
  };

  return (
    <div className={`min-h-screen transition-all duration-300 font-sans ${darkMode ? 'dark' : ''}`}>
      <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800 flex flex-col">
        {/* Animated Background */}
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

        {/* Main Content with Sidebar */}
        <main className="pt-20 flex flex-1 h-[calc(100vh-8rem)] relative z-10">
          {/* Sidebar */}
          <div className={cn(
            "fixed lg:relative inset-y-0 left-0 z-30 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out pt-20 lg:pt-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            !sidebarOpen && "lg:w-0 lg:border-r-0"
          )}>
            {sidebarOpen && (
              <div className="h-full p-4">
                <ChatHistory onSelectSession={handleSelectSession} />
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
            <div className="h-full">
              <Standard
                typebot="open-ai-assistant-chat-30pe3ns"
                apiHost="https://bot.autoiax.com"
                style={{ width: "100%", height: "100%" }}
                prefilledVariables={{
                  "utm_value": userConsultation || "Hola, necesito asesoramiento legal"
                }}
              />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 py-3 px-4">
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-gray-900 dark:text-white">klamAI</span>
            </div>
            <div className="flex items-center gap-1">
              <Copyright className="h-3 w-3" />
              <span>2025</span>
            </div>
            <span>Asesoramiento jurídico con IA</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Chat;
