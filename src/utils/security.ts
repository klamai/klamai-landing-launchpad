/**
 * Utilidades de seguridad para el lado del cliente
 */

// Sanitizar texto para prevenir XSS
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  return text
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, '') // Remover event handlers
    .trim();
};

// Validar UUID
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Validar email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validar nombre de archivo
export const isValidFileName = (fileName: string): boolean => {
  // Permitir solo caracteres seguros en nombres de archivo
  const safeFileNameRegex = /^[a-zA-Z0-9._-]+$/;
  return safeFileNameRegex.test(fileName) && fileName.length <= 255;
};

// Validar tipo de archivo
export const isValidFileType = (file: File): boolean => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ];
  
  return allowedTypes.includes(file.type);
};

// Validar tamaño de archivo (máximo 10MB)
export const isValidFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// Sanitizar descripción de documento
export const sanitizeDocumentDescription = (description: string): string => {
  if (!description) return '';
  
  return sanitizeText(description).substring(0, 500); // Máximo 500 caracteres
};

// Validar caso ID
export const validateCaseId = (caseId: string): boolean => {
  return isValidUUID(caseId);
};

// Rate limiting simple (para prevenir spam)
const requestCounts = new Map<string, number>();
const requestTimestamps = new Map<string, number>();

export const checkRateLimit = (key: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Limpiar requests antiguos
  const timestamp = requestTimestamps.get(key) || 0;
  if (timestamp < windowStart) {
    requestCounts.set(key, 0);
    requestTimestamps.set(key, now);
  }
  
  const currentCount = requestCounts.get(key) || 0;
  
  if (currentCount >= maxRequests) {
    return false; // Rate limit excedido
  }
  
  requestCounts.set(key, currentCount + 1);
  requestTimestamps.set(key, now);
  
  return true; // Rate limit OK
};

// Limpiar rate limiting para un usuario
export const clearRateLimit = (key: string): void => {
  requestCounts.delete(key);
  requestTimestamps.delete(key);
};

// Validar y sanitizar input de búsqueda
export const sanitizeSearchInput = (searchTerm: string): string => {
  if (!searchTerm) return '';
  
  return sanitizeText(searchTerm)
    .substring(0, 100) // Máximo 100 caracteres
    .toLowerCase();
};

// Validar estado de caso
export const isValidCaseStatus = (status: string): boolean => {
  const validStatuses = [
    'disponible',
    'asignado',
    'esperando_pago',
    'cerrado',
    'listo_para_propuesta'
  ];
  
  return validStatuses.includes(status);
};

// Validar tipo de documento
export const isValidDocumentType = (type: string): boolean => {
  const validTypes = [
    'evidencia',
    'contrato',
    'correspondencia',
    'identificacion',
    'otros'
  ];
  
  return validTypes.includes(type);
}; 