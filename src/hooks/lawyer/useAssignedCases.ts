import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AssignedCase {
  id: string;
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
  fecha_asignacion: string;
  estado_asignacion: string;
  notas_asignacion?: string;
  asignacion_id: string;
  cerrado_por_profile?: {
    nombre: string;
    apellido: string;
    email: string;
  };
}

export const useAssignedCases = () => {
  const [cases, setCases] = useState<AssignedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, tipo_abogado')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('❌ Error validando acceso:', error);
          setAccessDenied(true);
        } else if (profile && profile.role === 'abogado' && profile.tipo_abogado === 'regular') {
          setAccessDenied(false);
        } else {
          setAccessDenied(true);
        }
      } catch (error) {
        console.error('❌ Error general en validación:', error);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    };

    validateAccess();
  }, [user]);

  const fetchAssignedCases = async () => {
    if (!user || accessDenied) {
      setCases([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

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
        asignacion_id: assignment.id,
        cerrado_por_profile: null // No mostrar información de quién cerró el caso para abogados regulares
      }));

      setCases(transformedCases);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar los casos asignados');
    } finally {
      setLoading(false);
    }
  };

  // Fetch cases when access is validated
  useEffect(() => {
    if (!accessDenied && user) {
      fetchAssignedCases();
    }
  }, [accessDenied, user]);

  return { 
    cases, 
    loading, 
    error, 
    accessDenied,
    refetch: fetchAssignedCases 
  };
}; 