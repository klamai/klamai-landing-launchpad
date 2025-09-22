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
  Globe,
  Send,
  Mail
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
    cliente_id?: string;
    motivo_consulta: string;
    resumen_caso?: string;
    guia_abogado?: string;
    especialidad_id: number;
    estado: string;
    created_at: string;
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
  onOpenSendProposal?: (casoId: string) => void;
  hideAssignButton?: boolean;
  showProminentNotes?: boolean; // Nueva prop para controlar la visualización prominente de notas
  hideAssignmentStyling?: boolean; // Nueva prop para ocultar bordes y sellos verdes de asignación
  forceAvailableHighlight?: boolean; // Forzar highlight estático (uso: abogado regular)
}

const CaseCard: React.FC<CaseCardProps> = ({
  caso,
  onViewDetails,
  onAssignLawyer,
  onGenerateResolution,
  onGenerateResolutionWithAgent,
  onUploadDocument,
  onSendMessage,
  onOpenSendProposal,
  hideAssignButton = false,
  showProminentNotes = false,
  hideAssignmentStyling = false,
  forceAvailableHighlight = false
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
        className: 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 shadow-blue-100/50 dark:shadow-blue-900/20'
      },
      'asignado': {
        label: 'Asignado',
        className: 'bg-gradient-to-r from-stone-50 to-stone-100 dark:from-stone-900/30 dark:to-stone-800/40 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 shadow-stone-100/50 dark:shadow-stone-900/20'
      },
      'agotado': {
        label: 'Agotado',
        className: 'bg-gradient-to-r from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700 shadow-rose-100/50 dark:shadow-rose-900/20'
      },
      'cerrado': {
        label: 'Cerrado',
        className: 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/40 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 shadow-gray-100/50 dark:shadow-gray-900/20'
      },
      'esperando_pago': {
        label: 'Esperando Pago',
        className: 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 shadow-amber-100/50 dark:shadow-amber-900/20'
      },
      'listo_para_propuesta': {
        label: 'Listo para Propuesta',
        className: 'bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700 shadow-indigo-100/50 dark:shadow-indigo-900/20'
      },
      'propuesta_enviada': {
        label: 'Propuesta Enviada',
        className: 'bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700 shadow-teal-100/50 dark:shadow-teal-900/20'
      }
    };

    const config = statusConfig[estado as keyof typeof statusConfig] || statusConfig.disponible;
    return (
      <Badge variant="outline" className={`text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm border backdrop-blur-sm ${config.className}`}>
        {estado === 'propuesta_enviada' && <Send className="h-3 w-3 mr-1.5 inline" />} {config.label}
      </Badge>
    );
  };

  const getLeadTypeBadge = (tipo: string) => {
    // ESTILO UNIFICADO: Gris neutro para consistencia
    return (
      <Badge variant="outline" className="text-xs font-medium px-2 py-1 rounded-md bg-gray-200/80 dark:bg-gray-700/60 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 shadow-sm">
        {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
      </Badge>
    );
  };
  
  const getProfileTypeBadge = (tipo: string) => {
    // ESTILO UNIFICADO: Gris neutro para consistencia
    const isEmpresa = tipo === 'empresa';
    return (
      <Badge variant="outline" className="text-xs font-medium px-2 py-1 rounded-md bg-gray-200/80 dark:bg-gray-700/60 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 shadow-sm">
        {isEmpresa ? (
          <>
            <Building className="h-3 w-3 mr-1.5" />
            Empresa
          </>
        ) : (
          <>
            <User className="h-3 w-3 mr-1.5" />
            Individual
          </>
        )}
      </Badge>
    );
  };
  
  const getOriginBadge = (canal: string) => {
    // ESTILO UNIFICADO: Gris neutro para consistencia
    const isManual = canal === 'manual_admin';
    return (
      <Badge variant="outline" className="text-xs font-medium px-2 py-1 rounded-md bg-gray-200/80 dark:bg-gray-700/60 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 shadow-sm">
        {isManual ? (
          <>
            <FileSignature className="h-3 w-3 mr-1.5" />
            Manual
          </>
        ) : (
          <>
            <Globe className="h-3 w-3 mr-1.5" />
            Web
          </>
        )}
      </Badge>
    );
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -3 }}
      className="group h-full"
    >
      <Card
        className={`relative overflow-hidden transition-all duration-300 h-full flex flex-col rounded-2xl bg-white/95 dark:bg-gray-800/90 backdrop-blur-sm border-0
          ${caso.estado === 'cerrado' ? 'opacity-80 grayscale' : ''}
          ${hideAssignmentStyling ? 'shadow-sm' : ''}
          ${(caso as any)?.fecha_pago ? 'ring-2 ring-green-400/50 shadow-green-100 dark:shadow-green-900/20' : ''}
          ${caso.estado === 'asignado' && !hideAssignmentStyling
            ? 'shadow-xl shadow-stone-200/50 dark:shadow-stone-900/30 ring-2 ring-stone-400/30'
            : `shadow-lg shadow-gray-200/60 dark:shadow-black/30 hover:shadow-xl hover:shadow-blue-100/40 dark:hover:shadow-blue-900/20 ring-2 ring-gray-300/80 dark:ring-gray-700/60 hover:ring-blue-400/40 dark:hover:ring-blue-600/40`}
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
                ? 'bg-blue-200 dark:bg-blue-800/50 text-blue-800 dark:text-blue-100' 
                : 'bg-stone-300 dark:bg-stone-800 text-stone-800 dark:text-stone-100'
            }`}>
              <UserPlus className={`h-4 w-4 ${
                hideAssignmentStyling 
                  ? 'text-blue-500' 
                  : 'text-stone-600 dark:text-stone-300'
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
        <CardContent className="p-4 sm:p-5 flex-1 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white truncate leading-tight mb-1">{clientData.nombre} {clientData.apellido}</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate font-medium">{clientData.email}</p>
            </div>
            <div className="flex-shrink-0">
              {/* Mostrar badge de estado solo si NO está cerrado y NO está asignado, o si está asignado pero hideAssignmentStyling es true */}
              {caso.estado !== 'cerrado' &&
               (caso.estado !== 'asignado' || hideAssignmentStyling) &&
               getStatusBadge(caso.estado === 'asignado' && hideAssignmentStyling ? 'disponible' : caso.estado)}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
            {caso.tipo_lead && getLeadTypeBadge(caso.tipo_lead)}
            {getProfileTypeBadge(clientData.tipo_perfil)}
            {caso.canal_atencion && getOriginBadge(caso.canal_atencion)}
            <Badge variant="outline" className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/60 dark:to-gray-700/70 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 shadow-sm font-medium text-xs">
              <Scale className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">{caso.especialidades?.nombre || 'Sin especialidad'}</span>
              <span className="sm:hidden">{(caso.especialidades?.nombre || 'Sin especialidad').substring(0, 8)}...</span>
            </Badge>
            {clientData.ciudad && (
              <Badge variant="outline" className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/60 dark:to-gray-700/70 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 shadow-sm font-medium text-xs">
                <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">{clientData.ciudad}</span>
                <span className="sm:hidden">{clientData.ciudad.substring(0, 6)}...</span>
              </Badge>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs mt-3 p-2 sm:p-3 bg-gray-50/60 dark:bg-gray-800/40 rounded-lg sm:rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1 sm:gap-1.5 bg-white/80 dark:bg-gray-700/60 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-600">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">{format(casoDate, 'dd/MM/yy', { locale: es })}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 bg-white/80 dark:bg-gray-700/60 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-600">
                <span className="font-mono font-semibold text-gray-700 dark:text-gray-300 text-xs">#{caso.id.substring(0,6)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1 sm:gap-1.5 bg-amber-50 dark:bg-amber-900/30 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-amber-200 dark:border-amber-700">
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600 dark:text-amber-400" />
                <span className="font-medium text-amber-700 dark:text-amber-300 text-xs">
                  {formatDistanceToNow(casoDate, { locale: es, addSuffix: false }).replace('hace ', '').replace('alrededor de ', '')}
                </span>
              </div>
              {caso.fecha_pago && (
                <div className="flex items-center gap-1 sm:gap-1.5 bg-green-50 dark:bg-green-900/30 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-green-200 dark:border-green-700">
                  <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-green-700 dark:text-green-300 text-xs">Pagado</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Notas de Asignación - Posición prominente (solo para abogados regulares) */}
          {showProminentNotes && caso.asignaciones_casos && caso.asignaciones_casos.length > 0 &&
           caso.asignaciones_casos[0].notas_asignacion && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-2 rounded-lg mt-2 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <StickyNote className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
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
            <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs font-semibold text-blue-900 dark:text-blue-100 mt-2">
              {clientData.razon_social}
            </div>
          )}
          <div className="bg-gradient-to-r from-gray-50/90 to-gray-100/60 dark:from-gray-800/70 dark:to-gray-700/50 p-3 rounded-lg sm:rounded-xl shadow-inner mt-2 border border-gray-200/50 dark:border-gray-600/50">
            <p className="text-xs font-bold text-gray-800 dark:text-white mb-1 uppercase tracking-wide">Motivo de Consulta</p>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 line-clamp-2 sm:line-clamp-3 leading-relaxed font-medium">{caso.motivo_consulta}</p>
          </div>
          <div className="flex-grow" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3">
            {caso.valor_estimado && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-800/50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full font-bold border border-green-200 dark:border-green-600 shadow-sm">
                <Euro className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-300" />
                <span className="text-green-800 dark:text-green-200">{caso.valor_estimado}</span>
              </div>
            )}
            {!caso.asignaciones_casos || caso.asignaciones_casos.length === 0 ? (
              <div className="text-xs sm:text-sm bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/40 dark:to-orange-800/50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-orange-700 dark:text-orange-300 flex items-center gap-1.5 sm:gap-2 font-semibold border border-orange-200 dark:border-orange-600 shadow-sm">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Sin asignar</span>
              </div>
            ) : null}
          </div>
        </CardContent>
        <div className="p-3 sm:p-4 pt-0">
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="flex gap-1.5 sm:gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => onViewDetails(caso.id)}
                className="flex items-center justify-center gap-1.5 sm:gap-2 flex-1 h-9 sm:h-10 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/30 dark:shadow-blue-900/30 transition-all duration-300 transform hover:scale-[1.02] focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 dark:focus:ring-blue-600/50"
              >
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Ver Detalles</span>
                <span className="xs:hidden">Ver</span>
              </Button>
              {caso.estado !== 'cerrado' && !hideAssignButton && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onAssignLawyer(caso.id)}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 flex-1 h-9 sm:h-10 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl hover:shadow-emerald-500/30 dark:shadow-emerald-900/30 transition-all duration-300 transform hover:scale-[1.02] focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 dark:focus:ring-emerald-600/50"
                >
                  <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Asignar</span>
                </Button>
              )}
            </div>
            {caso.estado !== 'cerrado' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-center gap-1.5 sm:gap-2 w-full h-9 sm:h-10 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/80 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] focus:ring-2 focus:ring-gray-400/50 focus:ring-offset-2 dark:focus:ring-gray-500/50"
                  >
                    <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>IA</span>
                    <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200 dark:border-gray-800 shadow-lg rounded-lg">
                  {caso.estado === 'listo_para_propuesta' && (
                    <DropdownMenuItem
                      onClick={() => {
                        if (onOpenSendProposal) onOpenSendProposal(caso.id);
                        else onViewDetails(caso.id);
                      }}
                      className="flex items-center px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 focus:bg-blue-50 dark:focus:bg-blue-900/30 focus:text-blue-700 dark:focus:text-blue-300 cursor-pointer"
                    >
                      <Mail className="h-4 w-4 mr-2 text-indigo-600" />
                      Enviar propuesta
                    </DropdownMenuItem>
                  )}
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
            )}
          </div>
        </div>
      </Card>
      
    </motion.div>
  );
};

export default CaseCard;

