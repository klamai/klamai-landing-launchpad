import React from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  UserPlus, 
  Bot, 
  Calendar, 
  Clock, 
  Scale, 
  MapPin, 
  Euro, 
  XCircle, 
  ChevronDown,
  Sparkles,
  User,
  Building,
  FileSignature,
  Target,
  Brain,
  Zap,
  StickyNote
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';

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
    canal_atencion?: string;
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
    fecha_cierre?: string;
    cerrado_por?: string;
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
    cerrado_por_profile?: {
      nombre: string;
      apellido: string;
      email: string;
    };
    asignado_por?: string;
    asignado_por_profile?: {
      nombre: string;
      apellido: string;
      email: string;
    };
    asignaciones_casos?: Array<{
      abogado_id: string;
      estado_asignacion: string;
      asignado_por?: string;
      notas_asignacion?: string;
      asignado_por_profile?: {
        nombre: string;
        apellido: string;
        email: string;
      };
      profiles: { nombre: string; apellido: string; email: string };
    }>;
  };
  onViewDetails: (casoId: string) => void;
  onAssignLawyer: (casoId: string) => void;
  onGenerateResolution: (casoId: string) => void;
  onGenerateResolutionWithAgent: (casoId: string, agent: string) => void;
  onUploadDocument: (casoId: string) => void;
  onSendMessage: (casoId: string) => void;
  hideAssignButton?: boolean;
  showProminentNotes?: boolean; // Nueva prop para controlar la visualización prominente de notas
  hideAssignmentStyling?: boolean; // Nueva prop para ocultar bordes y sellos verdes de asignación
}

