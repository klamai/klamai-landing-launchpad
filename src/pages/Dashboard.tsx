
import React, { useState, useEffect, useCallback, memo } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardContent from "@/components/DashboardContent";

const Dashboard = memo(() => {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const location = useLocation();

  // Inicializar modo oscuro desde localStorage
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

  // Obtener sección activa desde URL (memoizado)
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

  // Función optimizada para toggle de modo oscuro
  const handleToggleDarkMode = useCallback(() => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <DashboardLayout
      open={open}
      setOpen={setOpen}
      darkMode={darkMode}
      onToggleDarkMode={handleToggleDarkMode}
    >
      <DashboardContent activeSection={activeSection} />
    </DashboardLayout>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
