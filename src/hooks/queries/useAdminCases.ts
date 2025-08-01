import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Interfaz específica para casos del super admin
interface CasosSuperAdmin {
  id: string;
  motivo_consulta: string;
  resumen_caso?: string;
  guia_abogado?: string;
  especialidad_id: number;
  estado: string;
  created_at: string;
  cliente_id: string;
  compras_realizadas: number;
  limite_compras: number;
  costo_en_creditos: number;
  valor_estimado?: string;
  tipo_lead?: string;
  canal_atencion?: string;
  ciudad_borrador?: string;
  nombre_borrador?: string;
  apellido_borrador?: string;
  email_borrador?: string;
  telefono_borrador?: string;
  tipo_perfil_borrador?: string;
  razon_social_borrador?: string;
  nif_cif_borrador?: string;
  nombre_gerente_borrador?: string;
  direccion_fiscal_borrador?: string;
  preferencia_horaria_contacto?: string;
  fecha_cierre?: string;
  cerrado_por?: string;
  documentos_adjuntos?: any;
  especialidades?: { nombre: string };
  profiles?: { 
    nombre: string; 
    apellido: string; 
    email: string;
    telefono?: string;
    ciudad?: string;
    tipo_perfil?: string;
    razon_social?: string;
    nif_cif?: string;
    nombre_gerente?: string;
    direccion_fiscal?: string;
  };
  asignaciones_casos?: Array<{
    abogado_id: string;
    estado_asignacion: string;
    fecha_asignacion: string;
    asignado_por?: string;
    notas_asignacion?: string;
    asignado_por_profile?: {
      nombre: string;
      apellido: string;
      email: string;
    };
    profiles: { nombre: string; apellido: string; email: string };
  }>;
  cerrado_por_profile?: {
    nombre: string;
    apellido: string;
    email: string;
  };
}

// Función para validar acceso de super admin
const validateSuperAdminAccess = async (userId: string): Promise<boolean> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, tipo_abogado')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Error obteniendo perfil:', error);
      return false;
    }

    return profile?.role === 'abogado' && profile?.tipo_abogado === 'super_admin';
  } catch (error) {
    console.error('❌ Error validando acceso:', error);
    return false;
  }
};

// Función para obtener todos los casos (super admin)
const fetchAdminCases = async (): Promise<CasosSuperAdmin[]> => {
  try {
    // Obtener todos los casos con relaciones específicas
    const { data, error } = await supabase
      .from('casos')
      .select(`
        *,
        especialidades:especialidades(nombre),
        profiles:profiles!casos_cliente_id_fkey(
          nombre,
          apellido,
          email,
          telefono,
          ciudad,
          tipo_perfil,
          razon_social,
          nif_cif,
          nombre_gerente,
          direccion_fiscal
        ),
        asignaciones_casos(
          abogado_id,
          estado_asignacion,
          fecha_asignacion,
          asignado_por,
          notas_asignacion,
          asignado_por_profile:profiles!asignaciones_casos_asignado_por_fkey(nombre, apellido, email),
          profiles:profiles!asignaciones_casos_abogado_id_fkey(nombre, apellido, email)
        ),
        cerrado_por_profile:profiles!casos_cerrado_por_fkey(nombre, apellido, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin cases:', error);
      throw new Error('Error al cargar los casos');
    }

    return data || [];
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Error al cargar los casos del administrador');
  }
};

// Hook optimizado con React Query
export const useAdminCases = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['adminCases', user?.id],
    queryFn: fetchAdminCases,
    enabled: !!user, // Solo ejecutar si hay usuario
    staleTime: 2 * 60 * 1000, // Datos frescos por 2 minutos (más frecuente que stats)
    gcTime: 5 * 60 * 1000, // Caché por 5 minutos
    refetchOnWindowFocus: false, // No recargar al cambiar de pestaña
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 3;
    },
    // Validación de acceso antes de ejecutar la query
    placeholderData: (previousData) => previousData,
    select: (data) => {
      // Validar acceso antes de devolver datos
      if (!user) return [];
      return data;
    },
  });
};

// Hook adicional para validar acceso
export const useSuperAdminAccess = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['superAdminAccess', user?.id],
    queryFn: () => validateSuperAdminAccess(user!.id),
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // Validación válida por 10 minutos
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}; 