const CaseCard: React.FC<CaseCardProps> = ({
  caso,
  onViewDetails,
  onAssignLawyer,
  onGenerateResolution,
  onGenerateResolutionWithAgent,
  onUploadDocument,
  onSendMessage,
  hideAssignButton = false,
  showProminentNotes = false,
  hideAssignmentStyling = false
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
        className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800 text-xs font-medium px-2 py-1 border'
      },
      'asignado': {
        label: 'Asignado',
        className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800 text-xs font-medium px-2 py-1 border'
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
        className: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white dark:from-purple-600 dark:to-purple-700 text-xs font-semibold px-2 py-1 rounded-full border-0 shadow-sm'
      },
      'urgente': {
        label: 'Urgente',
        className: 'bg-gradient-to-r from-red-500 to-red-600 text-white dark:from-red-600 dark:to-red-700 text-xs font-semibold px-2 py-1 rounded-full border-0 shadow-sm'
      },
      'estandar': {
        label: 'Estándar',
        className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white dark:from-blue-600 dark:to-blue-700 text-xs font-semibold px-2 py-1 rounded-full border-0 shadow-sm'
      }
    };
    const config = typeConfig[tipo as keyof typeof typeConfig] || typeConfig.estandar;
    return <Badge variant="secondary" className={config.className}>{config.label}</Badge>;
  };

  const getProfileTypeBadge = (tipo: string) => {
    return (
      <Badge variant="outline" className="text-xs font-medium px-2 py-1 rounded-full border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
        {tipo === 'empresa' ? (
          <>
            <Building className="h-3 w-3 mr-1 text-blue-600 dark:text-blue-400" />
            Empresa
          </>
        ) : (
          <>
            <User className="h-3 w-3 mr-1 text-green-600 dark:text-green-400" />
            Individual
          </>
        )}
      </Badge>
    );
  };

  const getOriginBadge = (canal: string) => {
    if (canal !== 'manual_admin') return null;

    return (
      <Badge variant="outline" className="text-xs font-medium px-2 py-1 rounded-full border-slate-300 text-slate-700 dark:text-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
        <FileSignature className="h-3 w-3 mr-1 text-slate-600 dark:text-slate-400" />
        Manual
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
      <Card
        className={`relative transition-all duration-200 hover:shadow-xl border border-transparent hover:border-blue-400 h-full flex flex-col bg-white dark:bg-[#181f2a] rounded-2xl shadow-sm dark:shadow-blue-900/10
          ${caso.estado === 'cerrado' ? 'opacity-60 grayscale' : ''}
          ${caso.estado === 'asignado' && !hideAssignmentStyling ? 'border-green-200 dark:border-green-700' : ''}
          ${hideAssignmentStyling ? 'border-gray-200 dark:border-gray-700' : ''}
        `}
      >
        {/* Sello visual de cerrado */}
        {caso.estado === 'cerrado' && (
          <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1 rounded-full shadow font-bold text-xs uppercase tracking-wider">
              <XCircle className="h-4 w-4 text-red-500" />
              CERRADO
            </div>
            {/* Solo mostrar información de quién cerró si cerrado_por_profile existe (super admin) */}
            {caso.cerrado_por_profile && (
              <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">
                Por: {caso.cerrado_por_profile.nombre} {caso.cerrado_por_profile.apellido}
              </div>
            )}
          </div>
        )}

        {/* Sello visual de asignado */}
        {caso.estado === 'asignado' && caso.asignaciones_casos && caso.asignaciones_casos.length > 0 && !hideAssignmentStyling && (
          <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full shadow font-bold text-xs uppercase tracking-wider ${
              hideAssignmentStyling 
                ? 'bg-blue-200 dark:bg-blue-700 text-blue-700 dark:text-blue-200' 
                : 'bg-green-200 dark:bg-green-700 text-green-700 dark:text-green-200'
            }`}>
              <UserPlus className={`h-4 w-4 ${
                hideAssignmentStyling 
                  ? 'text-blue-500' 
                  : 'text-green-500'
              }`} />
              ASIGNADO
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              hideAssignmentStyling 
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200' 
                : 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
            }`}>
              A: {caso.asignaciones_casos[0].profiles?.nombre} {caso.asignaciones_casos[0].profiles?.apellido}
            </div>
          </div>
        )}
        <CardContent className="p-5 flex-1 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate leading-tight">{clientData.nombre} {clientData.apellido}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{clientData.email}</p>
            </div>
            <div className="ml-1 flex items-center gap-1">
              {/* Mostrar badge de estado solo si NO está cerrado y NO está asignado, o si está asignado pero hideAssignmentStyling es true */}
              {caso.estado !== 'cerrado' && 
               (caso.estado !== 'asignado' || hideAssignmentStyling) && 
               getStatusBadge(caso.estado === 'asignado' && hideAssignmentStyling ? 'disponible' : caso.estado)}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {caso.tipo_lead && getLeadTypeBadge(caso.tipo_lead)}
            {getProfileTypeBadge(clientData.tipo_perfil)}
            {caso.canal_atencion && getOriginBadge(caso.canal_atencion)}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(casoDate, 'dd/MM/yy HH:mm', { locale: es })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Hace {formatDistanceToNow(casoDate, { locale: es, addSuffix: false }).replace('hace ', '').replace('alrededor de ', '')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs mt-1">
            <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300 font-semibold">
              <Scale className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <span className="truncate">{caso.especialidades?.nombre || 'Sin especialidad'}</span>
            </div>
            {clientData.ciudad && (
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <MapPin className="h-3 w-3 text-red-600 dark:text-red-400" />
                <span className="truncate font-medium">{clientData.ciudad}</span>
              </div>
            )}
          </div>
          
          {/* Notas de Asignación - Posición prominente (solo para abogados regulares) */}
          {showProminentNotes && caso.asignaciones_casos && caso.asignaciones_casos.length > 0 && 
           caso.asignaciones_casos[0].notas_asignacion && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-2.5 rounded-lg mt-2 border border-blue-200 dark:border-blue-700">
              <div className="flex items-start gap-2">
                <StickyNote className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-1">📋 Notas de Asignación</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed line-clamp-2">
                    {caso.asignaciones_casos[0].notas_asignacion}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {clientData.tipo_perfil === 'empresa' && clientData.razon_social && (
            <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded text-xs font-semibold text-blue-900 dark:text-blue-100">
              {clientData.razon_social}
            </div>
          )}
          <div className="bg-gray-50 dark:bg-gray-900/40 p-2 rounded-lg mt-1">
            <p className="text-xs font-semibold text-gray-800 dark:text-white mb-1">Motivo:</p>
            <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 leading-tight">{caso.motivo_consulta}</p>
          </div>
          <div className="flex items-center justify-between mt-1">
            {caso.valor_estimado && (
              <div className="flex items-center gap-1 text-xs bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full font-semibold border border-green-200 dark:border-green-700">
                <Euro className="h-3 w-3 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300">{caso.valor_estimado}</span>
              </div>
            )}
            {!caso.asignaciones_casos || caso.asignaciones_casos.length === 0 ? (
              <div className="text-xs bg-gray-100 dark:bg-gray-800/40 px-2 py-1 rounded-full text-gray-600 dark:text-gray-400 flex items-center gap-1 font-semibold">
                <Clock className="h-3 w-3 text-orange-500 dark:text-orange-400" />
                <span>Sin asignar</span>
              </div>
            ) : null}
          </div>
        </CardContent>
        <div className="p-3 pt-0">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(caso.id)}
              className="flex-1 min-w-0 h-9 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-700"
            >
              <Eye className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">Ver</span>
            </Button>
            {caso.estado !== 'cerrado' && (
              <>
                {!hideAssignButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAssignLawyer(caso.id)}
                    className="flex-1 min-w-0 h-9 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-700"
                  >
                    <UserPlus className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">Asignar</span>
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-0 h-9 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-700"
                    >
                      <Bot className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">IA</span>
                      <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 [&>*:hover]:bg-blue-50 [&>*:hover]:text-blue-900">
                    <DropdownMenuItem onClick={() => onGenerateResolutionWithAgent(caso.id, 'resolucion')} className="focus:bg-blue-50 focus:text-blue-900">
                      <Target className="h-4 w-4 mr-2 text-blue-600" />
                      Generar Resolución
                      <Badge className="ml-auto bg-blue-100 text-blue-800 text-xs">Básico</Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onGenerateResolutionWithAgent(caso.id, 'estrategia')} className="focus:bg-blue-50 focus:text-blue-900">
                      <Brain className="h-4 w-4 mr-2 text-purple-600" />
                      Estrategia Legal
                      <Badge className="ml-auto bg-purple-100 text-purple-800 text-xs">Premium</Badge>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onGenerateResolutionWithAgent(caso.id, 'documentos')} className="focus:bg-blue-50 focus:text-blue-900">
                      <Zap className="h-4 w-4 mr-2 text-green-600" />
                      Generar Documentos
                      <Badge className="ml-auto bg-green-100 text-green-800 text-xs">Pro</Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onGenerateResolutionWithAgent(caso.id, 'analisis')} className="focus:bg-blue-50 focus:text-blue-900">
                      <Sparkles className="h-4 w-4 mr-2 text-orange-600" />
                      Análisis Completo
                      <Badge className="ml-auto bg-orange-100 text-orange-800 text-xs">Expert</Badge>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </Card>
      
    </motion.div>
  );
};

export default CaseCard;

