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
  StickyNote,
  CheckCircle,
  Globe
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
    fecha_pago?: string | null;
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
        className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white dark:from-blue-600 dark:to-blue-700 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm'
      },
      'asignado': {
        label: 'Asignado',
        className: 'bg-gradient-to-r from-stone-500 to-stone-600 text-white dark:from-stone-800 dark:to-stone-900 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm'
      },
      'agotado': {
        label: 'Agotado',
        className: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white dark:from-rose-600 dark:to-rose-700 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm'
      },
      'cerrado': {
        label: 'Cerrado',
        className: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white dark:from-gray-600 dark:to-gray-700 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm'
      },
      'esperando_pago': {
        label: 'Esperando Pago',
        className: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white dark:from-amber-600 dark:to-amber-700 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm'
      },
      'listo_para_propuesta': {
        label: 'Listo para Propuesta',
        className: 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white dark:from-indigo-600 dark:to-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm'
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
      <Badge variant="outline" className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 shadow-sm backdrop-blur-sm">
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
    if (canal === 'manual_admin') {
      return (
        <Badge variant="outline" className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-sm backdrop-blur-sm">
          <FileSignature className="h-3 w-3 mr-1 text-slate-600 dark:text-slate-400" />
          Manual
        </Badge>
      );
    }
    if (canal === 'web') {
      return (
        <Badge variant="outline" className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-sm backdrop-blur-sm">
          <Globe className="h-3 w-3 mr-1 text-blue-600 dark:text-blue-400" />
          Web
        </Badge>
      );
    }
    return null;
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Card
        className={`relative overflow-hidden transition-all duration-300 h-full flex flex-col rounded-xl bg-white dark:bg-gray-900/70 backdrop-blur-sm
          ${caso.estado === 'cerrado' ? 'opacity-75 grayscale' : ''}
          ${hideAssignmentStyling ? 'border-gray-200 dark:border-gray-800' : ''}
          ${caso.estado === 'asignado' && !hideAssignmentStyling 
            ? 'shadow-md dark:shadow-stone-900/10 before:absolute before:inset-0 before:rounded-xl before:p-[1.5px] before:bg-gradient-to-r before:from-stone-300 before:via-stone-400 before:to-stone-300 dark:before:from-stone-800/60 dark:before:via-stone-700/60 dark:before:to-stone-800/60 before:opacity-70 before:-z-10' 
            : 'shadow-md dark:shadow-blue-900/10 hover:shadow-lg dark:hover:shadow-blue-800/20 before:absolute before:inset-0 before:rounded-xl before:p-[1.5px] before:bg-gradient-to-r before:from-blue-200/0 before:via-blue-300/50 before:to-blue-200/0 dark:before:from-blue-800/0 dark:before:via-blue-700/30 dark:before:to-blue-800/0 before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-300 before:-z-10'}
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
                : 'bg-stone-300 dark:bg-stone-800 text-stone-800 dark:text-stone-100'
            }`}>
              <UserPlus className={`h-4 w-4 ${
                hideAssignmentStyling 
                  ? 'text-blue-500' 
                  : 'text-stone-600'
              }`} />
              ASIGNADO
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              hideAssignmentStyling 
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200' 
                : 'bg-stone-200 dark:bg-stone-900/70 text-stone-900 dark:text-stone-100'
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
            <div className="flex items-center gap-1 bg-gray-50/80 dark:bg-gray-800/50 px-2 py-1 rounded-full backdrop-blur-sm">
              <Calendar className="h-3 w-3 text-blue-500 dark:text-blue-400" />
              <span>{format(casoDate, 'dd/MM/yy HH:mm', { locale: es })}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-50/80 dark:bg-gray-800/50 px-2 py-1 rounded-full backdrop-blur-sm">
                <Clock className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                <span>Hace {formatDistanceToNow(casoDate, { locale: es, addSuffix: false }).replace('hace ', '').replace('alrededor de ', '')}</span>
              </div>
              {caso.fecha_pago && (
                <div className="flex items-center gap-1 bg-green-50/80 dark:bg-green-900/40 px-2 py-1 rounded-full backdrop-blur-sm text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-3 w-3" />
                  <span>Pagado</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs mt-1">
            <div className="flex items-center gap-1 bg-blue-50/80 dark:bg-blue-900/30 px-2.5 py-1.5 rounded-full text-blue-700 dark:text-blue-300 font-semibold shadow-sm backdrop-blur-sm">
              <Scale className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <span className="truncate">{caso.especialidades?.nombre || 'Sin especialidad'}</span>
            </div>
            {clientData.ciudad && (
              <div className="flex items-center gap-1 bg-red-50/80 dark:bg-red-900/30 px-2.5 py-1.5 rounded-full text-red-700 dark:text-red-300 font-semibold shadow-sm backdrop-blur-sm">
                <MapPin className="h-3 w-3 text-red-600 dark:text-red-400" />
                <span className="truncate">{clientData.ciudad}</span>
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
          <div className="bg-gradient-to-r from-gray-50/90 to-gray-100/90 dark:from-gray-900/70 dark:to-gray-800/70 p-3 rounded-lg shadow-sm backdrop-blur-sm mt-1">
            <p className="text-xs font-semibold text-gray-800 dark:text-white mb-1">Motivo:</p>
            <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">{caso.motivo_consulta}</p>
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
              className="flex-1 min-w-0 h-9 text-xs font-semibold bg-white hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:text-blue-800 dark:hover:text-blue-200 transition-colors duration-200"
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
                    className="flex-1 min-w-0 h-9 text-xs font-semibold bg-white hover:bg-emerald-50 dark:bg-gray-800 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors duration-200"
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
                      className="flex-1 min-w-0 h-9 text-xs font-semibold bg-white hover:bg-purple-50 dark:bg-gray-800 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:text-purple-800 dark:hover:text-purple-200 transition-colors duration-200"
                    >
                      <Bot className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">IA</span>
                      <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200 dark:border-gray-800 shadow-lg rounded-lg">
                    <DropdownMenuItem onClick={() => onGenerateResolutionWithAgent(caso.id, 'resolucion')} className="flex items-center px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 focus:bg-blue-50 dark:focus:bg-blue-900/30 focus:text-blue-700 dark:focus:text-blue-300 cursor-pointer">
                      <Target className="h-4 w-4 mr-2 text-blue-600" />
                      Generar Resolución
                      <Badge className="ml-auto bg-blue-100 text-blue-800 text-xs">Básico</Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onGenerateResolutionWithAgent(caso.id, 'estrategia')} className="flex items-center px-3 py-2 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/30 text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 focus:bg-purple-50 dark:focus:bg-purple-900/30 focus:text-purple-700 dark:focus:text-purple-300 cursor-pointer">
                      <Brain className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />
                      Estrategia Legal
                      <Badge className="ml-auto bg-purple-100 text-purple-800 text-xs">Premium</Badge>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1 border-gray-200 dark:border-gray-700" />
                    <DropdownMenuItem onClick={() => onGenerateResolutionWithAgent(caso.id, 'documentos')} className="flex items-center px-3 py-2 text-sm hover:bg-green-50 dark:hover:bg-green-900/30 text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-300 focus:bg-green-50 dark:focus:bg-green-900/30 focus:text-green-700 dark:focus:text-green-300 cursor-pointer">
                      <Zap className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                      Generar Documentos
                      <Badge className="ml-auto bg-green-100 text-green-800 text-xs">Pro</Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onGenerateResolutionWithAgent(caso.id, 'analisis')} className="flex items-center px-3 py-2 text-sm hover:bg-orange-50 dark:hover:bg-orange-900/30 text-gray-700 dark:text-gray-300 hover:text-orange-700 dark:hover:text-orange-300 focus:bg-orange-50 dark:focus:bg-orange-900/30 focus:text-orange-700 dark:focus:text-orange-300 cursor-pointer">
                      <Sparkles className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
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

