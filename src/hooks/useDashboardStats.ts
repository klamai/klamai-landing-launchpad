
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  totalCasos: number;
  casosActivos: number;
  casosCerrados: number;
  casosEsperandoPago: number;
  loading: boolean;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCasos: 0,
    casosActivos: 0,
    casosCerrados: 0,
    casosEsperandoPago: 0,
    loading: true
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) {
      setStats({
        totalCasos: 0,
        casosActivos: 0,
        casosCerrados: 0,
        casosEsperandoPago: 0,
        loading: false
      });
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
        setStats(prev => ({ ...prev, loading: false }));
        return;
      }

      let query = supabase.from('casos').select('estado', { count: 'exact' });

      // Filtrar según el rol del usuario
      if (profile.role === 'cliente') {
        query = query.eq('cliente_id', user.id);
      } else if (profile.role === 'abogado') {
        // Para abogados, obtener casos disponibles y casos comprados
        const { data: casosComprados } = await supabase
          .from('casos_comprados')
          .select('caso_id')
          .eq('abogado_id', user.id);

        const casoIdsComprados = casosComprados?.map(c => c.caso_id) || [];
        
        if (casoIdsComprados.length > 0) {
          query = query.or(`estado.in.(disponible,agotado),id.in.(${casoIdsComprados.join(',')})`);
        } else {
          query = query.in('estado', ['disponible', 'agotado']);
        }
      }

      const { data: casos, error } = await query;

      if (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
        return;
      }

      // Calcular estadísticas
      const totalCasos = casos?.length || 0;
      const casosActivos = casos?.filter(c => ['disponible', 'esperando_pago'].includes(c.estado)).length || 0;
      const casosCerrados = casos?.filter(c => c.estado === 'cerrado').length || 0;
      const casosEsperandoPago = casos?.filter(c => c.estado === 'esperando_pago').length || 0;

      setStats({
        totalCasos,
        casosActivos,
        casosCerrados,
        casosEsperandoPago,
        loading: false
      });

    } catch (error) {
      console.error('Error:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  return { ...stats, refetch: fetchStats };
};
