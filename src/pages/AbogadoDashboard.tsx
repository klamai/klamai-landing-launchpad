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
  Briefcase
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useSuperAdminStats } from "@/hooks/useSuperAdminStats";
import SuperAdminMetrics from "@/components/SuperAdminMetrics";
import CasesManagement from "@/components/CasesManagement";
import LawyersManagement from "@/components/LawyersManagement";

const AbogadoDashboard = () => {
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
    if (path.includes('/casos')) {
      setActiveSection("casos");
    } else if (path.includes('/abogados')) {
      setActiveSection("abogados");
    } else if (path.includes('/reportes')) {
      setActiveSection("reportes");
    } else if (path.includes('/configuracion')) {
      setActiveSection("configuracion");
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

  // Function to handle navigation and close sidebar on mobile
  const handleNavigation = (href: string) => {
    navigate(href);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) { // md breakpoint
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
      label: "Gestión de Casos",
      href: "/abogados/dashboard/casos",
      icon: (
        <Scale className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Gestión de Abogados",
      href: "/abogados/dashboard/abogados",
      icon: (
        <Users className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Reportes",
      href: "/abogados/dashboard/reportes",
      icon: (
        <FileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Configuración",
      href: "/abogados/dashboard/configuracion",
      icon: (
        <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Notificaciones",
      href: "/abogados/dashboard/notificaciones",
      icon: (
        <Bell className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div
        className={cn(
          "flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden h-screen"
        )}
      >
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
                      <Sun className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" /> :
                      <Moon className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                  }}
                  onClick={toggleDarkMode}
                />
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
            <div>
              <SidebarLink
                link={{
                  label: `${user?.user_metadata?.nombre || "Super"} Admin`,
                  href: "#",
                  icon: (
                    <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                      <UserCheck className="h-4 w-4" />
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
      case "casos":
        return <CasesManagementSection />;
      case "abogados":
        return <LawyersManagementSection />;
      case "reportes":
        return <ReportesSection />;
      case "configuracion":
        return <ConfiguracionSection />;
      case "notificaciones":
        return <NotificacionesSection />;
      default:
        return <SuperAdminDashboardSection />;
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-2 md:p-10 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 min-h-full">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const SuperAdminDashboardSection = () => {
  const { stats } = useSuperAdminStats();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Panel de Administración - klamAI
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Dashboard para la gestión completa de casos y abogados del bufete.
        </p>
      </div>

      <SuperAdminMetrics />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-indigo-600" />
            Casos Recientes
          </h3>
          <div className="space-y-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Últimos casos ingresados al sistema
            </div>
            <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">Cargando casos recientes...</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <UserCheck className="h-5 w-5 mr-2 text-green-600" />
            Actividad de Abogados
          </h3>
          <div className="space-y-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Rendimiento y asignaciones activas
            </div>
            <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">Cargando actividad...</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const CasesManagementSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Casos</h1>
      <CasesManagement />
    </motion.div>
  );
};

const LawyersManagementSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Abogados</h1>
      <LawyersManagement />
    </motion.div>
  );
};

const ReportesSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes y Analytics</h1>
    <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-8 text-center border border-gray-200 dark:border-neutral-700">
      <FileText className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400">Sistema de reportes próximamente disponible</p>
    </div>
  </motion.div>
);

const ConfiguracionSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración del Sistema</h1>
    <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-8 text-center border border-gray-200 dark:border-neutral-700">
      <Settings className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400">Panel de configuración próximamente disponible</p>
    </div>
  </motion.div>
);

const NotificacionesSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Centro de Notificaciones</h1>
    <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-8 text-center border border-gray-200 dark:border-neutral-700">
      <Bell className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400">Centro de notificaciones próximamente disponible</p>
    </div>
  </motion.div>
);

export default AbogadoDashboard;