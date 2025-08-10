import React, { useState, useEffect } from "react";
import { SidebarDashboard, SidebarBody, SidebarLink, Logo, LogoIcon } from "@/components/ui/sidebar-dashboard";
import { 
  LayoutDashboard, 
  MessageCirclePlus, 
  FolderOpen, 
  UserCog, 
  Settings, 
  CreditCard, 
  Bell, 
  LogOut, 
  Moon, 
  Sun
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import DashboardSection from "./dashboard/DashboardSection";
import NuevaConsultaSection from "./dashboard/NuevaConsultaSection";
import MisCasosSection from "./dashboard/MisCasosSection";
import PerfilSection from "./dashboard/PerfilSection";
import ConfiguracionSection from "./dashboard/ConfiguracionSection";
import FacturacionSection from "./dashboard/FacturacionSection";
import NotificacionesSection from "./dashboard/NotificacionesSection";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { motion } from "framer-motion";

const ClientDashboard = () => {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Dark mode effect
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Get active section from URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/nueva-consulta')) {
      setActiveSection("nueva-consulta");
    } else if (path.includes('/casos')) {
      setActiveSection("casos");
    } else if (path.includes('/perfil')) {
      setActiveSection("perfil");
    } else if (path.includes('/configuracion')) {
      setActiveSection("configuracion");
    } else if (path.includes('/facturacion')) {
      setActiveSection("facturacion");
    } else if (path.includes('/notificaciones')) {
      setActiveSection("notificaciones");
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
      href: "/dashboard",
      icon: <LayoutDashboard className="text-white dark:text-white h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Nueva Consulta",
      href: "/dashboard/nueva-consulta",
      icon: <MessageCirclePlus className="text-white dark:text-white h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Mis Casos",
      href: "/dashboard/casos",
      icon: <FolderOpen className="text-white dark:text-white h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Perfil",
      href: "/dashboard/perfil",
      icon: <UserCog className="text-white dark:text-white h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Configuración",
      href: "/dashboard/configuracion",
      icon: <Settings className="text-white dark:text-white h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Facturación",
      href: "/dashboard/facturacion",
      icon: <CreditCard className="text-white dark:text-white h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Notificaciones",
      href: "/dashboard/notificaciones",
      icon: <Bell className="text-white dark:text-white h-5 w-5 flex-shrink-0" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 mx-auto overflow-hidden h-screen">
        <SidebarDashboard open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-10">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              {open ? <Logo userType="client" /> : <LogoIcon userType="client" />}
              <div className="mt-8 flex flex-col gap-2">
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
                    icon: <LogOut className="text-white dark:text-white h-5 w-5 flex-shrink-0" />,
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
                    href: "#",
                     icon: (() => {
                      const displayName = (profile?.nombre && profile?.apellido)
                        ? `${profile.nombre} ${profile.apellido}`
                        : (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.nombre || user?.email?.split('@')[0] || "Cliente");
                      const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                      const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
                      
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
                />
                 {open && (
                  <div
                    className="text-sm font-medium text-neutral-700 dark:text-neutral-200 transition-all duration-200"
                  >
                    {(profile?.nombre && profile?.apellido)
                      ? `${profile.nombre} ${profile.apellido}`
                      : (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "Cliente")}
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
                    onClick={() => handleNavigation("/dashboard/notificaciones")}
                    className="p-2 rounded-lg hover:bg-primary/10 transition-all duration-200 relative"
                    title="Notificaciones"
                  >
                    <Bell className="text-white dark:text-white h-4 w-4" />
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
      case "nueva-consulta":
        return <NuevaConsultaSection />;
      case "casos":
        return <MisCasosSection />;
      case "perfil":
        return <PerfilSection />;
      case "configuracion":
        return <ConfiguracionSection />;
      case "facturacion":
        return <FacturacionSection />;
      case "notificaciones":
        return <NotificacionesSection />;
      default:
        return <DashboardSection />;
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

export default ClientDashboard; 