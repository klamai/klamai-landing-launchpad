
import React, { memo } from 'react';
import { motion } from 'framer-motion';
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
import { useSuperAdminStats } from '@/hooks/useSuperAdminStats';

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

const SuperAdminMetrics = memo(() => {
  const { stats } = useSuperAdminStats();

  // Métricas memoizadas
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
      color: "bg-purple-500",
      textColor: "text-purple-600",
      trend: "+15%",
      description: "Completados exitosamente"
    },
    {
      title: "Total Abogados",
      value: stats.totalAbogados.toString(),
      icon: Users,
      color: "bg-indigo-500",
      textColor: "text-indigo-600",
      trend: "+2",
      description: "Abogados registrados"
    },
    {
      title: "Abogados Activos",
      value: stats.abogadosActivos.toString(),
      icon: TrendingUp,
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
      trend: "85%",
      description: "Activos este mes"
    },
    {
      title: "Esperando Pago",
      value: stats.casosEsperandoPago.toString(),
      icon: Clock,
      color: "bg-orange-500",
      textColor: "text-orange-600",
      trend: "-3%",
      description: "Pendientes de pago"
    },
    {
      title: "Casos Agotados",
      value: stats.casosAgotados.toString(),
      icon: DollarSign,
      color: "bg-red-500",
      textColor: "text-red-600",
      trend: "+7%",
      description: "Límite de compras alcanzado"
    }
  ], [stats]);

  if (stats.loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <LoadingCard key={i} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {metrics.map((metric, i) => (
        <MetricCard key={metric.title} metric={metric} index={i} />
      ))}
    </div>
  );
});

SuperAdminMetrics.displayName = 'SuperAdminMetrics';

export default SuperAdminMetrics;
