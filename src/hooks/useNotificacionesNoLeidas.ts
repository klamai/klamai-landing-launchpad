import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useNotificacionesNoLeidas() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCount(0);
      setLoading(false);
      return;
    }

    const fetchNotificacionesNoLeidas = async () => {
      try {
        const { data, error } = await supabase
          .from('notificaciones')
          .select('id')
          .eq('usuario_id', user.id)
          .eq('leida', false);

        if (error) {
          console.error('Error fetching unread notifications:', error);
          return;
        }

        setCount(data?.length || 0);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotificacionesNoLeidas();

    // Suscripción en tiempo real para notificaciones nuevas
    const channel = supabase
      .channel('unread-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `usuario_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as any;
          if (!newNotification.leida) {
            setCount(prev => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notificaciones',
          filter: `usuario_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as any;
          const oldNotification = payload.old as any;
          
          // Si se marcó como leída
          if (oldNotification.leida === false && updatedNotification.leida === true) {
            setCount(prev => Math.max(0, prev - 1));
          }
          // Si se marcó como no leída
          else if (oldNotification.leida === true && updatedNotification.leida === false) {
            setCount(prev => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notificaciones',
          filter: `usuario_id=eq.${user.id}`,
        },
        (payload) => {
          const deletedNotification = payload.old as any;
          if (!deletedNotification.leida) {
            setCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { count, loading };
} 