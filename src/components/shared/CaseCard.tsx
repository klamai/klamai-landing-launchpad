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
        className: 'bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700'
      },
      'asignado': {
        label: 'Asignado',
        className: 'bg-stone-100 dark:bg-stone-800/50 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700'
      },
      'agotado': {
        label: 'Agotado',
        className: 'bg-rose-100 dark:bg-rose-800/50 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-700'
      },
      'cerrado': {
        label: 'Cerrado',
        className: 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700'
      },
      'esperando_pago': {
        label: 'Esperando Pago',
        className: 'bg-amber-100 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700'
      },
      'listo_para_propuesta': {
        label: 'Listo para Propuesta',
        className: 'bg-indigo-100 dark:bg-indigo-800/50 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700'
      },
      'propuesta_enviada': {
        label: 'Propuesta Enviada',
        className: 'bg-teal-100 dark:bg-teal-800/50 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-700'
      }
    };
    
    const config = statusConfig[estado as keyof typeof statusConfig] || statusConfig.disponible;
    return (
      <Badge variant="outline" className={`text-xs font-semibold px-2 py-1 rounded-md shadow-sm ${config.className}`}>
        {estado === 'propuesta_enviada' && <Send className="h-3 w-3 mr-1 inline" />} {config.label}
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
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.03, y: -5 }}
      className="group h-full"
    >
      <Card
        className={`relative overflow-hidden transition-all duration-300 h-full flex flex-col rounded-xl bg-white dark:bg-gray-800/70 backdrop-blur-sm
          ${caso.estado === 'cerrado' ? 'opacity-75 grayscale' : ''}
          ${hideAssignmentStyling ? 'border-gray-200 dark:border-gray-700' : ''}
          ${(caso as any)?.fecha_pago ? 'border-2 border-green-300 dark:border-green-600' : ''}
          ${caso.estado === 'asignado' && !hideAssignmentStyling 
            ? 'shadow-lg dark:shadow-stone-900/20 ring-2 ring-stone-500 dark:ring-stone-600' 
            : `shadow-md dark:shadow-black/20 hover:shadow-lg dark:hover:shadow-black/30 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-blue-500 dark:hover:ring-blue-600`}
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
        <CardContent className="p-5 flex-1 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-50 truncate leading-tight">{clientData.nombre} {clientData.apellido}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{clientData.email}</p>
            </div>
            <div className="ml-1 flex items-center gap-1">
              {/* Mostrar badge de estado solo si NO está cerrado y NO está asignado, o si está asignado pero hideAssignmentStyling es true */}
              {caso.estado !== 'cerrado' && 
               (caso.estado !== 'asignado' || hideAssignmentStyling) && 
               getStatusBadge(caso.estado === 'asignado' && hideAssignmentStyling ? 'disponible' : caso.estado)}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs">
            {caso.tipo_lead && getLeadTypeBadge(caso.tipo_lead)}
            {getProfileTypeBadge(clientData.tipo_perfil)}
            {caso.canal_atencion && getOriginBadge(caso.canal_atencion)}
             <Badge variant="outline" className="px-2 py-1 rounded-md bg-gray-200/80 dark:bg-gray-700/60 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 shadow-sm">
                <Scale className="h-3 w-3 mr-1.5" />
                {caso.especialidades?.nombre || 'Sin especialidad'}
              </Badge>
              {clientData.ciudad && (
                <Badge variant="outline" className="px-2 py-1 rounded-md bg-gray-200/80 dark:bg-gray-700/60 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 shadow-sm">
                  <MapPin className="h-3 w-3 mr-1.5" />
                  {clientData.ciudad}
                </Badge>
              )}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-3">
            <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-gray-900/50 px-2 py-1 rounded-full">
              <Calendar className="h-3 w-3 text-blue-500 dark:text-blue-400" />
              <span>{format(casoDate, 'dd/MM/yy HH:mm', { locale: es })}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-gray-900/50 px-2 py-1 rounded-full">
                <span className="font-mono tracking-tight">#{caso.id.substring(0,8)}</span>
              </div>
              <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-gray-900/50 px-2 py-1 rounded-full">
                <Clock className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                <span>Hace {formatDistanceToNow(casoDate, { locale: es, addSuffix: false }).replace('hace ', '').replace('alrededor de ', '')}</span>
              </div>
              {caso.fecha_pago && (
                <div className="flex items-center gap-1 bg-green-100/80 dark:bg-green-800/40 px-2 py-1 rounded-full text-green-700 dark:text-green-200 border border-green-200 dark:border-green-700">
                  <CheckCircle className="h-3 w-3" />
                  <span>Pagado</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Notas de Asignación - Posición prominente (solo para abogados regulares) */}
          {showProminentNotes && caso.asignaciones_casos && caso.asignaciones_casos.length > 0 && 
           caso.asignaciones_casos[0].notas_asignacion && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-2.5 rounded-lg mt-3 border border-blue-200 dark:border-blue-800">
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
            <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs font-semibold text-blue-900 dark:text-blue-100 mt-2">
              {clientData.razon_social}
            </div>
          )}
          <div className="bg-gray-50/90 dark:bg-gray-900/70 p-3 rounded-lg shadow-inner mt-2">
            <p className="text-xs font-semibold text-gray-800 dark:text-white mb-1">Motivo:</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">{caso.motivo_consulta}</p>
          </div>
          <div className="flex-grow" />
          <div className="flex items-center justify-between mt-3">
            {caso.valor_estimado && (
              <div className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded-full font-semibold border border-green-200 dark:border-green-600">
                <Euro className="h-3 w-3 text-green-600 dark:text-green-300" />
                <span className="text-green-800 dark:text-green-200">{caso.valor_estimado}</span>
              </div>
            )}
            {!caso.asignaciones_casos || caso.asignaciones_casos.length === 0 ? (
              <div className="text-xs bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300 flex items-center gap-1 font-semibold">
                <Clock className="h-3 w-3 text-orange-500 dark:text-orange-400" />
                <span>Sin asignar</span>
              </div>
            ) : null}
          </div>
        </CardContent>
        <div className="p-3 pt-0">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => onViewDetails(caso.id)}
              className="flex items-center gap-2 flex-1 min-w-0 h-9 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Eye className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">Ver</span>
            </Button>
            {caso.estado !== 'cerrado' && (
              <>
                {!hideAssignButton && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onAssignLawyer(caso.id)}
                    className="flex items-center gap-2 flex-1 min-w-0 h-9 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 shadow-sm hover:shadow-md"
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
                      className="flex-1 min-w-0 h-9 text-xs font-semibold rounded-lg bg-transparent dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/70 hover:text-gray-900 dark:hover:text-white"
                    >
                      <Bot className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">IA</span>
                      <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0" />
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
              </>
            )}
          </div>
        </div>
      </Card>
      
    </motion.div>
  );
};

export default CaseCard;

