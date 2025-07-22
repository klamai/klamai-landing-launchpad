
import React, { memo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const DashboardSection = memo(() => {
  const { user } = useAuth();
  const { totalCasos, casosActivos, casosCerrados, casosEsperandoPago, loading, error } = useDashboardStats();

  // Datos estáticos memoizados para actividad reciente
  const recentActivity = React.useMemo(() => [
    "Nueva consulta sobre derecho laboral",
    "Documento de contrato revisado",
    "Cita programada para mañana",
    "Respuesta de abogado recibida"
  ], []);

  const nextActions = React.useMemo(() => [
    "Revisar propuesta de acuerdo",
    "Completar formulario fiscal",
    "Contactar con abogado especialista",
    "Programar nueva consulta"
  ], []);

  // Estadísticas dinámicas memoizadas
  const stats = React.useMemo(() => [
    { title: "Consultas Activas", value: casosActivos.toString(), color: "bg-blue-500", textColor: "text-blue-600" },
    { title: "Casos Resueltos", value: casosCerrados.toString(), color: "bg-green-500", textColor: "text-green-600" },
    { title: "Total Casos", value: totalCasos.toString(), color: "bg-purple-500", textColor: "text-purple-600" },
    { title: "Esperando Pago", value: casosEsperandoPago.toString(), color: "bg-orange-500", textColor: "text-orange-600" }
  ], [casosActivos, casosCerrados, totalCasos, casosEsperandoPago]);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Bienvenido a klamAI
          </h1>
          <p className="text-red-600 dark:text-red-400">
            Error cargando estadísticas: {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Bienvenido a klamAI
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Hola {user?.user_metadata?.nombre || user?.email}, aquí tienes tu dashboard legal inteligente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-6 border border-gray-200 dark:border-neutral-700"
          >
            <div className="flex items-center">
              <div className={`${stat.color} h-3 w-3 rounded-full mr-3`}></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className={`text-2xl font-bold ${stat.textColor} dark:text-white`}>
                  {loading ? '...' : stat.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Actividad Reciente
          </h3>
          <div className="space-y-4">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{activity}</p>
              </div>
            ))}
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Próximas Acciones
          </h3>
          <div className="space-y-4">
            {nextActions.map((action, i) => (
              <div key={i} className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-300">{action}</p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  Ver
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

DashboardSection.displayName = 'DashboardSection';

export default DashboardSection;
