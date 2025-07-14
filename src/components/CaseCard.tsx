import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Euro, 
  Clock, 
  FileText,
  UserPlus,
  Bot,
  Eye
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CaseCardProps {
  caso: {
    id: string;
    motivo_consulta: string;
    resumen_caso?: string;
    guia_abogado?: string;
    especialidad_id: number;
    estado: string;
    created_at: string;
    cliente_id: string;
    valor_estimado?: string;
    tipo_lead?: string;
    ciudad_borrador?: string;
    nombre_borrador?: string;
    apellido_borrador?: string;
    email_borrador?: string;
    telefono_borrador?: string;
    tipo_perfil_borrador?: string;
    documentos_adjuntos?: any;
    especialidades?: { nombre: string };
    profiles?: { nombre: string; apellido: string; email: string };
    asignaciones_casos?: Array<{
      abogado_id: string;
      estado_asignacion: string;
      profiles: { nombre: string; apellido: string; email: string };
    }>;
  };
  onViewDetails: (casoId: string) => void;
  onAssignLawyer: (casoId: string) => void;
  onGenerateResolution: (casoId: string) => void;
  onUploadDocument: (casoId: string) => void;
  onSendMessage: (casoId: string) => void;
}

const CaseCard: React.FC<CaseCardProps> = ({
  caso,
  onViewDetails,
  onAssignLawyer,
  onGenerateResolution,
  onUploadDocument,
  onSendMessage
}) => {

  const getStatusBadge = (estado: string) => {
    const statusConfig = {
      'disponible': { 
        label: 'Disponible', 
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      },
      'agotado': { 
        label: 'Agotado', 
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      },
      'cerrado': { 
        label: 'Cerrado', 
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      },
      'esperando_pago': { 
        label: 'Esperando Pago', 
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      }
    };
    
    const config = statusConfig[estado as keyof typeof statusConfig] || statusConfig.disponible;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getLeadTypeBadge = (tipo: string) => {
    const typeConfig = {
      'premium': { 
        label: 'Premium', 
        className: 'bg-muted text-muted-foreground'
      },
      'urgente': { 
        label: 'Urgente', 
        className: 'bg-muted text-muted-foreground'
      },
      'estandar': { 
        label: 'Estándar', 
        className: 'bg-muted text-muted-foreground'
      }
    };
    
    const config = typeConfig[tipo as keyof typeof typeConfig] || typeConfig.estandar;
    return <Badge variant="secondary" className={config.className}>{config.label}</Badge>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Card className="relative transition-all duration-200 hover:shadow-lg border-border">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate text-sm">
                  {caso.profiles?.nombre || caso.nombre_borrador} {caso.profiles?.apellido || caso.apellido_borrador}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {caso.profiles?.email || caso.email_borrador}
                </p>
              </div>
              <div className="flex flex-wrap gap-1 ml-2">
                {getStatusBadge(caso.estado)}
                {caso.tipo_lead && getLeadTypeBadge(caso.tipo_lead)}
              </div>
            </div>

            {/* Motivo de consulta */}
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Motivo:</p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {caso.motivo_consulta}
              </p>
            </div>

            {/* Resumen del caso */}
            {caso.resumen_caso && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Resumen:</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {caso.resumen_caso}
                </p>
              </div>
            )}

            {/* Guía para abogado */}
            {caso.guia_abogado && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Guía:</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {caso.guia_abogado}
                </p>
              </div>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>{caso.especialidades?.nombre || 'Sin especialidad'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(caso.created_at), 'dd MMM', { locale: es })}</span>
              </div>
              {caso.ciudad_borrador && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{caso.ciudad_borrador}</span>
                </div>
              )}
              {caso.tipo_perfil_borrador && (
                <div className="flex items-center gap-1">
                  <span className="capitalize">{caso.tipo_perfil_borrador}</span>
                </div>
              )}
            </div>

            {/* Documentos del cliente */}
            {caso.documentos_adjuntos && Array.isArray(caso.documentos_adjuntos) && caso.documentos_adjuntos.length > 0 && (
              <div className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-blue-700 dark:text-blue-300">
                <FileText className="h-3 w-3 inline mr-1" />
                {caso.documentos_adjuntos.length} documento(s) adjunto(s)
              </div>
            )}

            {/* Assignment status */}
            {caso.asignaciones_casos && caso.asignaciones_casos.length > 0 ? (
              <div className="text-xs bg-green-50 dark:bg-green-900/20 p-2 rounded text-green-700 dark:text-green-300">
                Asignado a: {caso.asignaciones_casos[0].profiles?.nombre}
              </div>
            ) : (
              <div className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Sin asignar
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(caso.id)}
                className="flex-1"
              >
                Ver
              </Button>
              
              {caso.estado !== 'cerrado' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAssignLawyer(caso.id)}
                    className="flex-1"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Asignar
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onGenerateResolution(caso.id)}
                    className="flex-1"
                  >
                    <Bot className="h-3 w-3 mr-1" />
                    IA
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CaseCard;