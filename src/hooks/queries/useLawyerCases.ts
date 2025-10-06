import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LawyerCase {
  id: string;
  motivo_consulta: string;
  resumen_caso?: string;
  estado: string;
  created_at: string;
  fecha_asignacion: string;
  estado_asignacion: string;
  notas_asignacion?: string;
  asignacion_id: string;
  especialidades?: { nombre: string };
  nombre_borrador?: string;
  apellido_borrador?: string;
  email_borrador?: string;
  ciudad_borrador?: string;
  tipo_lead?: string;
  valor_estimado?: string;
  canal_atencion?: string;
}

// Hook para obtener casos asignados a un abogado específico (para administradores)
export const useAdminLawyerCases = (lawyerId: string | null) => {
  return useQuery({
    queryKey: ['adminLawyerCases', lawyerId],
    queryFn: async (): Promise<LawyerCase[]> => {
      if (!lawyerId) return [];

      const { data, error } = await supabase
        .from('asignaciones_casos')
        .select(`
          id,
          fecha_asignacion,
          estado_asignacion,
          notas_asignacion,
          casos!inner (
            id,
            motivo_consulta,
            resumen_caso,
            estado,
            created_at,
            nombre_borrador,
            apellido_borrador,
            email_borrador,
            telefono_borrador,
            ciudad_borrador,
            tipo_lead,
            valor_estimado,
            canal_atencion,
            especialidades (
              nombre
            )
          )
        `)
        .eq('abogado_id', lawyerId)
        .in('estado_asignacion', ['activa', 'completada'])
        .order('fecha_asignacion', { ascending: false });

      if (error) {
        console.error('Error fetching lawyer cases:', error);
        throw new Error('Error al cargar los casos del abogado');
      }

      return (data || []).map(assignment => ({
        id: assignment.casos[0].id,
        motivo_consulta: assignment.casos[0].motivo_consulta,
        resumen_caso: assignment.casos[0].resumen_caso,
        estado: assignment.casos[0].estado,
        created_at: assignment.casos[0].created_at,
        fecha_asignacion: assignment.fecha_asignacion,
        estado_asignacion: assignment.estado_asignacion,
        notas_asignacion: assignment.notas_asignacion,
        asignacion_id: assignment.id,
        especialidades: assignment.casos[0].especialidades,
        nombre_borrador: assignment.casos[0].nombre_borrador,
        apellido_borrador: assignment.casos[0].apellido_borrador,
        email_borrador: assignment.casos[0].email_borrador,
        ciudad_borrador: assignment.casos[0].ciudad_borrador,
        tipo_lead: assignment.casos[0].tipo_lead,
        valor_estimado: assignment.casos[0].valor_estimado,
        canal_atencion: assignment.casos[0].canal_atencion
      }));
    },
    enabled: !!lawyerId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};