import React, { useState, useEffect } from "react";
import { SidebarDashboard, SidebarBody, SidebarLink, Logo, LogoIcon } from "@/components/ui/sidebar-dashboard";
import { 
  LayoutDashboard, 
  FileText, 
  Bot, 
  UserPlus, 
  MessageSquare,
  Bell,
  User,
  LogOut,
  Moon,
  Sun,
  Scale,
  UserCheck
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAssignedCases } from "@/hooks/lawyer/useAssignedCases";
import AssignedCasesManagement from "./lawyer/AssignedCasesManagement";
import RegularLawyerMetrics from "./lawyer/RegularLawyerMetrics";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const RegularLawyerDashboard = () => {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  // Get active section from URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/mis-casos')) {
      setActiveSection("mis-casos");
    } else if (path.includes('/hojas-encargo')) {
      setActiveSection("hojas-encargo");
    } else if (path.includes('/asistente-ia')) {
      setActiveSection("asistente-ia");
    } else if (path.includes('/chat-clientes')) {
      setActiveSection("chat-clientes");
    } else if (path.includes('/notificaciones')) {
      setActiveSection("notificaciones");
    } else if (path.includes('/perfil')) {
      setActiveSection("perfil");
    } else {
      setActiveSection("dashboard");
    }
  }, [location.pathname]);

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

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
        variant: "default"
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Error al cerrar sesión",
        variant: "destructive",
      });
    }
  };

  const handleNavigation = (href: string) => {
    navigate(href);
    if (window.innerWidth < 768) {
      setOpen(false);
    }
  };

  const links = [
    {
      label: "Dashboard",
      href: "/abogados/dashboard",
      icon: (
        <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Mis Casos Asignados",
      href: "/abogados/dashboard/mis-casos",
      icon: (
        <Scale className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Hojas de Encargo",
      href: "/abogados/dashboard/hojas-encargo",
      icon: (
        <FileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Asistente IA",
      href: "/abogados/dashboard/asistente-ia",
      icon: (
        <Bot className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Chat con Clientes",
      href: "/abogados/dashboard/chat-clientes",
      icon: (
        <MessageSquare className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Notificaciones",
      href: "/abogados/dashboard/notificaciones",
      icon: (
        <Bell className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Mi Perfil",
      href: "/abogados/dashboard/perfil",
      icon: (
        <UserCheck className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div
        className="flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 mx-auto overflow-hidden h-screen"
      >
        <SidebarDashboard open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-10 ">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              {open ? <Logo /> : <LogoIcon />}
              <div className="mt-8 flex flex-col gap-2 ">
                {links.map((link, idx) => (
                  <SidebarLink 
                    key={idx} 
                    link={link} 
                    onNavigate={handleNavigation}
                  />
                ))}
                <SidebarLink 
                  link={{
                    label: "Cerrar Sesión",
                    href: "#",
                    icon: (
                      <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                    ),
                  }}
                  onClick={handleSignOut}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <SidebarLink
                link={{
                  label: "", // Sin nombre, solo avatar
                  href: "/abogados/dashboard/perfil",
                  icon: (() => {
                    const displayName = `${user?.user_metadata?.nombre || "Abogado"} ${user?.user_metadata?.apellido || ""}`;
                    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    const avatarUrl = user?.user_metadata?.avatar_url;
                    
                    if (avatarUrl) {
                      return (
                        <div className="h-7 w-7 flex-shrink-0 rounded-full overflow-hidden">
                          <img 
                            src={avatarUrl} 
                            alt={displayName}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-sm font-medium hidden">
                            {initials}
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-sm font-medium">
                        {initials}
                      </div>
                    );
                  })(),
                }}
                onNavigate={handleNavigation}
              />
              
              {/* Controles de la derecha - solo cuando sidebar está abierto */}
              {open && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2"
                >
                  {/* Toggle de tema personalizado */}
                  <ThemeToggle 
                    isDark={darkMode}
                    onToggle={toggleDarkMode}
                  />
                  
                  {/* Icono de notificaciones */}
                  <button
                    onClick={() => handleNavigation("/abogados/dashboard/notificaciones")}
                    className="p-2 rounded-lg hover:bg-primary/10 transition-all duration-200 relative"
                    title="Notificaciones"
                  >
                    <Bell className="text-white dark:text-white h-4 w-4" />
                    {/* Aquí puedes agregar el indicador de notificaciones si lo necesitas */}
                  </button>
                </motion.div>
              )}
            </div>
          </SidebarBody>
        </SidebarDashboard>
        <DashboardContent activeSection={activeSection} />
      </div>
    </div>
  );
};

const DashboardContent = ({ activeSection }: { activeSection: string }) => {
  const renderContent = () => {
    switch (activeSection) {
      case "mis-casos":
        return <MisCasosAsignadosSection />;
      case "hojas-encargo":
        return <HojasEncargoSection />;
      case "asistente-ia":
        return <AsistenteIASection />;
      case "chat-clientes":
        return <ChatClientesSection />;
      case "notificaciones":
        return <NotificacionesSection />;
      case "perfil":
        return <PerfilSection />;
      default:
        return <RegularLawyerDashboardSection />;
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-black">
        <div className="p-2 md:p-10 rounded-tl-2xl bg-white dark:bg-neutral-900 min-h-full">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const RegularLawyerDashboardSection = () => {
  return <RegularLawyerMetrics />;
};

const MisCasosAsignadosSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <AssignedCasesManagement />
  </motion.div>
);

const HojasEncargoSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hojas de Encargo</h1>
    <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-8 text-center border border-gray-200 dark:border-neutral-700">
      <FileText className="h-16 w-16 text-blue-500 mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400">Sistema de hojas de encargo próximamente disponible</p>
    </div>
  </motion.div>
);

const AsistenteIASection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Asistente IA Legal</h1>
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-8 text-center border border-blue-200 dark:border-blue-800">
      <Bot className="h-20 w-20 text-blue-500 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Asistente Especializado para Abogados
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Obtén asistencia para redacción de documentos, análisis de casos y consultas legales.
      </p>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          🚀 Próximamente se integrará el chat Typebot especializado
        </p>
        <Button className="w-full">
          <Bot className="h-4 w-4 mr-2" />
          Iniciar Chat con IA
        </Button>
      </div>
    </div>
  </motion.div>
);

const ChatClientesSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chat con Clientes</h1>
    <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-8 text-center border border-gray-200 dark:border-neutral-700">
      <MessageSquare className="h-16 w-16 text-blue-500 mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400">Sistema de chat con clientes próximamente disponible</p>
    </div>
  </motion.div>
);

const NotificacionesSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notificaciones</h1>
    <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-8 text-center border border-gray-200 dark:border-neutral-700">
      <Bell className="h-16 w-16 text-blue-500 mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400">Centro de notificaciones próximamente disponible</p>
    </div>
  </motion.div>
);

const PerfilSection = () => {
  const { user } = useAuth();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
      <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-xl font-bold">
            {(user?.user_metadata?.nombre || user?.email || "A")[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user?.user_metadata?.nombre || "Abogado"} {user?.user_metadata?.apellido || ""}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{user?.email}</p>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Abogado Regular</p>
          </div>
        </div>
        <p className="text-gray-500 dark:text-gray-400">Funcionalidad de edición de perfil próximamente disponible</p>
      </div>
    </motion.div>
  );
};

export default RegularLawyerDashboard;
