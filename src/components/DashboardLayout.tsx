
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
  Sun 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { SidebarDashboard, SidebarBody, SidebarLink, Logo, LogoIcon } from "@/components/ui/sidebar-dashboard";

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

  // Función optimizada para manejo de cierre de sesión
  const handleSignOut = useCallback(async () => {
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
  }, [signOut, navigate, toast]);

  // Función optimizada para navegación
  const handleNavigation = useCallback((href: string) => {
    navigate(href);
    // Cerrar sidebar en móvil después de navegación
    if (window.innerWidth < 768) { // md breakpoint
      setOpen(false);
    }
  }, [navigate, setOpen]);

  // Links memoizados
  const links = React.useMemo(() => [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Nueva Consulta",
      href: "/dashboard/nueva-consulta",
      icon: <MessageCirclePlus className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Mis Casos",
      href: "/dashboard/casos",
      icon: <FolderOpen className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Perfil",
      href: "/dashboard/perfil",
      icon: <UserCog className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Configuración",
      href: "/dashboard/configuracion",
      icon: <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Facturación",
      href: "/dashboard/facturacion",
      icon: <CreditCard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Notificaciones",
      href: "/dashboard/notificaciones",
      icon: <Bell className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    }
  ], []);

  // Información de usuario memoizada
  const userInfo = React.useMemo(() => ({
    label: user?.user_metadata?.nombre || user?.email || "Usuario",
    href: "/dashboard/perfil",
    icon: (
      <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
        {(user?.user_metadata?.nombre || user?.email || "U")[0].toUpperCase()}
      </div>
    )
  }), [user]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden h-screen">
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
                  onClick={onToggleDarkMode}
                />
                <SidebarLink 
                  link={{
                    label: "Cerrar Sesión",
                    href: "#",
                    icon: <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                  }}
                  onClick={handleSignOut}
                />
              </div>
            </div>
            <div>
              <SidebarLink
                link={userInfo}
                onNavigate={handleNavigation}
              />
            </div>
          </SidebarBody>
        </SidebarDashboard>
        
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-2 md:p-10 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 min-h-full">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

DashboardLayout.displayName = 'DashboardLayout';

export default DashboardLayout;
