
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AssignedCase {
  id: string;
  motivo_consulta: string | null;
  resumen_caso: string | null;
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
        id: assignment.casos.id,
        motivo_consulta: assignment.casos.motivo_consulta,
        resumen_caso: assignment.casos.resumen_caso,
        estado: assignment.casos.estado,
        created_at: assignment.casos.created_at,
        nombre_borrador: assignment.casos.nombre_borrador,
        apellido_borrador: assignment.casos.apellido_borrador,
        email_borrador: assignment.casos.email_borrador,
        telefono_borrador: assignment.casos.telefono_borrador,
        tipo_lead: assignment.casos.tipo_lead,
        especialidad_id: assignment.casos.especialidad_id,
        especialidades: assignment.casos.especialidades,
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
