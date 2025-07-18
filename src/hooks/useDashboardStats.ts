
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  totalCasos: number;
  casosActivos: number;
  casosCerrados: number;
  casosEsperandoPago: number;
  loading: boolean;
}

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos de cache
let statsCache: { data: DashboardStats; timestamp: number } | null = null;

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCasos: 0,
    casosActivos: 0,
    casosCerrados: 0,
    casosEsperandoPago: 0,
    loading: true
  });
  const { user, userProfile } = useAuth();

  const fetchStats = useCallback(async () => {
    if (!user || !userProfile) {
      setStats({
        totalCasos: 0,
        casosActivos: 0,
        casosCerrados: 0,
        casosEsperandoPago: 0,
        loading: false
      });
      return;
    }

    // Verificar cache
    if (statsCache && Date.now() - statsCache.timestamp < CACHE_DURATION) {
      setStats(statsCache.data);
      return;
    }

    try {
      setStats(prev => ({ ...prev, loading: true }));

      let query = supabase.from('casos').select('estado', { count: 'exact' });

      // Filtrar según el rol del usuario usando el perfil cacheado
      if (userProfile.role === 'cliente') {
        query = query.eq('cliente_id', user.id);
      } else if (userProfile.role === 'abogado') {
        // Para abogados, optimizar la consulta
        if (userProfile.tipo_abogado === 'super_admin') {
          query = query.in('estado', ['disponible', 'agotado', 'cerrado']);
        } else {
          // Para abogados regulares, obtener casos asignados de forma optimizada
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
      }

      const { data: casos, error } = await query;

      if (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
        return;
      }

      // Calcular estadísticas de forma optimizada
      const newStats = {
        totalCasos: casos?.length || 0,
        casosActivos: casos?.filter(c => ['disponible', 'esperando_pago'].includes(c.estado)).length || 0,
        casosCerrados: casos?.filter(c => c.estado === 'cerrado').length || 0,
        casosEsperandoPago: casos?.filter(c => c.estado === 'esperando_pago').length || 0,
        loading: false
      };

      // Actualizar cache
      statsCache = {
        data: newStats,
        timestamp: Date.now()
      };

      setStats(newStats);

    } catch (error) {
      console.error('Error:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, [user, userProfile]);

  useEffect(() => {
    // Debounce para evitar múltiples llamadas
    const timeoutId = setTimeout(() => {
      fetchStats();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [fetchStats]);

  return { ...stats, refetch: fetchStats };
};
