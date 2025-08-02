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
    } else if (path.includes('/pagos')) {
      setActiveSection("pagos");
    } else if (path.includes('/asistentes-ia')) {
      setActiveSection("asistentes-ia");
    } else if (path.includes('/perfil')) {
      setActiveSection("perfil");
    } else if (path.includes('/configuracion')) {
      setActiveSection("configuracion");
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
      label: "Mis Casos",
      href: "/abogados/dashboard/mis-casos",
      icon: (
        <Scale className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Pagos",
      href: "/abogados/dashboard/pagos",
      icon: (
        <FileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Asistentes IA",
      href: "/abogados/dashboard/asistentes-ia",
      icon: (
        <Bot className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Mi Perfil",
      href: "/abogados/dashboard/perfil",
      icon: (
        <UserCheck className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Configuración",
      href: "/abogados/dashboard/configuracion",
      icon: (
        <User className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
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
              {/* Avatar del usuario con nombre */}
              <div className="flex items-center gap-3">
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
                {open && (
                  <div
                    className="text-sm font-medium text-neutral-700 dark:text-neutral-200 transition-all duration-200"
                  >
                    {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "Abogado"}
                  </div>
                )}
              </div>
              
              {/* Controles de la derecha - solo cuando sidebar está abierto */}
              {open && (
                <div
                  className="flex items-center gap-2 transition-all duration-200"
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
                </div>
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
      case "pagos":
        return <PagosSection />;
      case "asistentes-ia":
        return <AsistentesIASection />;
      case "perfil":
        return <PerfilSection />;
      case "configuracion":
        return <ConfiguracionSection />;
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

const PagosSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pagos</h1>
    <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-8 text-center border border-gray-200 dark:border-neutral-700">
      <FileText className="h-16 w-16 text-blue-500 mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400">Sistema de pagos próximamente disponible</p>
    </div>
  </motion.div>
);

const AsistentesIASection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Asistentes IA</h1>
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-8 text-center border border-blue-200 dark:border-blue-800">
      <Bot className="h-20 w-20 text-blue-500 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Asistentes Especializados para Abogados
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

const ConfiguracionSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
    <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-8 text-center border border-gray-200 dark:border-neutral-700">
      <User className="h-16 w-16 text-blue-500 mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400">Panel de configuración próximamente disponible</p>
    </div>
  </motion.div>
);

const PerfilSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
      <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-8 text-center border border-gray-200 dark:border-neutral-700">
        <UserCheck className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Gestión de perfil próximamente disponible</p>
      </div>
    </motion.div>
  );
};

export default RegularLawyerDashboard;
