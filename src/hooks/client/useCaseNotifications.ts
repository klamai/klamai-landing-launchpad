import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CaseNotification {
  id: string;
  mensaje: string;
  leida: boolean;
  url_destino?: string;
  created_at: string;
  caso_id: string;
  usuario_id: string;
}

export const useCaseNotifications = (casoId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['case-notifications', casoId, user?.id],
    queryFn: async (): Promise<CaseNotification[]> => {
      if (!user?.id || !casoId) {
        throw new Error('Usuario no autenticado o caso no especificado');
      }

      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('caso_id', casoId)
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!casoId,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
  });
};

export const useCaseUnreadNotificationsCount = (casoId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['case-unread-notifications-count', casoId, user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id || !casoId) {
        return 0;
      }

      const { data, error } = await supabase
        .from('notificaciones')
        .select('id', { count: 'exact' })
        .eq('caso_id', casoId)
        .eq('usuario_id', user.id)
        .eq('leida', false);

      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!user?.id && !!casoId,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
  });
}; 