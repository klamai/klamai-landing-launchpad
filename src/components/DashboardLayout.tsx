
import React, { useState, useCallback, memo } from "react";
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
  Sun,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotificacionesNoLeidas } from "@/hooks/useNotificacionesNoLeidas";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { SidebarDashboard, SidebarBody, SidebarLink, Logo, LogoIcon } from "@/components/ui/sidebar-dashboard";
import { motion } from "framer-motion";

interface DashboardLayoutProps {
  children: React.ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const DashboardLayout = memo(({ 
  children, 
  open, 
  setOpen, 
  darkMode, 
  onToggleDarkMode 
}: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { count: notificacionesNoLeidas } = useNotificacionesNoLeidas();

  // Función optimizada para manejo de cierre de sesión
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      toast({
        title: "✅ Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
        variant: "default"
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: "Error al cerrar sesión",
        variant: "destructive",
      });
    }
  }, [signOut, navigate, toast]);

  // Función optimizada para navegación
  const handleNavigation = useCallback((href: string) => {
    navigate(href);
    // Cerrar sidebar en móvil después de navegación
    if (window.innerWidth < 768) { // md breakpoint
      setOpen(false);
    }
  }, [navigate, setOpen]);

  // Links memoizados con mejores iconos y organización
  const links = React.useMemo(() => [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      description: "Resumen general"
    },
    {
      label: "Nueva Consulta",
      href: "/dashboard/nueva-consulta",
      icon: <MessageCirclePlus className="text-primary h-5 w-5 flex-shrink-0" />,
      description: "Iniciar consulta con IA"
    },
    {
      label: "Mis Casos",
      href: "/dashboard/casos",
      icon: <FolderOpen className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      description: "Historial de casos"
    },
    {
      label: "Perfil",
      href: "/dashboard/perfil",
      icon: <UserCog className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      description: "Datos personales"
    },
    {
      label: "Configuración",
      href: "/dashboard/configuracion",
      icon: <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      description: "Preferencias"
    },
    {
      label: "Facturación",
      href: "/dashboard/facturacion",
      icon: <CreditCard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      description: "Pagos y suscripciones"
    },
    {
      label: "Notificaciones",
      href: "/dashboard/notificaciones",
      icon: (
        <div className="relative">
          <Bell className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
          {notificacionesNoLeidas > 0 && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full border border-white dark:border-gray-800"></span>
          )}
        </div>
      ),
      description: "Alertas y avisos"
    }
  ], []);

  // Información de usuario mejorada
  const userInfo = React.useMemo(() => {
    const displayName = user?.user_metadata?.nombre || user?.email || "Usuario";
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    
    return {
      label: displayName,
      href: "/dashboard/perfil",
      icon: (
        <div className="relative">
          <div className="h-8 w-8 flex-shrink-0 rounded-full bg-klamai-gradient flex items-center justify-center text-white text-sm font-semibold shadow-lg">
            {initials}
          </div>
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-success rounded-full border-2 border-background"></div>
        </div>
      )
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5">
      <div className="flex flex-col md:flex-row bg-background/80 backdrop-blur-sm w-full flex-1 mx-auto border border-border/50 overflow-hidden h-screen">
        <SidebarDashboard open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-10">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {open ? <Logo /> : <LogoIcon />}
              </motion.div>
              
              <div className="mt-8 flex flex-col gap-2">
                {/* Sección principal de navegación */}
                <div className="mb-4">
                  {open && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="px-3 mb-2"
                    >
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Navegación
                      </span>
                    </motion.div>
                  )}
                  {links.slice(0, 3).map((link, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                    >
                      <SidebarLink 
                        link={link} 
                        onNavigate={handleNavigation}
                        className="group hover:bg-primary/10 rounded-lg transition-all duration-200 mb-1"
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Sección de gestión */}
                <div className="mb-4">
                  {open && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="px-3 mb-2"
                    >
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Gestión
                      </span>
                    </motion.div>
                  )}
                  {links.slice(3).map((link, idx) => (
                    <motion.div
                      key={idx + 3}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: (idx + 3) * 0.1 }}
                    >
                      <SidebarLink 
                        link={link} 
                        onNavigate={handleNavigation}
                        className="group hover:bg-primary/10 rounded-lg transition-all duration-200 mb-1"
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Sección de utilidades */}
                <div className="mt-auto pt-4 border-t border-border/50">
                  {open && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="px-3 mb-2"
                    >
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Utilidades
                      </span>
                    </motion.div>
                  )}
                  
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 }}
                  >
                    <SidebarLink 
                      link={{
                        label: darkMode ? "Modo Claro" : "Modo Oscuro",
                        href: "#",
                        icon: darkMode ? 
                          <Sun className="text-amber-500 h-5 w-5 flex-shrink-0" /> :
                          <Moon className="text-blue-500 h-5 w-5 flex-shrink-0" />
                      }}
                      onClick={onToggleDarkMode}
                      className="group hover:bg-primary/10 rounded-lg transition-all duration-200 mb-1"
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.8 }}
                  >
                    <SidebarLink 
                      link={{
                        label: "Cerrar Sesión",
                        href: "#",
                        icon: <LogOut className="text-destructive h-5 w-5 flex-shrink-0" />
                      }}
                      onClick={handleSignOut}
                      className="group hover:bg-destructive/10 rounded-lg transition-all duration-200"
                    />
                  </motion.div>
                </div>
              </div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.9 }}
              className="border-t border-border/50 pt-4"
            >
              <SidebarLink
                link={userInfo}
                onNavigate={handleNavigation}
                className="group hover:bg-primary/10 rounded-lg transition-all duration-200 p-2"
              />
              {open && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="px-3 mt-2"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3 text-accent" />
                    <span>Powered by klamAI</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </SidebarBody>
        </SidebarDashboard>
        
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="p-4 md:p-8 rounded-tl-2xl border border-border/50 bg-background/80 backdrop-blur-sm min-h-full"
            >
              {children}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
});

DashboardLayout.displayName = 'DashboardLayout';

export default DashboardLayout;
