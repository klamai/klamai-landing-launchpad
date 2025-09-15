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
  UserPlus,
  Target,
  Clock,
  DollarSign
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useSuperAdminStats } from "@/hooks/queries/useSuperAdminStats";
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
    } catch (error: unknown) {
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
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-black dark:bg-black">
            <div className="p-4 sm:p-6 md:p-8 rounded-tl-2xl bg-white dark:bg-gray-950 min-h-full">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SuperAdminDashboardSection = () => {
  const { data: dashboardData, isLoading, error } = useSuperAdminStats();

  if (isLoading) {
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
        </div>
      </motion.div>
    );
  }

  if (error) {
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
            Error al cargar los datos del dashboard.
          </p>
        </div>
      </motion.div>
    );
  }

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

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Tasa de Conversión</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{dashboardData?.kpis.tasaConversion}%</p>
            </div>
            <Target className="h-8 w-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{dashboardData?.kpis.tiempoPromedioResolucion}d</p>
            </div>
            <Clock className="h-8 w-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Ingreso/Caso</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">€{dashboardData?.kpis.ingresosPromedioCaso.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border border-orange-200 dark:border-orange-800 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Satisfacción</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{dashboardData?.kpis.satisfaccionCliente}%</p>
            </div>
            <UserCheck className="h-8 w-8 text-orange-500" />
          </div>
        </motion.div>
      </div>

      {/* Componente de métricas moderno */}
      <div className="w-full">
        <SuperAdminMetrics />
      </div>

      {/* Gráfico de Cashflow con datos reales */}
      <div className="w-full">
        <CashflowChart
          data={dashboardData?.ingresosGastos}
          title="Análisis Financiero - Ingresos vs Gastos"
        />
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
            Tendencias de Casos
          </h3>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Evolución mensual de casos nuevos vs resueltos
            </div>
            <div className="space-y-2">
              {dashboardData?.tendenciasTemporales.slice(-3).map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded">
                  <span className="text-sm font-medium">{item.mes}</span>
                  <div className="flex gap-4 text-xs">
                    <span className="text-green-600">+{item.casosNuevos}</span>
                    <span className="text-blue-600">✓{item.casosResueltos}</span>
                  </div>
                </div>
              ))}
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
            Rendimiento de Abogados
          </h3>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Top 5 abogados por eficiencia
            </div>
            <div className="space-y-2">
              {dashboardData?.rendimientoAbogados.slice(0, 5).map((abogado, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium truncate max-w-32">{abogado.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{abogado.casosAsignados} casos</span>
                    <span className="text-xs font-medium text-green-600">{abogado.eficiencia}%</span>
                  </div>
                </div>
              ))}
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
