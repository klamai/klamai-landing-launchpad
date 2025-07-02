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
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check for dark mode preference
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  // Get active section from URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/casos')) {
      setActiveSection("casos");
    } else if (path.includes('/nueva-consulta')) {
      setActiveSection("nueva-consulta");
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
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
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
      href: "/dashboard",
      icon: (
        <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Nueva Consulta",
      href: "/dashboard/nueva-consulta",
      icon: (
        <MessageCirclePlus className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Mis Casos",
      href: "/dashboard/casos",
      icon: (
        <FolderOpen className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Perfil",
      href: "/dashboard/perfil",
      icon: (
        <UserCog className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Configuración",
      href: "/dashboard/configuracion",
      icon: (
        <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Facturación",
      href: "/dashboard/facturacion",
      icon: (
        <CreditCard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Notificaciones",
      href: "/dashboard/notificaciones",
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
                  label: user?.user_metadata?.nombre || user?.email || "Usuario",
                  href: "/dashboard/perfil",
                  icon: (
                    <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                      {(user?.user_metadata?.nombre || user?.email || "U")[0].toUpperCase()}
                    </div>
                  ),
                }}
                onNavigate={handleNavigation}
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
  const { user } = useAuth();

  const renderContent = () => {
    switch (activeSection) {
      case "nueva-consulta":
        return <NuevaConsultaSection />;
      case "casos":
        // Check if we're viewing a specific case
        if (location.pathname.includes('/casos/') && location.pathname.split('/').length > 3) {
          return <CaseDetailTabs />;
        }
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
    <div className="flex flex-1">
      <div className="p-2 md:p-10 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

const DashboardSection = () => {
  const { user } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Bienvenido a klamAI
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Hola {user?.user_metadata?.nombre || user?.email}, aquí tienes tu dashboard legal inteligente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[
          { title: "Consultas Activas", value: "3", color: "bg-blue-500", textColor: "text-blue-600" },
          { title: "Casos Resueltos", value: "12", color: "bg-green-500", textColor: "text-green-600" },
          { title: "Documentos", value: "8", color: "bg-purple-500", textColor: "text-purple-600" },
          { title: "Notificaciones", value: "2", color: "bg-orange-500", textColor: "text-orange-600" }
        ].map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-6 border border-gray-200 dark:border-neutral-700"
          >
            <div className="flex items-center">
              <div className={`${stat.color} h-3 w-3 rounded-full mr-3`}></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className={`text-2xl font-bold ${stat.textColor} dark:text-white`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Actividad Reciente
          </h3>
          <div className="space-y-4">
            {[
              "Nueva consulta sobre derecho laboral",
              "Documento de contrato revisado",
              "Cita programada para mañana",
              "Respuesta de abogado recibida"
            ].map((activity, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{activity}</p>
              </div>
            ))}
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Próximas Acciones
          </h3>
          <div className="space-y-4">
            {[
              "Revisar propuesta de acuerdo",
              "Completar formulario fiscal",
              "Contactar con abogado especialista",
              "Programar nueva consulta"
            ].map((action, i) => (
              <div key={i} className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-300">{action}</p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  Ver
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Placeholder sections - these will be implemented later
const NuevaConsultaSection = () => {
  const NuevaConsulta = React.lazy(() => import("@/components/NuevaConsulta"));
  
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <NuevaConsulta />
    </React.Suspense>
  );
};

const MisCasosSection = () => {
  const MisCasos = React.lazy(() => import("@/components/MisCasos"));
  
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <MisCasos />
    </React.Suspense>
  );
};

const CaseDetailTabs = () => {
  const CaseDetail = React.lazy(() => import("@/components/CaseDetailTabs"));
  
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CaseDetail />
    </React.Suspense>
  );
};

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
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
            {(user?.user_metadata?.nombre || user?.email || "U")[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user?.user_metadata?.nombre || "Usuario"}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{user?.email}</p>
          </div>
        </div>
        <p className="text-gray-500 dark:text-gray-400">Funcionalidad de edición de perfil próximamente disponible</p>
      </div>
    </motion.div>
  );
};

const ConfiguracionSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
    <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-8 text-center border border-gray-200 dark:border-neutral-700">
      <Settings className="h-16 w-16 text-blue-500 mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400">Panel de configuración próximamente disponible</p>
    </div>
  </motion.div>
);

const FacturacionSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Facturación</h1>
    <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-8 text-center border border-gray-200 dark:border-neutral-700">
      <CreditCard className="h-16 w-16 text-blue-500 mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400">Información de facturación próximamente disponible</p>
    </div>
  </motion.div>
);

const NotificacionesSection = () => {
  const NotificationCenter = React.lazy(() => import("@/components/NotificationCenter"));
  
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <NotificationCenter />
    </React.Suspense>
  );
};

export default Dashboard;
