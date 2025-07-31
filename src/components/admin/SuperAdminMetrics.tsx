import React, { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { 
  Scale, 
  Users, 
  FileCheck, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { useSuperAdminStats } from '@/hooks/admin/useSuperAdminStats';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// Componente memoizado para cada métrica individual
const MetricCard = memo(({ metric, index }: { metric: any; index: number }) => {
  const IconComponent = metric.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-6 border border-gray-200 dark:border-neutral-700 hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`${metric.color} h-3 w-3 rounded-full mr-3`}></div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {metric.title}
          </p>
        </div>
        <div className={`${metric.color} p-2 rounded-lg`}>
          <IconComponent className="h-4 w-4 text-white" />
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className={`text-2xl font-bold ${metric.textColor} dark:text-white mb-1`}>
            {metric.value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {metric.description}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-medium ${
            metric.trend.startsWith('+') ? 'text-green-600' : 
            metric.trend.startsWith('-') ? 'text-red-600' : 'text-blue-600'
          }`}>
            {metric.trend}
          </p>
          <p className="text-xs text-gray-400">vs. mes anterior</p>
        </div>
      </div>
    </motion.div>
  );
});

MetricCard.displayName = 'MetricCard';

// Componente memoizado para skeleton loading
const LoadingCard = memo(({ index }: { index: number }) => (
  <div key={index} className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-6 border border-gray-200 dark:border-neutral-700 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
      <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
    </div>
    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16 mb-2"></div>
    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
  </div>
));

LoadingCard.displayName = 'LoadingCard';

// Componente de acceso no autorizado
const UnauthorizedAccess = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Acceso No Autorizado
        </h2>
        <p className="text-red-600 dark:text-red-300 mb-4">
          Solo los super administradores pueden acceder a estas métricas.
        </p>
        <button
          onClick={() => window.location.href = '/abogados/dashboard'}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Volver al Dashboard
        </button>
      </div>
    </div>
  </div>
);

const AdminSuperAdminMetrics = memo(() => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [lawyerType, setLawyerType] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const { stats } = useSuperAdminStats();

  // Métricas memoizadas - DEBE ir ANTES de los condicionales para evitar errores de hooks
  const metrics = React.useMemo(() => [
    {
      title: "Total de Casos",
      value: stats.totalCasos.toString(),
      icon: Scale,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      trend: "+12%",
      description: "Todos los casos en el sistema"
    },
    {
      title: "Casos Disponibles",
      value: stats.casosDisponibles.toString(),
      icon: AlertCircle,
      color: "bg-yellow-500",
      textColor: "text-yellow-600",
      trend: "+5%",
      description: "Listos para asignar"
    },
    {
      title: "Casos Asignados",
      value: stats.casosAsignados.toString(),
      icon: CheckCircle,
      color: "bg-green-500",
      textColor: "text-green-600",
      trend: "+8%",
      description: "En proceso con abogados"
    },
    {
      title: "Casos Cerrados",
      value: stats.casosCerrados.toString(),
      icon: FileCheck,
      color: "bg-gray-500",
      textColor: "text-gray-600",
      trend: "+15%",
      description: "Completados exitosamente"
    },
    {
      title: "Total Abogados",
      value: stats.totalAbogados.toString(),
      icon: Users,
      color: "bg-purple-500",
      textColor: "text-purple-600",
      trend: "+3%",
      description: "Equipo legal activo"
    },
    {
      title: "Casos Esperando Pago",
      value: stats.casosEsperandoPago.toString(),
      icon: Clock,
      color: "bg-orange-500",
      textColor: "text-orange-600",
      trend: "-2%",
      description: "Pendientes de pago"
    }
  ], [stats]);

  // Validación de seguridad para super_admin
  useEffect(() => {
    const validateAccess = async () => {
      if (!user) {
        setRoleLoading(false);
        return;
      }

      try {
        console.log('🔍 Validando acceso a SuperAdminMetrics:', user.id);
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, tipo_abogado')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('❌ Error validando acceso:', error);
          setUserRole('unauthorized');
          setLawyerType(null);
        } else if (profile) {
          console.log('✅ Perfil obtenido para validación:', profile);
          setUserRole(profile.role);
          setLawyerType(profile.tipo_abogado);
        } else {
          console.log('⚠️ No se encontró perfil para validación');
          setUserRole('unauthorized');
          setLawyerType(null);
        }
      } catch (error) {
        console.error('❌ Error general en validación:', error);
        setUserRole('unauthorized');
        setLawyerType(null);
      } finally {
        setRoleLoading(false);
      }
    };

    validateAccess();
  }, [user]);

  // Loading state
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Bloquear acceso no autorizado
  if (userRole !== 'abogado' || lawyerType !== 'super_admin') {
    console.log('🚫 Acceso denegado a SuperAdminMetrics:', { userRole, lawyerType });
    return <UnauthorizedAccess />;
  }

  // Renderizar métricas
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Métricas del Sistema
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Estadísticas en tiempo real del rendimiento del bufete.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={metric.title} metric={metric} index={index} />
        ))}
      </div>

      {/* Resumen adicional */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Resumen de Actividad
            </h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              El sistema está funcionando correctamente con {stats.totalCasos} casos gestionados.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {((stats.casosCerrados / stats.totalCasos) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Tasa de éxito
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

AdminSuperAdminMetrics.displayName = 'AdminSuperAdminMetrics';

export default AdminSuperAdminMetrics; 