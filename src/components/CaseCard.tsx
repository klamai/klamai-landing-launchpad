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
        className: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100 text-sm font-semibold px-3 py-1.5 border-2 border-green-300'
      },
      'agotado': {
        label: 'Agotado',
        className: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100 text-sm font-semibold px-3 py-1.5 border-2 border-red-300'
      },
      'cerrado': {
        label: 'Cerrado',
        className: 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100 text-sm font-semibold px-3 py-1.5 border-2 border-gray-300'
      },
      'esperando_pago': {
        label: 'Esperando Pago',
        className: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100 text-sm font-semibold px-3 py-1.5 border-2 border-yellow-300'
      },
      'listo_para_propuesta': {
        label: 'Listo para Propuesta',
        className: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100 text-sm font-semibold px-3 py-1.5 border-2 border-blue-300'
      }
    };
    
    const config = statusConfig[estado as keyof typeof statusConfig] || statusConfig.disponible;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getLeadTypeBadge = (tipo: string) => {
    const typeConfig = {
      'premium': {
        label: 'Premium',
        className: 'bg-purple-300 text-purple-900 dark:bg-purple-800 dark:text-purple-100 text-sm font-semibold px-3 py-1.5 border-2 border-purple-400'
      },
      'urgente': {
        label: 'Urgente',
        className: 'bg-red-300 text-red-900 dark:bg-red-800 dark:text-red-100 text-sm font-semibold px-3 py-1.5 border-2 border-red-400'
      },
      'estandar': {
        label: 'Estándar',
        className: 'bg-blue-300 text-blue-900 dark:bg-blue-800 dark:text-blue-100 text-sm font-semibold px-3 py-1.5 border-2 border-blue-400'
      }
    };
    
    const config = typeConfig[tipo as keyof typeof typeConfig] || typeConfig.estandar;
    return <Badge variant="secondary" className={config.className}>{config.label}</Badge>;
  };

  const getProfileTypeBadge = (tipo: string) => {
    return (
      <Badge variant="outline" className="text-sm font-medium px-3 py-1.5 border-2">
        {tipo === 'empresa' ? (
          <>
            <Building className="h-4 w-4 mr-2" />
            Empresa
          </>
        ) : (
          <>
            <User className="h-4 w-4 mr-2" />
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
      <Card className="relative transition-all duration-200 hover:shadow-xl border-2 hover:border-blue-300 h-full flex flex-col bg-white dark:bg-gray-800">
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="space-y-3">
            {/* Header con información del cliente - COMPACTO */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white truncate text-base">
                  {clientData.nombre} {clientData.apellido}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {clientData.email}
                </p>
              </div>
              <div className="ml-2">
                {getStatusBadge(caso.estado)}
              </div>
            </div>

            {/* Badges de tipo - COMPACTOS */}
            <div className="flex flex-wrap gap-1">
              {caso.tipo_lead && getLeadTypeBadge(caso.tipo_lead)}
              {getProfileTypeBadge(clientData.tipo_perfil)}
            </div>

            {/* Fecha y tiempo relativo - COMPACTO */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(casoDate, 'dd/MM/yy', { locale: es })}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatDistanceToNow(casoDate, { locale: es, addSuffix: true })}</span>
              </div>
            </div>

            {/* Información de empresa si aplica - COMPACTA */}
            {clientData.tipo_perfil === 'empresa' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border-l-4 border-blue-400">
                {clientData.razon_social && (
                  <div className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                    {clientData.razon_social}
                  </div>
                )}
                {clientData.nif_cif && (
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    NIF/CIF: {clientData.nif_cif}
                  </div>
                )}
              </div>
            )}

            {/* Especialidad y ciudad - COMPACTAS */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="truncate font-medium">{caso.especialidades?.nombre || 'Sin especialidad'}</span>
              </div>
              {clientData.ciudad && (
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="truncate font-medium">{clientData.ciudad}</span>
                </div>
              )}
            </div>

            {/* Motivo de consulta - COMPACTO */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border-l-3 border-yellow-400">
              <p className="text-xs font-semibold text-gray-800 dark:text-white mb-1">Motivo:</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                {caso.motivo_consulta}
              </p>
            </div>

            {/* Resumen del caso - COMPACTO */}
            {caso.resumen_caso && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border-l-3 border-blue-400">
                <p className="text-xs font-semibold text-gray-800 dark:text-white mb-1">Resumen:</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                  {caso.resumen_caso}
                </p>
              </div>
            )}

            {/* Valor estimado - COMPACTO */}
            {caso.valor_estimado && (
              <div className="flex items-center gap-1 text-xs bg-green-50 dark:bg-green-900/20 p-2 rounded">
                <Euro className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-700 dark:text-green-300">
                  {caso.valor_estimado}
                </span>
              </div>
            )}

            {/* Estado de asignación - COMPACTO */}
            {caso.asignaciones_casos && caso.asignaciones_casos.length > 0 ? (
              <div className="text-xs bg-green-50 dark:bg-green-900/20 p-2 rounded text-green-700 dark:text-green-300 flex items-center gap-1">
                <UserPlus className="h-4 w-4" />
                <span className="font-medium">Asignado: {caso.asignaciones_casos[0].profiles?.nombre}</span>
              </div>
            ) : (
              <div className="text-xs bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="font-medium">Sin asignar</span>
              </div>
            )}
          </div>
        </CardContent>
        
        {/* Botones de acción - COMPACTOS */}
        <div className="p-3 pt-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(caso.id)}
              className="flex-1 h-10 text-sm font-medium border-2 hover:bg-blue-50"
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Button>
            
            {caso.estado !== 'cerrado' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAssignLawyer(caso.id)}
                  className="flex-1 h-10 text-sm font-medium border-2 hover:bg-green-50"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Asignar
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onGenerateResolution(caso.id)}
                  className="flex-1 h-10 text-sm font-medium border-2 hover:bg-purple-50"
                >
                  <Bot className="h-4 w-4 mr-1" />
                  IA
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
      
    </motion.div>
  );
};

export default CaseCard;