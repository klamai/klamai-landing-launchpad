import { supabase } from '@/integrations/supabase/client';

// Configuración de rate limiting
const RATE_LIMIT_CONFIG = {
  // Login attempts
  LOGIN_ATTEMPTS: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutos
    BLOCK_DURATION_MS: 30 * 60 * 1000, // 30 minutos de bloqueo
  },
  // Sign up attempts
  SIGNUP_ATTEMPTS: {
    MAX_ATTEMPTS: 3,
    WINDOW_MS: 60 * 60 * 1000, // 1 hora
    BLOCK_DURATION_MS: 60 * 60 * 1000, // 1 hora de bloqueo
  },
  // Password reset attempts
  PASSWORD_RESET: {
    MAX_ATTEMPTS: 3,
    WINDOW_MS: 60 * 60 * 1000, // 1 hora
    BLOCK_DURATION_MS: 60 * 60 * 1000, // 1 hora de bloqueo
  },
  // Document uploads
  DOCUMENT_UPLOADS: {
    MAX_ATTEMPTS: 10,
    WINDOW_MS: 60 * 1000, // 1 minuto
    BLOCK_DURATION_MS: 5 * 60 * 1000, // 5 minutos de bloqueo
  },
  // API calls (general)
  API_CALLS: {
    MAX_ATTEMPTS: 100,
    WINDOW_MS: 60 * 1000, // 1 minuto
    BLOCK_DURATION_MS: 10 * 60 * 1000, // 10 minutos de bloqueo
  },
} as const;

// Tipos para rate limiting
type RateLimitType = keyof typeof RATE_LIMIT_CONFIG;
type RateLimitEntry = {
  attempts: number;
  firstAttempt: number;
  blockedUntil?: number;
};

// Storage para rate limiting (en memoria para desarrollo, en producción usar Redis)
class RateLimitStorage {
  private storage = new Map<string, RateLimitEntry>();

  get(key: string): RateLimitEntry | undefined {
    return this.storage.get(key);
  }

  set(key: string, entry: RateLimitEntry): void {
    this.storage.set(key, entry);
  }

  delete(key: string): void {
    this.storage.delete(key);
  }

  // Limpiar entradas expiradas
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      const isExpired = now - entry.firstAttempt > RATE_LIMIT_CONFIG.API_CALLS.WINDOW_MS * 2;
      if (isExpired) {
        this.storage.delete(key);
      }
    }
  }
}

const rateLimitStorage = new RateLimitStorage();

// Limpiar entradas expiradas cada 5 minutos
setInterval(() => {
  rateLimitStorage.cleanup();
}, 5 * 60 * 1000);

// Función para generar clave de rate limiting
const getRateLimitKey = (type: RateLimitType, identifier: string): string => {
  return `${type}:${identifier}`;
};

// Función principal de rate limiting
export const checkRateLimit = async (
  type: RateLimitType,
  identifier: string,
  options?: {
    customMaxAttempts?: number;
    customWindowMs?: number;
    customBlockDurationMs?: number;
  }
): Promise<{
  allowed: boolean;
  remainingAttempts: number;
  resetTime?: number;
  blockedUntil?: number;
  error?: string;
}> => {
  const config = RATE_LIMIT_CONFIG[type];
  const maxAttempts = options?.customMaxAttempts ?? config.MAX_ATTEMPTS;
  const windowMs = options?.customWindowMs ?? config.WINDOW_MS;
  const blockDurationMs = options?.customBlockDurationMs ?? config.BLOCK_DURATION_MS;

  const key = getRateLimitKey(type, identifier);
  const now = Date.now();
  const entry = rateLimitStorage.get(key);

  // Si no hay entrada previa, crear una nueva
  if (!entry) {
    rateLimitStorage.set(key, {
      attempts: 1,
      firstAttempt: now,
    });
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
      resetTime: now + windowMs,
    };
  }

  // Verificar si está bloqueado
  if (entry.blockedUntil && now < entry.blockedUntil) {
    return {
      allowed: false,
      remainingAttempts: 0,
      blockedUntil: entry.blockedUntil,
      error: `Rate limit exceeded. Try again after ${new Date(entry.blockedUntil).toLocaleTimeString()}`,
    };
  }

  // Verificar si la ventana de tiempo ha expirado
  if (now - entry.firstAttempt > windowMs) {
    // Resetear contador
    rateLimitStorage.set(key, {
      attempts: 1,
      firstAttempt: now,
    });
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
      resetTime: now + windowMs,
    };
  }

  // Verificar si ha excedido el límite
  if (entry.attempts >= maxAttempts) {
    // Bloquear por el tiempo especificado
    const blockedUntil = now + blockDurationMs;
    rateLimitStorage.set(key, {
      ...entry,
      blockedUntil,
    });

    // Log de seguridad
    console.warn(`Rate limit exceeded for ${type}:${identifier} - Blocked until ${new Date(blockedUntil).toISOString()}`);

    return {
      allowed: false,
      remainingAttempts: 0,
      blockedUntil,
      error: `Too many attempts. Try again after ${new Date(blockedUntil).toLocaleTimeString()}`,
    };
  }

  // Incrementar contador
  rateLimitStorage.set(key, {
    ...entry,
    attempts: entry.attempts + 1,
  });

  return {
    allowed: true,
    remainingAttempts: maxAttempts - entry.attempts - 1,
    resetTime: entry.firstAttempt + windowMs,
  };
};

