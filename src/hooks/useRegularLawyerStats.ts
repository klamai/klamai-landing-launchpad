
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RegularLawyerStats {
  totalCasosAsignados: number;
  casosActivos: number;
  casosCompletados: number;
  documentosPendientes: number;
}

export const useRegularLawyerStats = () => {
  const [stats, setStats] = useState<RegularLawyerStats>({
    totalCasosAsignados: 0,
    casosActivos: 0,
    casosCompletados: 0,
    documentosPendientes: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Obtener casos asignados (incluyendo casos cerrados)
      const { data: assignedCases, error: assignedError } = await supabase
        .from('asignaciones_casos')
        .select(`
          id,
          estado_asignacion,
          casos!inner (
            id,
            estado
          )
        `)
        .eq('abogado_id', user.id)
        .in('estado_asignacion', ['activa', 'completada']);

      if (assignedError) {
        console.error('Error fetching assigned cases stats:', assignedError);
        return;
      }

      // Obtener documentos de resolución pendientes
      const { data: documents, error: documentsError } = await supabase
        .from('documentos_resolucion')
        .select('id, es_version_final')
        .eq('abogado_id', user.id)
        .eq('es_version_final', false);

      if (documentsError) {
        console.error('Error fetching documents stats:', documentsError);
      }

      // Calcular estadísticas
      const totalCasosAsignados = assignedCases?.length || 0;
      const casosActivos = assignedCases?.filter(
        assignment => assignment.casos.estado === 'disponible' || assignment.casos.estado === 'listo_para_propuesta'
      ).length || 0;
      const casosCompletados = assignedCases?.filter(
        assignment => assignment.casos.estado === 'cerrado'
      ).length || 0;
      const documentosPendientes = documents?.length || 0;

      setStats({
        totalCasosAsignados,
        casosActivos,
        casosCompletados,
        documentosPendientes
      });
    } catch (error) {
      console.error('Error fetching lawyer stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetch: fetchStats };
};
