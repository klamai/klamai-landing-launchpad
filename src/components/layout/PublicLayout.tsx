import React from 'react';
import { Link } from 'react-router-dom';
import { FooterSection } from '@/components/ui/footer-section';
import { CookieConsentBanner } from '@/components/shared/CookieConsentBanner';

// Componente Header consistente con la página principal
const Header = () => (
  <header className="bg-white shadow-lg border-b">
    <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
      <Link to="/" className="flex items-center gap-3">
        <img src="/logo.svg" alt="KlamAI Logo" className="h-8" />
        <span className="text-2xl font-bold text-blue-600">KlamAI</span>
      </Link>
      <div className="space-x-6">
        <Link to="/areas-de-practica" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Áreas de Práctica</Link>
        <Link to="/mercantil" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Mercantil</Link>
        <Link to="/contacto" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Contacto</Link>
        <Link to="/auth" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-colors">Acceso Clientes</Link>
      </div>
    </nav>
  </header>
);

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <FooterSection />
      <CookieConsentBanner />
    </div>
  );
};

export default PublicLayout;
