import React, { useState, useEffect } from "react";
import { SidebarDashboard, SidebarBody, SidebarLink, Logo, LogoIcon } from "@/components/ui/sidebar-dashboard";
import { 
  LayoutDashboard, 
  Scale, 
  Users, 
  FileText, 
  Settings, 
  Bell, 
  LogOut, 
  Moon, 
  Sun,
  UserCheck,
  Briefcase,
  Bot,
  UserPlus
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useSuperAdminStats } from "@/hooks/admin/useSuperAdminStats";
import SuperAdminMetrics from "@/components/admin/SuperAdminMetrics";
import CashflowChart from "@/components/shared/CashflowChart";
import CasesManagement from "@/components/admin/CasesManagement";
import LawyersManagement from "@/components/admin/LawyersManagement";
import LawyerApplicationsManagement from "@/components/admin/LawyerApplicationsManagement";
import ClientsManagement from "@/components/admin/ClientsManagement";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const SuperAdminDashboard = () => {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const { user, profile, signOut } = useAuth();
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
    if (path.includes('/casos')) {
      setActiveSection("casos");
    } else if (path.includes('/solicitudes-abogado')) {
      setActiveSection("solicitudes-abogado");
    } else if (path.includes('/clientes')) {
      setActiveSection("clientes");
    } else if (path.includes('/hojas-encargo')) {
      setActiveSection("hojas-encargo");
    } else if (path.includes('/reportes')) {
      setActiveSection("reportes");
    } else if (path.includes('/configuracion')) {
      setActiveSection("configuracion");
    } else if (path.includes('/notificaciones')) {
      setActiveSection("notificaciones");
    } else if (path.includes('/asistente-ia')) {
      setActiveSection("asistente-ia");
    } else if (path.includes('/abogados') && !path.endsWith('/dashboard')) {
      setActiveSection("abogados");
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
      href: "/admin/dashboard",
      icon: (
        <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Gestión de Casos",
      href: "/admin/dashboard/casos",
      icon: (
        <Scale className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Clientes",
      href: "/admin/dashboard/clientes",
      icon: (
        <Users className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Hojas de Encargo",
      href: "/admin/dashboard/hojas-encargo",
      icon: (
        <FileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Gestión de Abogados",
      href: "/admin/dashboard/abogados",
      icon: (
        <Users className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Solicitudes de Abogado",
      href: "/admin/dashboard/solicitudes-abogado",
      icon: (
        <UserPlus className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Reportes",
      href: "/admin/dashboard/reportes",
      icon: (
        <FileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Configuración",
      href: "/admin/dashboard/configuracion",
      icon: (
        <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Notificaciones",
      href: "/admin/dashboard/notificaciones",
      icon: (
        <Bell className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Asistente IA",
      href: "/admin/dashboard/asistente-ia",
      icon: (
        <Bot className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div
        className={cn(
          "flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 mx-auto overflow-hidden h-screen"
        )}
      >
        <SidebarDashboard open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-10 ">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              {open ? <Logo userType="admin" /> : <LogoIcon userType="admin" />}
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
                    icon: <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
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
                        : (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.nombre || user?.email?.split('@')[0] || "Super Admin");
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
                            <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium hidden">
                              <UserCheck className="h-4 w-4" />
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                          <UserCheck className="h-4 w-4" />
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
                      : (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "Super Admin")}
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
                    onClick={() => handleNavigation("/admin/dashboard/notificaciones")}
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
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-black">
            <div className="p-2 md:p-10 rounded-tl-2xl bg-white dark:bg-neutral-900 min-h-full">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SuperAdminDashboardSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-foreground mb-2">
          Panel de Administración - KlamAI
        </h1>
        <p className="text-sm text-muted-foreground">
          Dashboard para la gestión completa de casos y abogados del bufete.
        </p>
      </div>

      {/* Componente de métricas moderno */}
      <div className="w-full">
        <SuperAdminMetrics />
      </div>

      {/* Gráfico de Cashflow */}
      <div className="w-full">
        <CashflowChart />
      </div>

      {/* Sección de estadísticas adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-indigo-600" />
            Casos Recientes
          </h3>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Últimos casos ingresados al sistema
            </div>
            <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <p className="text-sm text-muted-foreground">Cargando casos recientes...</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <UserCheck className="h-5 w-5 mr-2 text-green-600" />
            Actividad de Abogados
          </h3>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Rendimiento y asignaciones activas
            </div>
            <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <p className="text-sm text-muted-foreground">Cargando actividad...</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export const CasesManagementSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-lg font-semibold text-foreground">Gestión de Casos</h1>
      <CasesManagement />
    </motion.div>
  );
};

export const LawyersManagementSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-lg font-semibold text-foreground">Gestión de Abogados</h1>
      <LawyersManagement />
    </motion.div>
  );
};

export const ClientsManagementSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-lg font-semibold text-foreground">Gestión de Clientes</h1>
      <ClientsManagement />
    </motion.div>
  );
};

export const LawyerApplicationsSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-lg font-semibold text-foreground">Solicitudes de Abogados</h1>
      <LawyerApplicationsManagement />
    </motion.div>
  );
};

export const HojasEncargoSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <h1 className="text-lg font-semibold text-foreground">Hojas de Encargo</h1>
    <p className="text-sm text-muted-foreground">
      Gestión de hojas de encargo y documentos legales.
    </p>
  </motion.div>
);

export const ReportesSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <h1 className="text-lg font-semibold text-foreground">Reportes</h1>
    <p className="text-sm text-muted-foreground">
      Generación y visualización de reportes del sistema.
    </p>
  </motion.div>
);

export const ConfiguracionSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <h1 className="text-lg font-semibold text-foreground">Configuración</h1>
    <p className="text-sm text-muted-foreground">
      Configuración general del sistema y preferencias.
    </p>
  </motion.div>
);

export const NotificacionesSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <h1 className="text-lg font-semibold text-foreground">Notificaciones</h1>
    <p className="text-sm text-muted-foreground">
      Gestión de notificaciones y alertas del sistema.
    </p>
  </motion.div>
);

export const AsistenteIASection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <h1 className="text-lg font-semibold text-foreground">Asistente IA</h1>
    <p className="text-sm text-muted-foreground">
      Configuración y gestión del asistente de inteligencia artificial.
    </p>
  </motion.div>
);

export default SuperAdminDashboard;
