import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

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
          "h-16 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-black dark:bg-black w-full"
        )}
      >
        {/* Logo en la esquina superior izquierda */}
        <div className="flex items-center justify-center h-8 w-8">
          <img 
            src="/logo.svg" 
            alt="Logo" 
            className="h-8 w-8"
          />
        </div>
        
        {/* Menú hamburguesa en la derecha */}
        <div className="flex items-center justify-center h-8 w-8">
          <Menu
            className="text-white dark:text-white cursor-pointer h-6 w-6"
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
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 z-40"
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
                  "fixed h-full w-72 max-w-[75vw] left-0 top-0 bg-black dark:bg-black p-6 z-50 flex flex-col justify-between",
                  className
                )}
              >
                <div
                  className="absolute right-4 top-4 z-50 text-white dark:text-white cursor-pointer"
                  onClick={() => setOpen(false)}
                >
                  <X />
                </div>
                {children}
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
  const { open, animate } = useSidebarDashboard();
  
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex items-center justify-start gap-2 group/sidebar py-2 w-full text-left",
          className
        )}
        {...props}
      >
        {link.icon}
        <span
          className={cn(
            "text-white dark:text-white text-sm group-hover/sidebar:translate-x-1 transition-all duration-200 whitespace-pre",
            animate && !open ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
          )}
        >
          {link.label}
        </span>
      </button>
    );
  }

  if (onNavigate) {
    return (
      <button
        onClick={() => onNavigate(link.href)}
        className={cn(
          "flex items-center justify-start gap-2 group/sidebar py-2 w-full text-left",
          className
        )}
        {...props}
      >
        {link.icon}
        <span
          className={cn(
            "text-white dark:text-white text-sm group-hover/sidebar:translate-x-1 transition-all duration-200 whitespace-pre",
            animate && !open ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
          )}
        >
          {link.label}
        </span>
      </button>
    );
  }

  return (
    <Link
      to={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2",
        className
      )}
      {...props}
    >
      {link.icon}
      <span
        className={cn(
          "text-white dark:text-white text-sm group-hover/sidebar:translate-x-1 transition-all duration-200 whitespace-pre",
          animate && !open ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
        )}
      >
        {link.label}
      </span>
    </Link>
  );
};

export const Logo = ({ userType }: { userType?: 'admin' | 'lawyer' | 'client' }) => {
  return (
    <Link
      to={userType === 'client' ? "/dashboard" : "/abogados/dashboard"}
      className="font-normal flex flex-col items-center text-sm text-white py-1 relative z-20"
    >
      <img src="/logo2.svg" alt="klamAI Logo" className="h-8" />
      {userType && (
        <span className="text-xs mt-1 capitalize">
          {userType === 'admin' && 'Administración'}
          {userType === 'lawyer' && 'Abogados'}
          {userType === 'client' && 'Clientes'}
        </span>
      )}
    </Link>
  );
};

export const LogoIcon = ({ userType }: { userType?: 'admin' | 'lawyer' | 'client' }) => {
  return (
    <Link
      to={userType === 'client' ? "/dashboard" : "/abogados/dashboard"}
      className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
    >
      <img src="/logo.svg" alt="klamAI Logo" className="h-8" />
    </Link>
  );
};
