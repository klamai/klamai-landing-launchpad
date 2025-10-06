import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AssignedCase {
  id: string;
  cliente_id?: string | null;
  motivo_consulta: string | null;
  resumen_caso: string | null;
  guia_abogado: string | null;
  estado: 'borrador' | 'esperando_pago' | 'disponible' | 'agotado' | 'cerrado' | 'listo_para_propuesta';
  created_at: string;
  nombre_borrador: string | null;
  apellido_borrador: string | null;
  email_borrador: string | null;
  telefono_borrador: string | null;
  tipo_lead: 'estandar' | 'premium' | 'urgente' | null;
  especialidad_id: number | null;
  especialidades?: {
    nombre: string;
  };
  valor_estimado?: string | null;
  ciudad_borrador?: string | null;
  transcripcion_chat?: any;
  fecha_asignacion: string;
  estado_asignacion: string;
  notas_asignacion?: string;
  asignacion_id: string;
  cerrado_por_profile?: {
    nombre: string;
    apellido: string;
    email: string;
  };
  fecha_pago?: string | null;
}

const fetchAssignedCases = async (): Promise<AssignedCase[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  // Verificar que el usuario es un abogado regular
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, tipo_abogado')
    .eq('id', user.id as any)
    .single();

  if (profileError || !profile) {
    throw new Error('Error obteniendo perfil de usuario');
  }

  if ((profile as any).role !== 'abogado' || (profile as any).tipo_abogado !== 'regular') {
    throw new Error('Acceso denegado: solo abogados regulares');
  }

  // Obtener casos asignados al abogado actual (incluyendo casos cerrados)
  const { data, error } = await supabase
    .from('asignaciones_casos')
    .select(`
      id,
      fecha_asignacion,
      estado_asignacion,
      notas_asignacion,
      casos!inner (
        id,
        cliente_id,
        motivo_consulta,
        resumen_caso,
        guia_abogado,
        estado,
        created_at,
        nombre_borrador,
        apellido_borrador,
        email_borrador,
        telefono_borrador,
        tipo_lead,
        especialidad_id,
        valor_estimado,
        ciudad_borrador,
        fecha_pago,
        transcripcion_chat,
        especialidades:especialidades (
          nombre
        ),
        cerrado_por_profile:profiles!casos_cerrado_por_fkey (
          nombre,
          apellido,
          email
        )
      )
    `)
    .eq('abogado_id', user.id as any)
    .order('fecha_asignacion', { ascending: false });

  if (error) {
    throw new Error(`Error obteniendo casos asignados: ${error.message}`);
  }

  // Transformar los datos para mantener la estructura esperada
  const assignedCases: AssignedCase[] = ((data as unknown) as any[] || []).map((assignment: any) => ({
    id: assignment.casos.id,
    cliente_id: assignment.casos.cliente_id || null,
    motivo_consulta: assignment.casos.motivo_consulta,
    resumen_caso: assignment.casos.resumen_caso,
    guia_abogado: assignment.casos.guia_abogado,
    estado: assignment.casos.estado,
    created_at: assignment.casos.created_at,
    nombre_borrador: assignment.casos.nombre_borrador,
    apellido_borrador: assignment.casos.apellido_borrador,
    email_borrador: assignment.casos.email_borrador,
    telefono_borrador: assignment.casos.telefono_borrador,
    tipo_lead: assignment.casos.tipo_lead,
    especialidad_id: assignment.casos.especialidad_id,
    especialidades: assignment.casos.especialidades,
    valor_estimado: assignment.casos.valor_estimado,
    ciudad_borrador: assignment.casos.ciudad_borrador,
    transcripcion_chat: assignment.casos.transcripcion_chat,
    fecha_asignacion: assignment.fecha_asignacion,
    estado_asignacion: assignment.estado_asignacion,
    notas_asignacion: assignment.notas_asignacion,
    asignacion_id: assignment.id,
    cerrado_por_profile: assignment.casos.cerrado_por_profile,
    fecha_pago: assignment.casos.fecha_pago,
  }));

  return assignedCases;
};

export const useAssignedCases = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['assignedCases', user?.id],
    queryFn: fetchAssignedCases,
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Acceso denegado')) return false;
      return failureCount < 3;
    },
  });
}; 