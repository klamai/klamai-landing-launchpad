import React, { useEffect, useRef } from 'react';
import { CONFIG, getDocumensoDocumentUrl } from '@/config/constants';

interface CustomDocumensoEmbedProps {
  token: string;
  height?: string;
  width?: string;
  title?: string;
}

const CustomDocumensoEmbed: React.FC<CustomDocumensoEmbedProps> = ({
  token,
  height = '600px',
  width = '100%',
  title = 'Documento para Firma'
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    try {
      // Construir la URL completa para el embed usando la configuración
      const embedUrl = getDocumensoDocumentUrl(token);
      
      if (iframeRef.current) {
        iframeRef.current.src = embedUrl;
      }
    } catch (error) {
      // Mostrar mensaje de error en el iframe
      if (iframeRef.current) {
        iframeRef.current.srcdoc = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; font-family: Arial, sans-serif;">
            <div style="text-align: center; color: #666;">
              <h3>Error de Configuración</h3>
              <p>La URL de Documenso no está configurada correctamente.</p>
              <p>Contacta al administrador.</p>
            </div>
          </div>
        `;
      }
    }
  }, [token]);

  return (
    <div className="w-full h-full">
      <iframe
        ref={iframeRef}
        title={title}
        className="w-full border-0 rounded-lg shadow-lg"
        style={{
          height,
          width,
          minHeight: '600px'
        }}
        allow="camera; microphone; geolocation"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
};

export default CustomDocumensoEmbed; 