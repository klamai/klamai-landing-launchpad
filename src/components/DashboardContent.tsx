
import React, { memo } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardSection from './dashboard/DashboardSection';
import NuevaConsultaSection from './dashboard/NuevaConsultaSection';
import MisCasosSection from './dashboard/MisCasosSection';
import CaseDetailSection from './dashboard/CaseDetailSection';
import PerfilSection from './dashboard/PerfilSection';
import ConfiguracionSection from './dashboard/ConfiguracionSection';
import FacturacionSection from './dashboard/FacturacionSection';
import NotificacionesSection from './dashboard/NotificacionesSection';

interface DashboardContentProps {
  activeSection: string;
}

const DashboardContent = memo(({ activeSection }: DashboardContentProps) => {
  const location = useLocation();

  const renderContent = () => {
    switch (activeSection) {
      case "nueva-consulta":
        return <NuevaConsultaSection />;
      case "casos":
        // Check if we're viewing a specific case
        if (location.pathname.includes('/casos/') && location.pathname.split('/').length > 3) {
          return <CaseDetailSection />;
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

  return <>{renderContent()}</>;
});

DashboardContent.displayName = 'DashboardContent';

export default DashboardContent;
