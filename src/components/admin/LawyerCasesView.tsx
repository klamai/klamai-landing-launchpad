import React from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  Calendar,
  User,
  MapPin,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { useAdminLawyerCases } from '@/hooks/queries/useLawyerCases';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LawyerCasesViewProps {
  lawyerId: string;
  lawyerName: string;
  onViewCaseDetails: (caseId: string) => void;
}

const LawyerCasesView: React.FC<LawyerCasesViewProps> = ({
  lawyerId,
  lawyerName,
  onViewCaseDetails
}) => {
  const { data: cases, isLoading, error } = useAdminLawyerCases(lawyerId);

  const getStatusBadge = (estado: string) => {
    const statusConfig = {
      asignado: { label: 'Asignado', className: 'bg-purple-100 text-purple-800 border-purple-200' },
      listo_para_propuesta: { label: 'Listo para Propuesta', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      propuesta_enviada: { label: 'Propuesta Enviada', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      cerrado: { label: 'Cerrado', className: 'bg-blue-100 text-blue-800 border-blue-200' }
    };

    const config = statusConfig[estado as keyof typeof statusConfig] || statusConfig.asignado;
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getAssignmentStatusIcon = (estado: string) => {
    switch (estado) {
      case 'activa':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'completada':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando casos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error al cargar casos
          </h3>
          <p className="text-gray-600 dark:text-gray-400">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!cases || cases.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No hay casos asignados
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {lawyerName} no tiene casos asignados actualmente
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            Los casos aparecerán aquí cuando sean asignados al abogado
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header mejorado con estadísticas */}
      <div className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <Briefcase className="w-8 h-8" />
              Casos de {lawyerName}
            </h3>
            <p className="text-green-100 text-lg mt-1">
              Lista completa de casos asignados y su estado
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-sm text-green-200">Total Casos</div>
              <div className="text-3xl font-bold">{cases.length}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-green-200">Activos</div>
              <div className="text-3xl font-bold">
                {cases.filter(c => c.estado_asignacion === 'activa').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid responsive de casos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cases
          .sort((a, b) => new Date(b.fecha_asignacion).getTime() - new Date(a.fecha_asignacion).getTime())
          .map((case_, index) => (
          <motion.div
            key={case_.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 hover:border-l-blue-600 group h-full">
              <CardContent className="p-6 h-full flex flex-col">
                {/* Header con estado y fecha */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      case_.estado_asignacion === 'activa'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      {getAssignmentStatusIcon(case_.estado_asignacion)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(case_.estado)}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Asignado: {format(new Date(case_.fecha_asignacion), 'dd MMM yyyy HH:mm', { locale: es })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información del cliente */}
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {case_.nombre_borrador} {case_.apellido_borrador}
                    </span>
                  </div>
                  {case_.email_borrador && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                      📧 {case_.email_borrador}
                    </p>
                  )}
                </div>

                {/* Descripción del caso */}
                <div className="mb-4 flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    {case_.motivo_consulta}
                  </h4>
                  {case_.resumen_caso && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                      {case_.resumen_caso}
                    </p>
                  )}
                </div>

                {/* Especialidades y valor */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {case_.especialidades && Array.isArray(case_.especialidades) && case_.especialidades.length > 0 ? (
                    case_.especialidades.slice(0, 3).map((esp, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                        {typeof esp === 'object' && esp.nombre ? esp.nombre : esp}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Consulta General
                    </Badge>
                  )}
                  {case_.valor_estimado && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                      💰 {case_.valor_estimado}
                    </Badge>
                  )}
                </div>

                {/* Ciudad y tipo de lead */}
                {(case_.ciudad_borrador || case_.tipo_lead) && (
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                    {case_.ciudad_borrador && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{case_.ciudad_borrador}</span>
                      </div>
                    )}
                    {case_.tipo_lead && (
                      <Badge variant="outline" className="text-xs">
                        {case_.tipo_lead}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Acción */}
                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewCaseDetails(case_.id)}
                    className="hover:bg-blue-50 hover:border-blue-200 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalles
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LawyerCasesView;