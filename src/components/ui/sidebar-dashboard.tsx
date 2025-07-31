import React, { useState, createContext, useContext, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// Hook para detectar el tamaño de pantalla
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Verificar si estamos en el navegador
    if (typeof window !== 'undefined') {
      checkIsMobile();
      window.addEventListener('resize', checkIsMobile);
      return () => window.removeEventListener('resize', checkIsMobile);
    }
  }, []);

  return isMobile;
};

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebarDashboard = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarDashboard must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const SidebarDashboard = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = ({ className, children, ...props }: React.ComponentProps<"div">) => {
  return (
    <div className={className} {...props}>
      <DesktopSidebar>{children}</DesktopSidebar>
      <MobileSidebar>{children}</MobileSidebar>
    </div>
  );
};

export const DesktopSidebar = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  const { open, setOpen, animate } = useSidebarDashboard();
  return (
    <motion.div
      className={cn(
        "h-full px-4 py-4 hidden md:flex md:flex-col bg-black dark:bg-black w-[240px] flex-shrink-0",
        className
      )}
      animate={{
        width: animate ? (open ? "240px" : "60px") : "240px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  const { open, setOpen } = useSidebarDashboard();
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-black dark:bg-black w-full"
        )}
      >
        <div className="flex justify-end z-20 w-full">
          <Menu
            className="text-white dark:text-white cursor-pointer"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <>
              {/* Overlay para cerrar el sidebar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setOpen(false)}
              />
              {/* Sidebar móvil */}
              <motion.div
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
                className={cn(
                  "fixed h-full w-80 max-w-[80vw] inset-y-0 left-0 bg-black dark:bg-black p-6 z-50 flex flex-col",
                  className
                )}
              >
                <button
                  type="button"
                  className="absolute right-4 top-4 z-50 text-white dark:text-white cursor-pointer hover:bg-white hover:bg-opacity-10 rounded-full p-1 transition-colors"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar sidebar"
                >
                  <X className="h-6 w-6" />
                </button>
                <div className="mt-12">
                  {children}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  onClick,
  onNavigate,
  ...props
}: {
  link: Links;
  className?: string;
  onClick?: () => void;
  onNavigate?: (href: string) => void;
}) => {
  const { open, setOpen, animate } = useSidebarDashboard();
  const isMobile = useIsMobile();
  
  // En móvil siempre mostrar el texto
  const shouldShowText = isMobile || open || !animate;
  
  // Función para cerrar el sidebar en móvil
  const handleClick = () => {
    const isMobileScreen = window.innerWidth < 768;
    console.log('handleClick ejecutado, isMobileScreen:', isMobileScreen, 'open:', open);
    if (isMobileScreen && open) {
      console.log('Cerrando sidebar móvil');
      setOpen(false);
    }
  };
  
  // Si tiene onClick, usar button
  if (onClick) {
    return (
      <button
        onClick={() => {
          onClick();
          handleClick();
        }}
        className={cn(
          "flex items-center justify-start gap-2 group/sidebar py-2 w-full text-left",
          className
        )}
        {...props}
      >
        {link.icon}
        <motion.span
          animate={{
            display: shouldShowText ? "inline-block" : "none",
            opacity: shouldShowText ? 1 : 0,
          }}
          className="text-white dark:text-white text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
        >
          {link.label}
        </motion.span>
      </button>
    );
  }

  // Si tiene onNavigate, usar button
  if (onNavigate) {
    return (
      <button
        onClick={() => {
          handleClick(); // Siempre ejecutar handleClick primero
          onNavigate(link.href);
        }}
        className={cn(
          "flex items-center justify-start gap-2 group/sidebar py-2 w-full text-left",
          className
        )}
        {...props}
      >
        {link.icon}
        <motion.span
          animate={{
            display: shouldShowText ? "inline-block" : "none",
            opacity: shouldShowText ? 1 : 0,
          }}
          className="text-white dark:text-white text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
        >
          {link.label}
        </motion.span>
      </button>
    );
  }

  // Si no tiene onClick ni onNavigate, usar Link pero con handleClick
  return (
    <Link
      to={link.href}
      onClick={() => {
        handleClick(); // Siempre ejecutar handleClick
      }}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2",
        className
      )}
      {...props}
    >
      {link.icon}
      <motion.span
        animate={{
          display: shouldShowText ? "inline-block" : "none",
          opacity: shouldShowText ? 1 : 0,
        }}
        className="text-white dark:text-white text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

export const Logo = () => {
  const { setOpen } = useSidebarDashboard();
  const isMobile = useIsMobile();
  
  const handleLogoClick = () => {
    if (isMobile) {
      setOpen(false);
    }
  };

  return (
    <Link
      to="/abogados/dashboard"
      onClick={handleLogoClick}
      className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
    >
      <img src="/logo2.svg" alt="klamAI Logo" className="h-8" />      
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-bold text-white dark:text-white whitespace-pre text-xl tracking-tight"
      >
        
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  const { setOpen } = useSidebarDashboard();
  const isMobile = useIsMobile();
  
  const handleLogoClick = () => {
    if (isMobile) {
      setOpen(false);
    }
  };

  return (
    <Link
      to="/abogados/dashboard"
      onClick={handleLogoClick}
      className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
    >
      <img src="/logo.svg" alt="klamAI Logo" className="h-8" />      
    </Link>
  );
};
