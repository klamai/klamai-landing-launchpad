
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Caso } from '@/types/database';

interface AssignedCase extends Caso {
  fecha_asignacion: string;
  estado_asignacion: string;
  notas_asignacion?: string;
  asignacion_id: string;
}

export const useAssignedCases = () => {
  const [cases, setCases] = useState<AssignedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchAssignedCases();
  }, [user]);

  const fetchAssignedCases = async () => {
    if (!user) {
      setCases([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Obtener casos asignados al abogado actual
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
            tipo_lead,
            especialidad_id,
            especialidades (
              nombre
            )
          )
        `)
        .eq('abogado_id', user.id)
        .eq('estado_asignacion', 'activa')
        .order('fecha_asignacion', { ascending: false });

      if (error) {
        console.error('Error fetching assigned cases:', error);
        setError('Error al cargar los casos asignados');
        return;
      }

      // Transformar los datos para que coincidan con la interfaz
      const transformedCases: AssignedCase[] = (data || []).map(assignment => ({
        ...assignment.casos,
        fecha_asignacion: assignment.fecha_asignacion,
        estado_asignacion: assignment.estado_asignacion,
        notas_asignacion: assignment.notas_asignacion,
        asignacion_id: assignment.id
      }));

      setCases(transformedCases);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar los casos asignados');
    } finally {
      setLoading(false);
    }
  };

  return { cases, loading, error, refetch: fetchAssignedCases };
};
