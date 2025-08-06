// Configuración de URLs y constantes del proyecto
export const CONFIG = {
  // URL de la instancia de Documenso (configurable por variable de entorno)
  DOCUMENSO_URL: import.meta.env.VITE_DOCUMENSO_URL || '',
  
  // Otras configuraciones del proyecto
  APP_NAME: 'klamAI',
  APP_VERSION: '1.0.0',
} as const;

// Configuración específica para Typebot
export const TYPEBOT_CONFIG = {
  TYPEBOT_NAME: import.meta.env.VITE_TYPEBOT_NAME,
  TYPEBOT_API_HOST: import.meta.env.VITE_TYPEBOT_API_HOST
} as const;

// Función helper para obtener la URL completa de un documento de Documenso
export const getDocumensoDocumentUrl = (token: string): string => {
  if (!CONFIG.DOCUMENSO_URL) {
    throw new Error('URL de Documenso no configurada');
  }
  
  // Validar que el token no esté vacío y sea una cadena válida
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('Token de documento inválido');
  }
  
  // Sanitizar el token (solo permitir caracteres alfanuméricos, guiones y guiones bajos)
  const sanitizedToken = token.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  
  return `${CONFIG.DOCUMENSO_URL}/embed/direct/${sanitizedToken}`;
};

// Función helper para validar si una URL es de Documenso
export const isValidDocumensoUrl = (url: string): boolean => {
  if (!CONFIG.DOCUMENSO_URL || !url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const documensoUrl = new URL(CONFIG.DOCUMENSO_URL);
    const inputUrl = new URL(url);
    return documensoUrl.origin === inputUrl.origin;
  } catch {
    return false;
  }
}; 