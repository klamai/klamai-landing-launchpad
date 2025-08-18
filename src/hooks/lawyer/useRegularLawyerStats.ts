import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SecureLogger } from '@/utils/secureLogging';

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
  const [accessDenied, setAccessDenied] = useState(false);
  const { user } = useAuth();

  // Validación de seguridad para abogados regulares
  useEffect(() => {
    const validateAccess = async () => {
      if (!user) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      try {
        SecureLogger.info(`🔍 Validando acceso a useRegularLawyerStats: ${user.id}`);
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, tipo_abogado')
          .eq('id', user.id)
          .single();

        if (error) {
          SecureLogger.error('❌ Error validando acceso:', error);
          setAccessDenied(true);
        } else if (profile && profile.role === 'abogado' && profile.tipo_abogado === 'regular') {
          SecureLogger.info('✅ Acceso autorizado para abogado regular');
          setAccessDenied(false);
        } else {
          SecureLogger.warn(`🚫 Acceso denegado: role=${profile?.role}, tipo=${profile?.tipo_abogado}`, 'regular_lawyer_stats');
          setAccessDenied(true);
        }
      } catch (error) {
        SecureLogger.error('❌ Error general en validación:', error);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    };

    validateAccess();
  }, [user]);

  const fetchStats = async () => {
    if (!user || accessDenied) {
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
        SecureLogger.error('Error fetching assigned cases stats:', assignedError);
        return;
      }

      // Obtener documentos de resolución pendientes
      const { data: documents, error: documentsError } = await supabase
        .from('documentos_resolucion')
        .select('id, es_version_final')
        .eq('abogado_id', user.id)
        .eq('es_version_final', false);

      if (documentsError) {
        SecureLogger.error('Error fetching documents stats:', documentsError);
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
      SecureLogger.error('Error fetching lawyer stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats when access is validated
  useEffect(() => {
    if (!accessDenied && user) {
      fetchStats();
    }
  }, [accessDenied, user]);

  return { 
    stats, 
    loading, 
    accessDenied,
    refetch: fetchStats 
  };
}; 