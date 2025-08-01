import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AbogadoInfo {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  especialidades: string[];
  creditos_disponibles: number;
  created_at: string;
  casos_asignados: number;
  casos_activos: number;
  tipo_abogado?: string;
}

interface AsignarCasoParams {
  casoId: string;
  abogadoId: string;
  notas?: string;
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
      console.error('❌ Error validando acceso:', error);
      return false;
    }

    return profile?.role === 'abogado' && profile?.tipo_abogado === 'super_admin';
  } catch (error) {
    console.error('❌ Error general en validación:', error);
    return false;
  }
};

// Función para obtener abogados con estadísticas
const fetchAdminLawyers = async (): Promise<AbogadoInfo[]> => {
  try {
    // Obtener todos los abogados
    const { data: abogadosData, error: abogadosError } = await supabase
      .from('profiles')
      .select(`
        id,
        nombre,
        apellido,
        email,
        especialidades,
        creditos_disponibles,
        created_at,
        tipo_abogado
      `)
      .eq('role', 'abogado')
      .order('created_at', { ascending: false });

    if (abogadosError) {
      console.error('Error fetching abogados:', abogadosError);
      throw new Error('Error al cargar abogados');
    }

    // Obtener estadísticas de casos por abogado
    const { data: casosPorAbogadoData, error: casosError } = await supabase
      .from('asignaciones_casos')
      .select(`
        abogado_id,
        estado_asignacion
      `);

    if (casosError) {
      console.error('Error fetching casos por abogado:', casosError);
      throw new Error('Error al cargar estadísticas de casos');
    }

    // Crear mapa de estadísticas por abogado
    const casosPorAbogadoMap = new Map<string, { total: number; activos: number }>();
    
    casosPorAbogadoData?.forEach(asignacion => {
      const current = casosPorAbogadoMap.get(asignacion.abogado_id) || { total: 0, activos: 0 };
      current.total += 1;
      if (asignacion.estado_asignacion === 'activa') {
        current.activos += 1;
      }
      casosPorAbogadoMap.set(asignacion.abogado_id, current);
    });

    // Procesar abogados con estadísticas
    const processedAbogados: AbogadoInfo[] = (abogadosData || []).map(abogado => {
      const estadisticas = casosPorAbogadoMap.get(abogado.id) || { total: 0, activos: 0 };
      
      return {
        id: abogado.id,
        nombre: abogado.nombre,
        apellido: abogado.apellido,
        email: abogado.email,
        especialidades: abogado.especialidades || [],
        creditos_disponibles: abogado.creditos_disponibles,
        created_at: abogado.created_at,
        casos_asignados: estadisticas.total,
        casos_activos: estadisticas.activos,
        tipo_abogado: abogado.tipo_abogado
      };
    });

    return processedAbogados;
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Error inesperado al cargar abogados');
  }
};

// Función para asignar caso a abogado
const assignCaseToLawyer = async ({ casoId, abogadoId, notas }: AsignarCasoParams): Promise<{ success: boolean; error?: string }> => {
  try {
    // Usar upsert para manejar asignaciones duplicadas
    const { error } = await supabase
      .from('asignaciones_casos')
      .upsert({
        caso_id: casoId,
        abogado_id: abogadoId,
        estado_asignacion: 'activa',
        fecha_asignacion: new Date().toISOString(),
        notas_asignacion: notas || null
      }, {
        onConflict: 'caso_id,abogado_id'
      });

    if (error) {
      console.error('Error assigning case:', error);
      return { success: false, error: error.message };
    }

    // Actualizar estado del caso
    const { error: updateError } = await supabase
      .from('casos')
      .update({ estado: 'asignado' })
      .eq('id', casoId);

    if (updateError) {
      console.error('Error updating case status:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in assignCaseToLawyer:', error);
    return { success: false, error: 'Error inesperado al asignar caso' };
  }
};

// Hook para validar acceso de super admin
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

// Hook principal para gestión de abogados
export const useAdminLawyers = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['adminLawyers', user?.id],
    queryFn: fetchAdminLawyers,
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // Datos frescos por 2 minutos
    gcTime: 5 * 60 * 1000, // Caché por 5 minutos
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 3;
    },
  });
};

// Hook para asignar casos a abogados
export const useAssignCaseToLawyer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: assignCaseToLawyer,
    onSuccess: () => {
      // Invalidar queries relacionadas para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['adminLawyers'] });
      queryClient.invalidateQueries({ queryKey: ['adminCases'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminStats'] });
    },
    onError: (error) => {
      console.error('Error en asignación de caso:', error);
    },
  });
}; 