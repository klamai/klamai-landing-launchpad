import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Caso } from '@/types/database';

export const useLawyerCases = () => {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchLawyerCases();
  }, [user]);

  const fetchLawyerCases = async () => {
    if (!user) {
      setCasos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Verificar explícitamente que el usuario es un abogado regular
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, tipo_abogado')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        setError('Error al verificar permisos de usuario');
        setCasos([]);
        return;
      }

      // Validación estricta: solo abogados regulares pueden usar este hook
      if (profile.role !== 'abogado' || profile.tipo_abogado !== 'regular') {
        console.error('Acceso denegado: usuario no es abogado regular');
        setError('Acceso no autorizado');
        setCasos([]);
        return;
      }

      // Query específico para abogados regulares: SOLO casos asignados a ellos
      const { data, error: casesError } = await supabase
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
            especialidades (
              nombre
            )
          )
        `)
        .eq('abogado_id', user.id)
        .in('estado_asignacion', ['activa', 'completada'])
        .order('fecha_asignacion', { ascending: false });

      if (casesError) {
        console.error('Error fetching lawyer cases:', casesError);
        setError('Error al cargar los casos asignados');
        setCasos([]);
        return;
      }

      // Transformar los datos para que coincidan con la interfaz esperada
      const processedCasos: Caso[] = (data || []).map(assignment => ({
        id: assignment.casos.id,
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
        fecha_asignacion: assignment.fecha_asignacion,
        estado_asignacion: assignment.estado_asignacion,
        notas_asignacion: assignment.notas_asignacion,
        asignacion_id: assignment.id
      }));

      setCasos(processedCasos);
    } catch (error) {
      console.error('Error in useLawyerCases:', error);
      setError('Error inesperado al cargar los casos');
      setCasos([]);
    } finally {
      setLoading(false);
    }
  };

  return { 
    casos, 
    loading, 
    error, 
    refetch: fetchLawyerCases 
  };
}; 