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

const ClientDashboard = () => {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const { user, signOut } = useAuth();
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
              {open ? <Logo /> : <LogoIcon />}
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
                    label: darkMode ? "Modo Claro" : "Modo Oscuro",
                    href: "#",
                    icon: darkMode ? 
                      <Sun className="text-white dark:text-white h-5 w-5 flex-shrink-0" /> :
                      <Moon className="text-white dark:text-white h-5 w-5 flex-shrink-0" />
                  }}
                  onClick={toggleDarkMode}
                />
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
            <div>
              <SidebarLink
                link={{
                  label: `${user?.user_metadata?.nombre || "Cliente"}`,
                  href: "#",
                  icon: (
                    <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-sm font-medium">
                      {(user?.user_metadata?.nombre || user?.email || "C")[0].toUpperCase()}
                    </div>
                  ),
                }}
              />
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