
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Caso } from '@/types/database';
import { filterCaseForClient } from '@/utils/caseDisplayUtils';

export const useCasesByRole = () => {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchCasos();
  }, [user]);

  const fetchCasos = async () => {
    if (!user) return;

    try {
      // Obtener el perfil del usuario para conocer su rol
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Query base para casos
      let query = supabase
        .from('casos')
        .select(`
          *,
          especialidades (
            nombre
          )
        `);

      // Filtrar según el rol
      if (profile?.role === 'cliente') {
        // Los clientes solo ven sus propios casos
        query = query.eq('cliente_id', user.id);
      } else if (profile?.role === 'abogado') {
        // Los abogados ven casos disponibles y casos que han comprado
        query = query.or(`estado.in.(disponible,agotado),id.in.(select caso_id from casos_comprados where abogado_id.eq.${user.id})`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching casos:', error);
        return;
      }

      // Filtrar campos según el rol
      let processedCasos = data || [];
      
      if (profile?.role === 'cliente') {
        // Para clientes, filtrar campos sensibles
        processedCasos = processedCasos.map(caso => filterCaseForClient(caso as Caso));
      }

      setCasos(processedCasos as Caso[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return { casos, loading, refetch: fetchCasos };
};
