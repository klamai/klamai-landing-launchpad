import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SuperAdminStats {
  totalClientes: number;
  totalAbogados: number;
  totalCasos: number;
  ingresosMes: number;
  casosPorEstado: Array<{ estado: string; cantidad: number }>;
  ingresosGastos: Array<{ mes: string; ingresos: number; gastos: number }>;
  clientesData: Array<{ mes: string; nuevos: number; activos: number }>;
  casosPorEspecialidad: Array<{ nombre: string; casos: number; color: string }>;
}

// Función para obtener datos del super admin
const fetchSuperAdminStats = async (): Promise<SuperAdminStats> => {
  try {
    // Obtener estadísticas de clientes
    const { count: totalClientes } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'cliente');

    // Obtener estadísticas de abogados
    const { count: totalAbogados } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'abogado');

    // Obtener estadísticas de casos
    const { count: totalCasos } = await supabase
      .from('casos')
      .select('*', { count: 'exact', head: true });

    // Obtener casos por estado
    const { data: casosPorEstado } = await supabase
      .from('casos')
      .select('estado')
      .not('estado', 'is', null);

    // Procesar casos por estado
    const estadoCounts = casosPorEstado?.reduce((acc, caso) => {
      acc[caso.estado] = (acc[caso.estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const casosPorEstadoArray = Object.entries(estadoCounts).map(([estado, cantidad]) => ({
      estado,
      cantidad: cantidad as number
    }));

    // Datos mock para ingresos (se puede implementar cuando tengamos tabla de pagos)
    const ingresosGastos = [
      { mes: "Ene", ingresos: Math.floor((totalCasos || 0) * 1500), gastos: Math.floor((totalCasos || 0) * 500) },
      { mes: "Feb", ingresos: Math.floor((totalCasos || 0) * 1600), gastos: Math.floor((totalCasos || 0) * 550) },
      { mes: "Mar", ingresos: Math.floor((totalCasos || 0) * 1400), gastos: Math.floor((totalCasos || 0) * 480) },
      { mes: "Abr", ingresos: Math.floor((totalCasos || 0) * 1700), gastos: Math.floor((totalCasos || 0) * 600) },
      { mes: "May", ingresos: Math.floor((totalCasos || 0) * 1800), gastos: Math.floor((totalCasos || 0) * 650) },
      { mes: "Jun", ingresos: Math.floor((totalCasos || 0) * 1900), gastos: Math.floor((totalCasos || 0) * 700) },
    ];

    // Datos mock para clientes por mes
    const clientesData = [
      { mes: "Ene", nuevos: Math.floor((totalClientes || 0) * 0.1), activos: Math.floor((totalClientes || 0) * 0.6) },
      { mes: "Feb", nuevos: Math.floor((totalClientes || 0) * 0.12), activos: Math.floor((totalClientes || 0) * 0.65) },
      { mes: "Mar", nuevos: Math.floor((totalClientes || 0) * 0.08), activos: Math.floor((totalClientes || 0) * 0.7) },
      { mes: "Abr", nuevos: Math.floor((totalClientes || 0) * 0.15), activos: Math.floor((totalClientes || 0) * 0.75) },
      { mes: "May", nuevos: Math.floor((totalClientes || 0) * 0.13), activos: Math.floor((totalClientes || 0) * 0.8) },
      { mes: "Jun", nuevos: Math.floor((totalClientes || 0) * 0.16), activos: Math.floor((totalClientes || 0) * 0.85) },
    ];

    // Obtener casos por especialidad
    const { data: casosConEspecialidad } = await supabase
      .from('casos')
      .select(`
        especialidad_id,
        especialidades:especialidades(nombre)
      `)
      .not('especialidad_id', 'is', null);

    // Procesar casos por especialidad
    const especialidadCounts = casosConEspecialidad?.reduce((acc, caso) => {
      const nombre = caso.especialidades?.nombre || 'Sin Especialidad';
      acc[nombre] = (acc[nombre] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const casosPorEspecialidad = Object.entries(especialidadCounts).map(([nombre, casos], index) => {
      const colors = ['#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#10b981', '#f97316', '#ec4899'];
      return {
        nombre,
        casos: casos as number,
        color: colors[index % colors.length]
      };
    });

    return {
      totalClientes: totalClientes || 0,
      totalAbogados: totalAbogados || 0,
      totalCasos: totalCasos || 0,
      ingresosMes: ingresosGastos[ingresosGastos.length - 1].ingresos,
      casosPorEstado: casosPorEstadoArray,
      ingresosGastos,
      clientesData,
      casosPorEspecialidad,
    };
  } catch (error) {
    console.error('Error fetching super admin stats:', error);
    throw new Error('Error al cargar las estadísticas del super admin');
  }
};

// Hook optimizado con React Query
export const useSuperAdminStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['superAdminStats', user?.id],
    queryFn: fetchSuperAdminStats,
    enabled: !!user, // Solo ejecutar si hay usuario
    staleTime: 5 * 60 * 1000, // Datos frescos por 5 minutos
    gcTime: 10 * 60 * 1000, // Caché por 10 minutos
    refetchOnWindowFocus: false, // No recargar al cambiar de pestaña
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 3;
    },
  });
}; 