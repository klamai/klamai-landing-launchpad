import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya ha dado consentimiento
    const consentGiven = localStorage.getItem('cookieConsent');
    if (!consentGiven) {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookieConsent', 'all');
    setShowBanner(false);
  };

  const acceptEssential = () => {
    localStorage.setItem('cookieConsent', 'essential');
    setShowBanner(false);
  };

  const rejectAll = () => {
    localStorage.setItem('cookieConsent', 'none');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white p-4 shadow-lg border-t border-gray-700">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">🍪 Política de Cookies</h3>
            <p className="text-sm text-gray-300 mb-2">
              Utilizamos cookies para mejorar tu experiencia en nuestro sitio web, analizar el tráfico y personalizar el contenido.
              Al continuar navegando, aceptas el uso de cookies según nuestra{' '}
              <Link to="/politicas-privacidad" className="text-blue-400 hover:underline">
                Política de Privacidad
              </Link>.
            </p>
            <div className="text-sm text-gray-400">
              <Link to="/politicas-cookies" className="text-blue-400 hover:underline">
                Más información sobre cookies
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {!showSettings ? (
              <>
                <Button
                  onClick={acceptAll}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  Aceptar Todas
                </Button>
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Configurar
                </Button>
                <Button
                  onClick={rejectAll}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  Rechazar
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={acceptAll}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  Aceptar Todas
                </Button>
                <Button
                  onClick={acceptEssential}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Solo Esenciales
                </Button>
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  Atrás
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
