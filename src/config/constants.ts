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
  TYPEBOT_NAME: import.meta.env.VITE_TYPEBOT_NAME || 'klamai',
  TYPEBOT_API_HOST: import.meta.env.VITE_TYPEBOT_API_HOST || 'https://chat.klamai.com'
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

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Configuración de subida de archivos
export const MAX_FILE_SIZE_MB = 25;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 10;

// Lista de tipos MIME permitidos para la subida de documentos
export const ALLOWED_FILE_TYPES = [
  'application/pdf', // .pdf
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'image/jpeg', // .jpeg, .jpg
  'image/png', // .png
  'image/gif', // .gif
  'image/webp', // .webp
  'text/plain', // .txt
  'application/vnd.oasis.opendocument.text', // .odt
  'application/vnd.oasis.opendocument.spreadsheet', // .ods
];

// String para el atributo 'accept' del input de archivo
export const ALLOWED_FILE_TYPES_STRING = ALLOWED_FILE_TYPES.join(',');

// String para mostrar al usuario los tipos de archivo permitidos
export const ALLOWED_FILE_TYPES_DISPLAY = "PDF, Word, Excel, PowerPoint, Imágenes, y Texto"; 