import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface RegularLawyerStats {
  totalClientes: number;
  casosActivos: number;
  ingresosMes: number;
  pagosPendientes: number;
  clientesData: Array<{ mes: string; nuevos: number; activos: number }>;
  casosPorEspecialidad: Array<{ nombre: string; casos: number; color: string }>;
  ingresosGastos: Array<{ mes: string; ingresos: number; gastos: number }>;
  casosPorEstado: Array<{ estado: string; cantidad: number; fill: string }>;
  rendimiento: Array<{ categoria: string; valor: number }>;
}

const fetchRegularLawyerStats = async (): Promise<RegularLawyerStats> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  // Verificar que el usuario es un abogado regular
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, tipo_abogado')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Error obteniendo perfil de usuario');
  }

  if (profile.role !== 'abogado' || profile.tipo_abogado !== 'regular') {
    throw new Error('Acceso denegado: solo abogados regulares');
  }

  // Obtener casos asignados al abogado
  const { data: casosAsignados, error: casosError } = await supabase
    .from('asignaciones_casos')
    .select(`
      caso_id,
      casos (
        id,
        estado,
        created_at,
        valor_estimado,
        cliente_id,
        profiles!casos_cliente_id_fkey (
          id,
          nombre,
          apellido,
          email
        )
      )
    `)
    .eq('abogado_id', user.id);

  if (casosError) {
    throw new Error('Error obteniendo casos asignados');
  }

  // Procesar datos
  const casos = casosAsignados?.map(ac => ac.casos).filter(Boolean) || [];
  const casosActivos = casos.filter(c => c.estado !== 'cerrado').length;
  const totalClientes = new Set(casos.map(c => c.cliente_id)).size;

  // Calcular ingresos del mes (simulado)
  const ingresosMes = casos
    .filter(c => c.valor_estimado && c.estado === 'cerrado')
    .reduce((sum, c) => sum + (parseFloat(c.valor_estimado || '0') || 0), 0);

  // Calcular pagos pendientes (simulado)
  const pagosPendientes = casos
    .filter(c => c.estado === 'asignado' && c.valor_estimado)
    .reduce((sum, c) => sum + (parseFloat(c.valor_estimado || '0') || 0), 0);

  // Datos simulados para gráficos (en producción, estos vendrían de la BD)
  const clientesData = [
    { mes: 'Ene', nuevos: 5, activos: 12 },
    { mes: 'Feb', nuevos: 8, activos: 15 },
    { mes: 'Mar', nuevos: 12, activos: 18 },
    { mes: 'Abr', nuevos: 10, activos: 20 },
    { mes: 'May', nuevos: 15, activos: 22 },
    { mes: 'Jun', nuevos: 18, activos: 25 }
  ];

  const casosPorEspecialidad = [
    { nombre: 'Civil', casos: 8, color: '#3B82F6' },
    { nombre: 'Laboral', casos: 12, color: '#10B981' },
    { nombre: 'Mercantil', casos: 6, color: '#F59E0B' },
    { nombre: 'Penal', casos: 4, color: '#EF4444' }
  ];

  const ingresosGastos = [
    { mes: 'Ene', ingresos: 15000, gastos: 8000 },
    { mes: 'Feb', ingresos: 18000, gastos: 8500 },
    { mes: 'Mar', ingresos: 22000, gastos: 9000 },
    { mes: 'Abr', ingresos: 20000, gastos: 9200 },
    { mes: 'May', ingresos: 25000, gastos: 9500 },
    { mes: 'Jun', ingresos: 28000, gastos: 10000 }
  ];

  const casosPorEstado = [
    { estado: 'Disponible', cantidad: casos.filter(c => c.estado === 'disponible').length, fill: '#3B82F6' },
    { estado: 'Asignado', cantidad: casos.filter(c => c.estado === 'asignado').length, fill: '#10B981' },
    { estado: 'En Proceso', cantidad: casos.filter(c => c.estado === 'en_proceso').length, fill: '#F59E0B' },
    { estado: 'Cerrado', cantidad: casos.filter(c => c.estado === 'cerrado').length, fill: '#6B7280' }
  ];

  const rendimiento = [
    { categoria: 'Eficiencia', valor: 85 },
    { categoria: 'Satisfacción', valor: 92 },
    { categoria: 'Rentabilidad', valor: 78 },
    { categoria: 'Productividad', valor: 88 }
  ];

  return {
    totalClientes,
    casosActivos,
    ingresosMes,
    pagosPendientes,
    clientesData,
    casosPorEspecialidad,
    ingresosGastos,
    casosPorEstado,
    rendimiento
  };
};

export const useRegularLawyerStats = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['regularLawyerStats', user?.id],
    queryFn: fetchRegularLawyerStats,
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Acceso denegado')) return false;
      return failureCount < 3;
    },
  });
}; 