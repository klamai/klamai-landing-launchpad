
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { filterCaseForClient } from '@/utils/caseDisplayUtils';

interface CasoWithEspecialidad {
  id: string;
  cliente_id: string | null;
  especialidad_id: number | null;
  estado: 'borrador' | 'esperando_pago' | 'disponible' | 'agotado' | 'cerrado' | 'listo_para_propuesta';
  tipo_lead: 'estandar' | 'premium' | 'urgente' | null;
  motivo_consulta: string | null;
  resumen_caso: string | null;
  guia_abogado: string | null;
  transcripcion_chat: any;
  propuesta_estructurada: any;
  propuesta_cliente: string | null;
  valor_estimado: string | null;
  canal_atencion: string;
  costo_en_creditos: number;
  compras_realizadas: number;
  limite_compras: number;
  fecha_ultimo_contacto: string | null;
  tiene_notificaciones_nuevas: boolean | null;
  acepto_politicas_inicial: boolean | null;
  tipo_perfil_borrador: 'individual' | 'empresa' | null;
  nombre_borrador: string | null;
  apellido_borrador: string | null;
  email_borrador: string | null;
  telefono_borrador: string | null;
  ciudad_borrador: string | null;
  razon_social_borrador: string | null;
  nif_cif_borrador: string | null;
  direccion_fiscal_borrador: string | null;
  nombre_gerente_borrador: string | null;
  preferencia_horaria_contacto: string | null;
  created_at: string;
  especialidades?: {
    nombre: string;
  };
}

export const useCasesByRole = () => {
  const [casos, setCasos] = useState<CasoWithEspecialidad[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchCasos();
  }, [user]);

  const fetchCasos = async () => {
    if (!user) {
      setCasos([]);
      setLoading(false);
      return;
    }

    try {
      // Obtener el perfil del usuario para conocer su rol
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile) {
        console.error('No se encontró el perfil del usuario');
        setCasos([]);
        setLoading(false);
        return;
      }

      // Query base para casos
      let query = supabase
        .from('casos')
        .select(`
          *,
          especialidades (
            nombre
          )
        `);

      // Filtrar estrictamente según el rol
      if (profile.role === 'cliente') {
        // Los clientes SOLO ven sus propios casos
        query = query.eq('cliente_id', user.id);
      } else if (profile.role === 'abogado') {
        // Los abogados ven casos disponibles y casos que han comprado
        // Primero obtener los casos que ha comprado este abogado
        const { data: casosComprados } = await supabase
          .from('casos_comprados')
          .select('caso_id')
          .eq('abogado_id', user.id);

        const casoIdsComprados = casosComprados?.map(c => c.caso_id) || [];
        
        if (casoIdsComprados.length > 0) {
          // Casos disponibles O casos que ha comprado
          query = query.or(`estado.in.(disponible,agotado),id.in.(${casoIdsComprados.join(',')})`);
        } else {
          // Solo casos disponibles si no ha comprado ninguno
          query = query.in('estado', ['disponible', 'agotado']);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching casos:', error);
        setCasos([]);
        return;
      }

      // Filtrar campos según el rol
      let processedCasos = data || [];
      
      if (profile.role === 'cliente') {
        // Para clientes, filtrar campos sensibles
        processedCasos = processedCasos.map(caso => filterCaseForClient({
          ...caso,
          especialidades: caso.especialidades || undefined
        }));
      }

      setCasos(processedCasos);
    } catch (error) {
      console.error('Error:', error);
      setCasos([]);
    } finally {
      setLoading(false);
    }
  };

  return { casos, loading, refetch: fetchCasos };
};