// Función para obtener IP del cliente (para desarrollo)
const getClientIP = (): string => {
  // En desarrollo, usar un identificador único
  // En producción, esto vendría del servidor
  return 'development-client';
};

// Hook para rate limiting de login
export const useLoginRateLimit = () => {
  const checkLoginRateLimit = async (email: string) => {
    const identifier = email.toLowerCase().trim();
    return await checkRateLimit('LOGIN_ATTEMPTS', identifier);
  };

  const recordFailedLogin = async (email: string) => {
    const identifier = email.toLowerCase().trim();
    const key = getRateLimitKey('LOGIN_ATTEMPTS', identifier);
    const entry = rateLimitStorage.get(key);
    
    if (entry) {
      // Incrementar contador de intentos fallidos
      rateLimitStorage.set(key, {
        ...entry,
        attempts: entry.attempts + 1,
      });
    }
  };

  const recordSuccessfulLogin = async (email: string) => {
    const identifier = email.toLowerCase().trim();
    const key = getRateLimitKey('LOGIN_ATTEMPTS', identifier);
    
    // Limpiar entrada después de login exitoso
    rateLimitStorage.delete(key);
  };

  return {
    checkLoginRateLimit,
    recordFailedLogin,
    recordSuccessfulLogin,
  };
};

// Hook para rate limiting de registro
export const useSignupRateLimit = () => {
  const checkSignupRateLimit = async (email: string) => {
    const identifier = email.toLowerCase().trim();
    return await checkRateLimit('SIGNUP_ATTEMPTS', identifier);
  };

  const recordSignupAttempt = async (email: string) => {
    const identifier = email.toLowerCase().trim();
    const key = getRateLimitKey('SIGNUP_ATTEMPTS', identifier);
    const entry = rateLimitStorage.get(key);
    
    if (entry) {
      rateLimitStorage.set(key, {
        ...entry,
        attempts: entry.attempts + 1,
      });
    }
  };

  return {
    checkSignupRateLimit,
    recordSignupAttempt,
  };
};

// Hook para rate limiting de subida de documentos
export const useDocumentUploadRateLimit = () => {
  const checkUploadRateLimit = async (userId: string) => {
    return await checkRateLimit('DOCUMENT_UPLOADS', userId);
  };

  const recordUploadAttempt = async (userId: string) => {
    const key = getRateLimitKey('DOCUMENT_UPLOADS', userId);
    const entry = rateLimitStorage.get(key);
    
    if (entry) {
      rateLimitStorage.set(key, {
        ...entry,
        attempts: entry.attempts + 1,
      });
    }
  };

  return {
    checkUploadRateLimit,
    recordUploadAttempt,
  };
};

// Función para obtener estadísticas de rate limiting (para debugging)
export const getRateLimitStats = () => {
  const stats: Record<string, any> = {};
  
  for (const [key, entry] of rateLimitStorage.storage.entries()) {
    stats[key] = {
      attempts: entry.attempts,
      firstAttempt: new Date(entry.firstAttempt).toISOString(),
      blockedUntil: entry.blockedUntil ? new Date(entry.blockedUntil).toISOString() : null,
      isBlocked: entry.blockedUntil ? Date.now() < entry.blockedUntil : false,
    };
  }
  
  return stats;
};

// Función para limpiar rate limiting (para testing)
export const clearRateLimits = () => {
  rateLimitStorage.storage.clear();
}; 