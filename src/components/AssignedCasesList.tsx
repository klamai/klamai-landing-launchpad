
import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, User, FileText, Phone, Mail } from 'lucide-react';
import { useAssignedCases } from '@/hooks/lawyer/useAssignedCases';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const AssignedCasesList = () => {
  const { cases, loading, error } = useAssignedCases();

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Intentar de nuevo
        </Button>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          No tienes casos asignados actualmente
        </p>
      </div>
    );
  }

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'listo_para_propuesta':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cerrado':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {cases.map((caso, index) => (
        <motion.div
          key={caso.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg font-semibold">
                  Caso #{caso.id.slice(0, 8)}
                </CardTitle>
                <Badge className={getEstadoBadgeColor(caso.estado)}>
                  {caso.estado.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Asignado {formatDistanceToNow(new Date(caso.fecha_asignacion), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </span>
                </div>
                {caso.especialidades && (
                  <Badge variant="outline" className="text-xs">
                    {caso.especialidades.nombre}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Motivo de consulta:
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {caso.motivo_consulta || 'Sin motivo especificado'}
                  </p>
                </div>

                {(caso.nombre_borrador || caso.email_borrador) && (
                  <div className="flex items-center space-x-4 text-sm">
                    {caso.nombre_borrador && (
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {caso.nombre_borrador} {caso.apellido_borrador}
                        </span>
                      </div>
                    )}
                    {caso.email_borrador && (
                      <div className="flex items-center space-x-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {caso.email_borrador}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {caso.notas_asignacion && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Notas de asignación:
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {caso.notas_asignacion}
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="outline" size="sm">
                    Ver Detalles
                  </Button>
                  <Button size="sm">
                    Gestionar Caso
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default AssignedCasesList;
