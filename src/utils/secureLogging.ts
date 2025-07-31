/**
 * Utilidades para logging seguro
 * Previene la exposición de información sensible en logs
 */

/**
 * Sanitiza un mensaje de error para logging seguro
 * @param error - Error original
 * @param context - Contexto del error
 * @returns Mensaje sanitizado
 */
export const sanitizeError = (error: any, context: string = 'unknown'): string => {
  if (!error) return `Error desconocido en ${context}`;

  // Si es un error de Supabase, extraer solo información segura
  if (error.code) {
    return `[${context}] Error ${error.code}: ${getSafeErrorMessage(error.code)}`;
  }

  // Si es un string, sanitizar
  if (typeof error === 'string') {
    return `[${context}] ${sanitizeString(error)}`;
  }

  // Si es un objeto, extraer solo información no sensible
  if (typeof error === 'object') {
    const safeError = {
      message: error.message ? sanitizeString(error.message) : 'Error sin mensaje',
      name: error.name || 'UnknownError',
      stack: undefined // Nunca loggear stack traces en producción
    };
    
    return `[${context}] ${safeError.name}: ${safeError.message}`;
  }

  return `[${context}] Error desconocido`;
};

/**
 * Sanitiza una cadena de texto removiendo información sensible
 * @param text - Texto a sanitizar
 * @returns Texto sanitizado
 */
export const sanitizeString = (text: string): string => {
  if (!text) return '';

  return text
    // Remover emails
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    // Remover números de teléfono
    .replace(/(\+34|0034|34)?[ -]*(6|7|8|9)[ -]*([0-9][ -]*){8}/g, '[PHONE]')
    // Remover NIF/CIF
    .replace(/[0-9]{8}[A-Z]/gi, '[NIF]')
    // Remover direcciones IP
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]')
    // Remover tokens JWT
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[JWT]')
    // Remover claves API
    .replace(/sk_[a-zA-Z0-9_-]+/g, '[API_KEY]')
    .replace(/pk_[a-zA-Z0-9_-]+/g, '[PUBLIC_KEY]')
    // Remover UUIDs completos
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[UUID]')
    // Remover rutas de archivos sensibles
    .replace(/\/home\/[^\/]+\//g, '[HOME_PATH]/')
    .replace(/\/Users\/[^\/]+\//g, '[USER_PATH]/')
    .replace(/C:\\Users\\[^\\]+\\/g, '[USER_PATH]\\');
};

/**
 * Mapeo de códigos de error de Supabase a mensajes seguros
 * @param code - Código de error
 * @returns Mensaje seguro
 */
export const getSafeErrorMessage = (code: string): string => {
  const errorMessages: Record<string, string> = {
    // Errores de autenticación
    'invalid_credentials': 'Credenciales inválidas',
    'user_not_found': 'Usuario no encontrado',
    'email_not_confirmed': 'Email no confirmado',
    'invalid_email': 'Email inválido',
    'weak_password': 'Contraseña débil',
    'email_already_in_use': 'Email ya en uso',
    'invalid_phone': 'Teléfono inválido',
    'phone_already_in_use': 'Teléfono ya en uso',
    
    // Errores de autorización
    'insufficient_permissions': 'Permisos insuficientes',
    'access_denied': 'Acceso denegado',
    'unauthorized': 'No autorizado',
    
    // Errores de base de datos
    'foreign_key_violation': 'Error de referencia',
    'unique_violation': 'Dato duplicado',
    'not_null_violation': 'Campo requerido',
    'check_violation': 'Validación fallida',
    
    // Errores de red
    'network_error': 'Error de red',
    'timeout': 'Tiempo de espera agotado',
    'connection_error': 'Error de conexión',
    
    // Errores de rate limiting
    'rate_limit_exceeded': 'Límite de intentos excedido',
    'too_many_requests': 'Demasiadas solicitudes',
    
    // Errores genéricos
    'internal_error': 'Error interno del servidor',
    'service_unavailable': 'Servicio no disponible',
    'bad_request': 'Solicitud incorrecta',
    'not_found': 'Recurso no encontrado'
  };

  return errorMessages[code] || 'Error desconocido';
};

/**
 * Logger seguro que no expone información sensible
 */
export class SecureLogger {
  private static isDevelopment = import.meta.env.DEV;
  private static enableDebugLogs = import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true';

  /**
   * Log de información general
   */
  static info(message: string, context?: string): void {
    if (this.isDevelopment || this.enableDebugLogs) {
      console.log(`[INFO] ${context ? `[${context}] ` : ''}${sanitizeString(message)}`);
    }
  }

  /**
   * Log de advertencias
   */
  static warn(message: string, context?: string): void {
    console.warn(`[WARN] ${context ? `[${context}] ` : ''}${sanitizeString(message)}`);
  }

  /**
   * Log de errores (sanitizados)
   */
  static error(error: any, context?: string): void {
    const sanitizedError = sanitizeError(error, context);
    console.error(sanitizedError);
  }

  /**
   * Log de debug (solo en desarrollo)
   */
  static debug(message: string, context?: string): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${context ? `[${context}] ` : ''}${sanitizeString(message)}`);
    }
  }

  /**
   * Log de autenticación (sin información sensible)
   */
  static auth(action: 'login' | 'logout' | 'register' | 'password_reset', success: boolean, context?: string): void {
    const status = success ? 'SUCCESS' : 'FAILED';
    console.log(`[AUTH] ${status} - ${action.toUpperCase()} ${context ? `[${context}]` : ''}`);
  }

  /**
   * Log de acceso a recursos (para auditoría)
   */
  static access(resource: string, action: 'read' | 'write' | 'delete', success: boolean, context?: string): void {
    const status = success ? 'ALLOWED' : 'DENIED';
    console.log(`[ACCESS] ${status} - ${action.toUpperCase()} ${resource} ${context ? `[${context}]` : ''}`);
  }
}

/**
 * Función helper para logging rápido
 */
export const logError = (error: any, context?: string) => {
  SecureLogger.error(error, context);
};

export const logInfo = (message: string, context?: string) => {
  SecureLogger.info(message, context);
};

export const logAuth = (action: 'login' | 'logout' | 'register' | 'password_reset', success: boolean, context?: string) => {
  SecureLogger.auth(action, success, context);
}; 