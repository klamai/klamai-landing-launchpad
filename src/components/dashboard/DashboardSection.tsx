
import React, { memo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/shared/useDashboardStats";
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  FileText,
  User,
  ArrowRight,
  Sparkles,
  Zap
} from "lucide-react";

const DashboardSection = memo(() => {
  const { user } = useAuth();
  const { totalCasos, casosActivos, casosCerrados, casosEsperandoPago, loading, error } = useDashboardStats();

  // Obtener hora del día para saludo personalizado
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  // Datos de actividad reciente mejorados
  const recentActivity = React.useMemo(() => [
    {
      icon: <FileText className="h-4 w-4 text-primary" />,
      text: "Nueva consulta sobre derecho laboral",
      time: "hace 2 horas",
      type: "consulta"
    },
    {
      icon: <CheckCircle className="h-4 w-4 text-success" />,
      text: "Documento de contrato revisado",
      time: "hace 5 horas",
      type: "documento"
    },
    {
      icon: <Calendar className="h-4 w-4 text-accent" />,
      text: "Cita programada para mañana",
      time: "hace 1 día",
      type: "cita"
    },
    {
      icon: <User className="h-4 w-4 text-primary" />,
      text: "Respuesta de abogado recibida",
      time: "hace 2 días",
      type: "respuesta"
    }
  ], []);

  const nextActions = React.useMemo(() => [
    {
      icon: <FileText className="h-4 w-4 text-primary" />,
      text: "Revisar propuesta de acuerdo",
      priority: "alta",
      href: "/dashboard/casos"
    },
    {
      icon: <AlertCircle className="h-4 w-4 text-warning" />,
      text: "Completar formulario fiscal",
      priority: "media",
      href: "/dashboard/nueva-consulta"
    },
    {
      icon: <User className="h-4 w-4 text-accent" />,
      text: "Contactar con abogado especialista",
      priority: "baja",
      href: "/dashboard/casos"
    },
    {
      icon: <Sparkles className="h-4 w-4 text-primary" />,
      text: "Programar nueva consulta",
      priority: "media",
      href: "/dashboard/nueva-consulta"
    }
  ], []);

  // Estadísticas mejoradas con iconos y colores
  const stats = React.useMemo(() => [
    { 
      title: "Consultas Activas", 
      value: casosActivos.toString(), 
      icon: <Clock className="h-5 w-5" />,
      color: "bg-gradient-to-br from-blue-500 to-blue-600", 
      textColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      description: "En proceso"
    },
    { 
      title: "Casos Resueltos", 
      value: casosCerrados.toString(), 
      icon: <CheckCircle className="h-5 w-5" />,
      color: "bg-gradient-to-br from-green-500 to-green-600", 
      textColor: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      description: "Finalizados"
    },
    { 
      title: "Total Casos", 
      value: totalCasos.toString(), 
      icon: <TrendingUp className="h-5 w-5" />,
      color: "bg-gradient-to-br from-purple-500 to-purple-600", 
      textColor: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      description: "Historial completo"
    },
    { 
      title: "Esperando Pago", 
      value: casosEsperandoPago.toString(), 
      icon: <AlertCircle className="h-5 w-5" />,
      color: "bg-gradient-to-br from-orange-500 to-orange-600", 
      textColor: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      description: "Pendientes"
    }
  ], [casosActivos, casosCerrados, totalCasos, casosEsperandoPago]);

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-klamai-gradient bg-clip-text text-transparent mb-2">
            Bienvenido a klamAI
          </h1>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive font-medium">
              Error cargando estadísticas: {error}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header mejorado */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl bg-klamai-gradient-subtle border border-primary/20 p-6"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-klamai-gradient flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {getGreeting()}, {user?.user_metadata?.nombre || user?.email?.split('@')[0] || 'Usuario'}
              </h1>
              <p className="text-muted-foreground text-lg">
                Tu dashboard legal inteligente está listo
              </p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-accent/10 to-transparent"></div>
      </motion.div>

      {/* Estadísticas mejoradas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group card-hover"
          >
            <div className={`${stat.bgColor} rounded-xl p-6 border border-border/50 h-full`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg text-white shadow-lg`}>
                  {stat.icon}
                </div>
                {loading && (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {stat.title}
                </p>
                <p className={`text-3xl font-bold ${stat.textColor} mb-1`}>
                  {loading ? '...' : stat.value}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Secciones de actividad mejoradas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card-hover bg-card rounded-xl border border-border/50 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              Actividad Reciente
            </h3>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="mt-0.5">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground mb-1">
                    {activity.text}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="card-hover bg-card rounded-xl border border-border/50 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              Próximas Acciones
            </h3>
          </div>
          <div className="space-y-4">
            {nextActions.map((action, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {action.icon}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {action.text}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        action.priority === 'alta' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                        action.priority === 'media' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        Prioridad {action.priority}
                      </span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

DashboardSection.displayName = 'DashboardSection';

export default DashboardSection;
