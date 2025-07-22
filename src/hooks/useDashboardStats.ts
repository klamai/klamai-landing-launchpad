
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  totalCasos: number;
  casosActivos: number;
  casosCerrados: number;
  casosEsperandoPago: number;
  loading: boolean;
  error?: string;
}

interface CachedStats extends DashboardStats {
  timestamp: number;
}

// Cache global para evitar llamadas duplicadas
const statsCache = new Map<string, CachedStats>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCasos: 0,
    casosActivos: 0,
    casosCerrados: 0,
    casosEsperandoPago: 0,
    loading: true
  });
  const { user } = useAuth();

  // Función memoizada para obtener estadísticas
  const fetchStats = useCallback(async () => {
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

    const cacheKey = `stats_${user.id}`;
    const cached = statsCache.get(cacheKey);
    
    // Verificar cache válido
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setStats({
        totalCasos: cached.totalCasos,
        casosActivos: cached.casosActivos,
        casosCerrados: cached.casosCerrados,
        casosEsperandoPago: cached.casosEsperandoPago,
        loading: false
      });
      return;
    }

    try {
      setStats(prev => ({ ...prev, loading: true, error: undefined }));

      // Consulta optimizada con una sola llamada
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, tipo_abogado')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error(`Error obteniendo perfil: ${profileError.message}`);
      }

      if (!profile) {
        throw new Error('No se encontró el perfil del usuario');
      }

      let query = supabase.from('casos').select('estado', { count: 'exact' });

      // Optimización: consultas específicas por rol
      if (profile.role === 'cliente') {
        query = query.eq('cliente_id', user.id);
      } else if (profile.role === 'abogado') {
        if (profile.tipo_abogado === 'super_admin') {
          // Super admin ve casos disponibles y agotados
          query = query.in('estado', ['disponible', 'agotado', 'cerrado']);
        } else {
          // Abogado regular: consulta optimizada con join
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

      const { data: casos, error: casosError } = await query;

      if (casosError) {
        throw new Error(`Error obteniendo casos: ${casosError.message}`);
      }

      // Cálculo optimizado de estadísticas
      const totalCasos = casos?.length || 0;
      const casosActivos = casos?.filter(c => ['disponible', 'esperando_pago'].includes(c.estado)).length || 0;
      const casosCerrados = casos?.filter(c => c.estado === 'cerrado').length || 0;
      const casosEsperandoPago = casos?.filter(c => c.estado === 'esperando_pago').length || 0;

      const newStats = {
        totalCasos,
        casosActivos,
        casosCerrados,
        casosEsperandoPago,
        loading: false
      };

      // Guardar en cache
      statsCache.set(cacheKey, {
        ...newStats,
        timestamp: Date.now()
      });

      setStats(newStats);

    } catch (error: any) {
      console.error('Error en fetchStats:', error);
      setStats(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Error desconocido'
      }));
    }
  }, [user]);

  // Efecto optimizado con dependencias mínimas
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Función de refresco manual que limpia cache
  const refetch = useCallback(() => {
    if (user) {
      statsCache.delete(`stats_${user.id}`);
    }
    fetchStats();
  }, [user, fetchStats]);

  // Memoizar el objeto de retorno para evitar re-renders innecesarios
  return useMemo(() => ({
    ...stats,
    refetch
  }), [stats, refetch]);
};
