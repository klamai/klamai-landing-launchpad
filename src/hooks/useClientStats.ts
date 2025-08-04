import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ClientStats {
  totalCases: number;
  activeCases: number;
  closedCases: number;
  pendingCases: number;
  totalPayments: number;
  pendingPayments: number;
  completedPayments: number;
  totalNotifications: number;
  unreadNotifications: number;
  recentActivity: Array<{
    id: string;
    type: 'case' | 'payment' | 'notification';
    description: string;
    timestamp: string;
    amount?: number;
  }>;
  casesByStatus: {
    active: number;
    pending: number;
    closed: number;
  };
  casesByPriority: {
    high: number;
    medium: number;
    low: number;
  };
  paymentHistory: Array<{
    id: string;
    amount: number;
    status: 'completed' | 'pending' | 'failed';
    date: string;
    description: string;
  }>;
}

export const useClientStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-stats', user?.id],
    queryFn: async (): Promise<ClientStats> => {
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener casos del cliente - solo campos básicos que puede ver
      const { data: cases, error: casesError } = await supabase
        .from('casos')
        .select(`
          id,
          estado,
          created_at,
          fecha_cierre,
          valor_estimado,
          tipo_lead,
          especialidad_id,
          especialidades!casos_especialidad_id_fkey(
            nombre
          )
        `)
        .eq('cliente_id', user.id);

      if (casesError) throw casesError;

      // Obtener pagos del cliente
      const { data: payments, error: paymentsError } = await supabase
        .from('pagos')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Obtener notificaciones del cliente
      const { data: notifications, error: notificationsError } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (notificationsError) throw notificationsError;

      // Calcular estadísticas
      const totalCases = cases?.length || 0;
      const activeCases = cases?.filter(c => c.estado === 'asignado').length || 0;
      const closedCases = cases?.filter(c => c.estado === 'cerrado').length || 0;
      const pendingCases = cases?.filter(c => c.estado === 'esperando_pago').length || 0;

      const totalPayments = payments?.reduce((sum, p) => sum + (p.monto || 0), 0) || 0;
      const pendingPayments = payments?.filter(p => p.estado === 'processing').reduce((sum, p) => sum + (p.monto || 0), 0) || 0;
      const completedPayments = payments?.filter(p => p.estado === 'succeeded').reduce((sum, p) => sum + (p.monto || 0), 0) || 0;

      const totalNotifications = notifications?.length || 0;
      const unreadNotifications = notifications?.filter(n => !n.leida).length || 0;

      // Casos por estado
      const casesByStatus = {
        active: activeCases,
        pending: pendingCases,
        closed: closedCases,
      };

      // Casos por prioridad (usando tipo_lead como proxy de prioridad)
      const casesByPriority = {
        high: cases?.filter(c => c.tipo_lead === 'urgente').length || 0,
        medium: cases?.filter(c => c.tipo_lead === 'premium').length || 0,
        low: cases?.filter(c => c.tipo_lead === 'estandar').length || 0,
      };

      // Actividad reciente (últimos 10 eventos)
      const recentActivity = [
        ...(cases?.slice(0, 3).map(c => ({
          id: c.id,
          type: 'case' as const,
          description: `Caso de ${c.especialidades?.nombre || 'Derecho'}`,
          timestamp: c.created_at,
        })) || []),
        ...(payments?.slice(0, 3).map(p => ({
          id: p.id,
          type: 'payment' as const,
          description: `Pago ${p.estado === 'succeeded' ? 'completado' : p.estado === 'processing' ? 'pendiente' : 'fallido'}`,
          timestamp: p.created_at,
          amount: p.monto,
        })) || []),
        ...(notifications?.slice(0, 4).map(n => ({
          id: n.id,
          type: 'notification' as const,
          description: n.mensaje,
          timestamp: n.created_at,
        })) || []),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

      // Historial de pagos
      const paymentHistory = payments?.map(p => ({
        id: p.id,
        amount: p.monto || 0,
        status: p.estado as 'completed' | 'pending' | 'failed',
        date: p.created_at,
        description: p.descripcion || 'Pago de servicios legales',
      })) || [];

      return {
        totalCases,
        activeCases,
        closedCases,
        pendingCases,
        totalPayments,
        pendingPayments,
        completedPayments,
        totalNotifications,
        unreadNotifications,
        recentActivity,
        casesByStatus,
        casesByPriority,
        paymentHistory,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}; 