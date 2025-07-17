import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin,
  Scale,
  Euro, 
  Clock, 
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
  const spainTimeZone = 'Europe/Madrid';
  const casoDate = toZonedTime(new Date(caso.created_at), spainTimeZone);

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
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800 text-xs font-medium px-2 py-1 border'
      },
      'agotado': {
        label: 'Agotado',
        className: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-800 text-xs font-medium px-2 py-1 border'
      },
      'cerrado': {
        label: 'Cerrado',
        className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700 text-xs font-medium px-2 py-1 border'
      },
      'esperando_pago': {
        label: 'Esperando Pago',
        className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800 text-xs font-medium px-2 py-1 border'
      },
      'listo_para_propuesta': {
        label: 'Listo para Propuesta',
        className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800 text-xs font-medium px-2 py-1 border'
      }
    };
    
    const config = statusConfig[estado as keyof typeof statusConfig] || statusConfig.disponible;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getLeadTypeBadge = (tipo: string) => {
    const typeConfig = {
      'premium': {
        label: 'Premium',
        className: 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white dark:from-blue-700 dark:to-indigo-700 text-xs font-medium px-2 py-1 border-0'
      },
      'urgente': {
        label: 'Urgente',
        className: 'bg-gradient-to-r from-red-600 to-orange-500 text-white dark:from-red-700 dark:to-orange-700 text-xs font-medium px-2 py-1 border-0'
      },
      'estandar': {
        label: 'Estándar',
        className: 'bg-gradient-to-r from-sky-600 to-teal-500 text-white dark:from-sky-600 dark:to-teal-600 text-xs font-medium px-2 py-1 border-0'
      }
    };
    const config = typeConfig[tipo as keyof typeof typeConfig] || typeConfig.estandar;
    return <Badge variant="secondary" className={config.className}>{config.label}</Badge>;
  };

  const getProfileTypeBadge = (tipo: string) => {
    return (
      <Badge variant="outline" className="text-xs font-medium px-2 py-1">
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
      <Card className="relative transition-all duration-200 hover:shadow-lg border hover:border-blue-300 h-full flex flex-col bg-white dark:bg-gray-800">
        <CardContent className="p-3 flex-1 flex flex-col">
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                  {clientData.nombre} {clientData.apellido}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {clientData.email}
                </p>
              </div>
              <div className="ml-1">
                {getStatusBadge(caso.estado)}
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {caso.tipo_lead && getLeadTypeBadge(caso.tipo_lead)}
              {getProfileTypeBadge(clientData.tipo_perfil)}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(casoDate, 'dd/MM', { locale: es })}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(casoDate, { locale: es, addSuffix: true }).replace('hace ', '').replace('alrededor de ', '')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-1 text-xs">
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Scale className="h-3 w-3 text-blue-600" />
                <span className="truncate font-medium">{caso.especialidades?.nombre || 'Sin especialidad'}</span>
              </div>
              {clientData.ciudad && (
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <MapPin className="h-3 w-3 text-red-600" />
                  <span className="truncate font-medium">{clientData.ciudad}</span>
                </div>
              )}
            </div>

            {clientData.tipo_perfil === 'empresa' && clientData.razon_social && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-1 rounded text-xs">
                <div className="font-medium text-blue-900 dark:text-blue-100 truncate">
                  {clientData.razon_social}
                </div>
              </div>
            )}

            <div className=" p-2 rounded">
              <p className="text-xs font-medium text-gray-800 dark:text-white mb-1">Motivo:</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 leading-tight">
                {caso.motivo_consulta}
              </p>
            </div>

            {caso.valor_estimado && (
              <div className="flex items-center gap-1 text-xs bg-green-50 dark:bg-green-900/20 p-1 rounded">
                <span className="font-medium truncate">Valor Estimado:</span>
                <Euro className="h-3 w-3 text-green-600" />
                <span className="font-medium text-green-700 dark:text-green-300 truncate">
                  {caso.valor_estimado}
                </span>
              </div>
            )}

            {caso.asignaciones_casos && caso.asignaciones_casos.length > 0 ? (
              <div className="text-xs  dark:bg-green-900/20 p-1 rounded text-blue-700 dark:text-green-300 flex items-center gap-1">
                <UserPlus className="h-3 w-3" />
                <span className="font-medium truncate">Asignado a: {caso.asignaciones_casos[0].profiles?.nombre} {caso.asignaciones_casos[0].profiles?.apellido}</span>
              </div>
            ) : (
              <div className="text-xs bg-gray-50 dark:bg-gray-700 p-1 rounded text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3 text-orange-500" />
                <span className="font-medium">Sin asignar</span>
              </div>
            )}
          </div>
        </CardContent>
        
        <div className="p-2 pt-0">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(caso.id)}
              className="flex-1 h-8 text-xs font-medium hover:bg-blue-50"
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
                  className="flex-1 h-8 text-xs font-medium hover:bg-green-50"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Asignar
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onGenerateResolution(caso.id)}
                  className="flex-1 h-8 text-xs font-medium hover:bg-purple-50"
                >
                  <Bot className="h-3 w-3 mr-1" />
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
