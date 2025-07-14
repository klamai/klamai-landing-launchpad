import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Euro, 
  Clock, 
  AlertTriangle,
  FileText,
  ChevronRight,
  UserPlus,
  Bot,
  Upload,
  MessageSquare,
  Eye
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CaseCardProps {
  caso: {
    id: string;
    motivo_consulta: string;
    especialidad_id: number;
    estado: string;
    created_at: string;
    cliente_id: string;
    valor_estimado?: string;
    tipo_lead?: string;
    ciudad_borrador?: string;
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
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusBadge = (estado: string) => {
    const statusConfig = {
      'disponible': { 
        label: 'Disponible', 
        variant: 'default' as const, 
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200'
      },
      'agotado': { 
        label: 'Agotado', 
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200'
      },
      'cerrado': { 
        label: 'Cerrado', 
        variant: 'secondary' as const,
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200'
      },
      'esperando_pago': { 
        label: 'Esperando Pago', 
        variant: 'outline' as const,
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200'
      }
    };
    
    const config = statusConfig[estado as keyof typeof statusConfig] || statusConfig.disponible;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const getLeadTypeBadge = (tipo: string) => {
    const typeConfig = {
      'premium': { 
        label: 'Premium', 
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200'
      },
      'urgente': { 
        label: 'Urgente', 
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200'
      },
      'estandar': { 
        label: 'Estándar', 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200'
      }
    };
    
    const config = typeConfig[tipo as keyof typeof typeConfig] || typeConfig.estandar;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const isHotCase = () => {
    const caseDate = new Date(caso.created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - caseDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24 || caso.tipo_lead === 'urgente' || caso.tipo_lead === 'premium';
  };

  const getClientInitials = () => {
    if (caso.profiles?.nombre && caso.profiles?.apellido) {
      return `${caso.profiles.nombre.charAt(0)}${caso.profiles.apellido.charAt(0)}`.toUpperCase();
    }
    return 'CL';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Card className={`relative transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 border ${
        isHotCase() ? 'border-orange-200 bg-orange-50/30 dark:border-orange-800 dark:bg-orange-900/10' : 'border-border'
      }`}>
        {/* Hot case indicator */}
        {isHotCase() && (
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full animate-pulse">
            <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping"></div>
          </div>
        )}

        <CardContent className="p-4">
          {/* Header with client info */}
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="h-10 w-10 bg-gradient-to-br from-primary to-secondary">
              <AvatarFallback className="text-white font-medium text-sm">
                {getClientInitials()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">
                  {caso.profiles?.nombre} {caso.profiles?.apellido}
                </h3>
                {isHotCase() && (
                  <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <Mail className="h-3 w-3" />
                <span className="truncate">{caso.profiles?.email}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {getStatusBadge(caso.estado)}
                {caso.tipo_lead && getLeadTypeBadge(caso.tipo_lead)}
              </div>
            </div>
          </div>

          {/* Case details */}
          <div className="space-y-3 mb-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Motivo de consulta:</p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {caso.motivo_consulta}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{caso.especialidades?.nombre || 'Sin especialidad'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>{format(new Date(caso.created_at), 'dd MMM yy', { locale: es })}</span>
              </div>
              {caso.ciudad_borrador && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span>{caso.ciudad_borrador}</span>
                </div>
              )}
              {caso.valor_estimado && (
                <div className="flex items-center gap-1.5">
                  <Euro className="h-3 w-3 text-muted-foreground" />
                  <span>{caso.valor_estimado}</span>
                </div>
              )}
            </div>

            {/* Assignment info */}
            {caso.asignaciones_casos && caso.asignaciones_casos.length > 0 ? (
              <div className="flex items-center gap-1.5 text-xs bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
                <User className="h-3 w-3 text-green-600" />
                <span className="text-green-700 dark:text-green-300 font-medium">
                  Asignado a: {caso.asignaciones_casos[0].profiles?.nombre} {caso.asignaciones_casos[0].profiles?.apellido}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                <Clock className="h-3 w-3 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Sin asignar</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(caso.id)}
              className="flex-1 min-w-0"
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver más
            </Button>
            
            {caso.estado !== 'cerrado' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAssignLawyer(caso.id)}
                  className="flex-1 min-w-0"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Asignar
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onGenerateResolution(caso.id)}
                  className="flex-1 min-w-0"
                >
                  <Bot className="h-3 w-3 mr-1" />
                  IA
                </Button>
              </>
            )}
          </div>

          {/* Expandable actions */}
          {caso.estado !== 'cerrado' && (
            <motion.div
              initial={false}
              animate={{ height: isExpanded ? 'auto' : 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-border mt-3 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUploadDocument(caso.id)}
                  className="flex-1"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Subir doc
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSendMessage(caso.id)}
                  className="flex-1"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Mensaje
                </Button>
              </div>
            </motion.div>
          )}

          {caso.estado !== 'cerrado' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-2 text-xs"
            >
              <ChevronRight 
                className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              />
              {isExpanded ? 'Menos opciones' : 'Más opciones'}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CaseCard;