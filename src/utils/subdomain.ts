// Utilidad para manejo de subdominios
export type SubdomainType = 'admin' | 'abogados' | 'clientes' | 'main';

interface SubdomainConfig {
  type: SubdomainType;
  name: string;
  allowedRoles: string[];
  showRegistration: boolean;
  showLawyerApplication: boolean;
  redirectAfterAuth: string;
  title: string;
  subtitle: string;
  isPublic: boolean; // Si se muestra públicamente en la landing
}

export const SUBDOMAIN_CONFIG: Record<SubdomainType, SubdomainConfig> = {
  admin: {
    type: 'admin',
    name: 'Administración',
    allowedRoles: ['super_admin'],
    showRegistration: false,
    showLawyerApplication: false,
    redirectAfterAuth: 'https://abogados.klamai.com/abogados/dashboard',
    title: 'Portal de Administración',
    subtitle: 'Acceso exclusivo para administradores del sistema',
    isPublic: false, // No se muestra en landing público
  },
  abogados: {
    type: 'abogados',
    name: 'Abogados',
    allowedRoles: ['abogado', 'super_admin'],
    showRegistration: false,
    showLawyerApplication: true,
    redirectAfterAuth: '/abogados/dashboard',
    title: 'Portal de Abogados',
    subtitle: 'Gestiona casos, clientes y expande tu práctica legal',
    isPublic: true,
  },
  clientes: {
    type: 'clientes',
    name: 'Clientes',
    allowedRoles: ['cliente'],
    showRegistration: true,
    showLawyerApplication: false,
    redirectAfterAuth: '/dashboard',
    title: 'Portal de Clientes',
    subtitle: 'Accede a tus consultas legales y gestiona tus casos',
    isPublic: true,
  },
  main: {
    type: 'main',
    name: 'Principal',
    allowedRoles: ['cliente', 'abogado', 'super_admin'],
    showRegistration: true,
    showLawyerApplication: false,
    redirectAfterAuth: '/dashboard',
    title: 'KlamAI',
    subtitle: 'Tu plataforma de consultas legales',
    isPublic: true,
  },
};

/**
 * Obtiene el tipo de perfil actual basado en la URL path
 */
export const getCurrentSubdomain = (): SubdomainType => {
  if (typeof window === 'undefined') return 'main';
  
  const path = window.location.pathname;
  
  // Detectar por path (nueva lógica principal)
  if (path.startsWith('/admin')) {
    return 'admin';
  }
  
  if (path.startsWith('/abogados')) {
    return 'abogados';
  }
  
  if (path.startsWith('/clientes')) {
    return 'clientes';
  }
  
  return 'main';
};

/**
 * Obtiene la configuración del subdominio actual
 */
export const getCurrentSubdomainConfig = (): SubdomainConfig => {
  const subdomain = getCurrentSubdomain();
  return SUBDOMAIN_CONFIG[subdomain];
};

/**
 * Verifica si un rol está permitido en el subdominio actual
 */
export const isRoleAllowedInCurrentSubdomain = (userRole: string): boolean => {
  const config = getCurrentSubdomainConfig();
  return config.allowedRoles.includes(userRole);
};

/**
 * Obtiene la URL de redirección correcta para un rol específico
 */
export const getRedirectUrlForRole = (userRole: string): string => {
  // Mapeo de roles a rutas
  const rolePathMap: Record<string, string> = {
    'super_admin': '/abogados/dashboard', // Super admin va al dashboard de abogados
    'abogado': '/abogados/dashboard',
    'cliente': '/dashboard',
  };
  
  return rolePathMap[userRole] || '/dashboard';
};

/**
 * Genera las URLs de callback para OAuth
 */
export const getAuthCallbackUrl = (): string => {
  return '/auth-callback'; // Usar ruta relativa, mismo dominio
};

/**
 * Lista de subdominios públicos (para mostrar en landing)
 */
export const getPublicSubdomains = (): SubdomainConfig[] => {
  return Object.values(SUBDOMAIN_CONFIG).filter(config => config.isPublic);
};
