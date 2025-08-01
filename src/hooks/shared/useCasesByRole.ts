
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { filterCaseForClient } from '@/utils/caseDisplayUtils';
import { Caso } from '@/types/database';

export const useCasesByRole = () => {
  const [casos, setCasos] = useState<Caso[]>([]);
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

      // Convertir los datos a la estructura esperada
      let processedCasos: Caso[] = (data || []).map(caso => ({
        ...caso,
        especialidades: caso.especialidades || undefined
      }));
      
      if (profile.role === 'cliente') {
        // Para clientes, filtrar campos sensibles
        processedCasos = processedCasos.map(caso => filterCaseForClient(caso));
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
