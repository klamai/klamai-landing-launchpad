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
  Eye,
  Building,
  User
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

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
    razon_social_borrador?: string;
    nif_cif_borrador?: string;
    nombre_gerente_borrador?: string;
    direccion_fiscal_borrador?: string;
    preferencia_horaria_contacto?: string;
    documentos_adjuntos?: any;
    especialidades?: { nombre: string };
    profiles?: { 
      nombre: string; 
      apellido: string; 
      email: string;
      telefono?: string;
      ciudad?: string;
      tipo_perfil?: string;
      razon_social?: string;
      nif_cif?: string;
      nombre_gerente?: string;
      direccion_fiscal?: string;
    };
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
  // Convertir a zona horaria de España
  const spainTimeZone = 'Europe/Madrid';
  const casoDate = toZonedTime(new Date(caso.created_at), spainTimeZone);

  // Obtener datos del cliente combinando profiles y borrador
  const clientData = {
    nombre: caso.profiles?.nombre || caso.nombre_borrador || '',
    apellido: caso.profiles?.apellido || caso.apellido_borrador || '',
    email: caso.profiles?.email || caso.email_borrador || '',
    telefono: caso.profiles?.telefono || caso.telefono_borrador || '',
    ciudad: caso.profiles?.ciudad || caso.ciudad_borrador || '',
    tipo_perfil: caso.profiles?.tipo_perfil || caso.tipo_perfil_borrador || 'individual',
    razon_social: caso.profiles?.razon_social || caso.razon_social_borrador || '',
    nif_cif: caso.profiles?.nif_cif || caso.nif_cif_borrador || '',
    nombre_gerente: caso.profiles?.nombre_gerente || caso.nombre_gerente_borrador || '',
    direccion_fiscal: caso.profiles?.direccion_fiscal || caso.direccion_fiscal_borrador || ''
  };

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
      },
      'listo_para_propuesta': { 
        label: 'Listo para Propuesta', 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      }
    };
    
    const config = statusConfig[estado as keyof typeof statusConfig] || statusConfig.disponible;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getLeadTypeBadge = (tipo: string) => {
    const typeConfig = {
      'premium': { 
        label: 'Premium', 
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      },
      'urgente': { 
        label: 'Urgente', 
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      },
      'estandar': { 
        label: 'Estándar', 
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      }
    };
    
    const config = typeConfig[tipo as keyof typeof typeConfig] || typeConfig.estandar;
    return <Badge variant="secondary" className={config.className}>{config.label}</Badge>;
  };

  const getProfileTypeBadge = (tipo: string) => {
    return (
      <Badge variant="outline" className="text-xs">
        {tipo === 'empresa' ? (
          <>
            <Building className="h-3 w-3 mr-1" />
            Empresa
          </>
        ) : (
          <>
            <User className="h-3 w-3 mr-1" />
            Individual
          </>
        )}
      </Badge>
    );
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
            {/* Header con información del cliente */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate text-sm">
                  {clientData.nombre} {clientData.apellido}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {clientData.email}
                </p>
              </div>
              <div className="flex flex-wrap gap-1 ml-2">
                {getStatusBadge(caso.estado)}
              </div>
            </div>

            {/* Badges de tipo */}
            <div className="flex flex-wrap gap-1">
              {caso.tipo_lead && getLeadTypeBadge(caso.tipo_lead)}
              {getProfileTypeBadge(clientData.tipo_perfil)}
            </div>

            {/* Fecha y tiempo relativo */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(casoDate, 'dd/MM/yyyy HH:mm', { locale: es })}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(casoDate, { locale: es, addSuffix: true })}</span>
              </div>
            </div>

            {/* Información de empresa si aplica */}
            {clientData.tipo_perfil === 'empresa' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-xs">
                {clientData.razon_social && (
                  <div className="font-medium text-blue-900 dark:text-blue-100">
                    {clientData.razon_social}
                  </div>
                )}
                <div className="text-blue-700 dark:text-blue-300 space-y-1">
                  {clientData.nif_cif && <div>NIF/CIF: {clientData.nif_cif}</div>}
                  {clientData.nombre_gerente && <div>Gerente: {clientData.nombre_gerente}</div>}
                </div>
              </div>
            )}

            {/* Especialidad y ciudad */}
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span className="truncate">{caso.especialidades?.nombre || 'Sin especialidad'}</span>
              </div>
              {clientData.ciudad && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{clientData.ciudad}</span>
                </div>
              )}
            </div>

            {/* Motivo de consulta */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Motivo:</p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {caso.motivo_consulta}
              </p>
            </div>

            {/* Resumen del caso truncado */}
            {caso.resumen_caso && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Resumen:</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {caso.resumen_caso}
                </p>
              </div>
            )}

            {/* Valor estimado */}
            {caso.valor_estimado && (
              <div className="flex items-center gap-1 text-xs">
                <Euro className="h-3 w-3 text-green-600" />
                <span className="font-medium text-green-700 dark:text-green-400">
                  Valor estimado: {caso.valor_estimado}
                </span>
              </div>
            )}

            {/* Documentos del cliente */}
            {caso.documentos_adjuntos && Array.isArray(caso.documentos_adjuntos) && caso.documentos_adjuntos.length > 0 && (
              <div className="text-xs bg-amber-50 dark:bg-amber-900/20 p-2 rounded text-amber-700 dark:text-amber-300">
                <FileText className="h-3 w-3 inline mr-1" />
                <span className="cursor-pointer hover:underline">
                  {caso.documentos_adjuntos.length} documento(s) del cliente - Click para ver
                </span>
              </div>
            )}

            {/* Estado de asignación */}
            {caso.asignaciones_casos && caso.asignaciones_casos.length > 0 ? (
              <div className="text-xs bg-green-50 dark:bg-green-900/20 p-2 rounded text-green-700 dark:text-green-300">
                <UserPlus className="h-3 w-3 inline mr-1" />
                Asignado a: {caso.asignaciones_casos[0].profiles?.nombre}
              </div>
            ) : (
              <div className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Sin asignar
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(caso.id)}
                className="flex-1"
              >
                <Eye className="h-3 w-3 mr-1" />
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