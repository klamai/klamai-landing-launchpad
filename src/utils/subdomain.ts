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
 * Obtiene el tipo de subdominio actual basado en la URL
 */
export const getCurrentSubdomain = (): SubdomainType => {
  if (typeof window === 'undefined') return 'main';
  
  const hostname = window.location.hostname;
  
  // Variables de entorno para los subdominios
  const adminDomain = import.meta.env.VITE_ADMIN_DOMAIN;
  const abogadosDomain = import.meta.env.VITE_ABOGADOS_DOMAIN;
  const clientesDomain = import.meta.env.VITE_CLIENTES_DOMAIN;
  
  // Verificar cada subdominio (tanto por variables de entorno como por hostname directo)
  if ((adminDomain && hostname === adminDomain) || hostname === 'admin.klamai.com') {
    return 'admin';
  }
  
  if ((abogadosDomain && hostname === abogadosDomain) || hostname === 'abogados.klamai.com') {
    return 'abogados';
  }
  
  if ((clientesDomain && hostname === clientesDomain) || hostname === 'clientes.klamai.com') {
    return 'clientes';
  }
  
  // Fallback para desarrollo local o dominio principal
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // En desarrollo, detectar por path si existe
    const path = window.location.pathname;
    if (path.startsWith('/abogados')) return 'abogados';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/clientes')) return 'clientes';
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
  // Mapeo de roles a subdominios
  const roleSubdomainMap: Record<string, SubdomainType> = {
    'super_admin': 'abogados', // Super admin va al portal de abogados
    'abogado': 'abogados',
    'cliente': 'clientes',
  };
  
  const targetSubdomain = roleSubdomainMap[userRole] || 'main';
  const config = SUBDOMAIN_CONFIG[targetSubdomain];
  
  // Obtener el dominio del subdominio objetivo
  let targetDomain = '';
  switch (targetSubdomain) {
    case 'admin':
      targetDomain = import.meta.env.VITE_ADMIN_DOMAIN || window.location.hostname;
      break;
    case 'abogados':
      targetDomain = import.meta.env.VITE_ABOGADOS_DOMAIN || window.location.hostname;
      break;
    case 'clientes':
      targetDomain = import.meta.env.VITE_CLIENTES_DOMAIN || window.location.hostname;
      break;
    default:
      targetDomain = window.location.hostname;
  }
  
  // Construir URL completa
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';
  
  return `${protocol}//${targetDomain}${port}${config.redirectAfterAuth}`;
};

/**
 * Genera las URLs de callback para OAuth por subdominio
 */
export const getAuthCallbackUrl = (subdomain?: SubdomainType): string => {
  const currentSubdomain = subdomain || getCurrentSubdomain();
  
  let domain = '';
  switch (currentSubdomain) {
    case 'admin':
      domain = import.meta.env.VITE_ADMIN_DOMAIN || window.location.hostname;
      break;
    case 'abogados':
      domain = import.meta.env.VITE_ABOGADOS_DOMAIN || window.location.hostname;
      break;
    case 'clientes':
      domain = import.meta.env.VITE_CLIENTES_DOMAIN || window.location.hostname;
      break;
    default:
      domain = window.location.hostname;
  }
  
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';
  
  return `${protocol}//${domain}${port}/auth-callback`;
};

/**
 * Lista de subdominios públicos (para mostrar en landing)
 */
export const getPublicSubdomains = (): SubdomainConfig[] => {
  return Object.values(SUBDOMAIN_CONFIG).filter(config => config.isPublic);
};
