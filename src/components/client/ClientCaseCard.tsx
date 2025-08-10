import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  FileText, 
  MessageSquare, 
  Eye, 
  Scale, 
  User, 
  Bell, 
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Upload,
  Plus,
  CreditCard
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useClientCaseDetails } from '@/hooks/client/useClientCaseDetails';
import { useCaseUnreadNotificationsCount } from '@/hooks/client/useCaseNotifications';
import ClientDocumentUploadModal from './ClientDocumentUploadModal';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ClientCaseCardProps {
  caso: {
    id: string;
    motivo_consulta: string;
    estado: string;
    created_at: string;
    fecha_cierre?: string;
    especialidad_id: number;
    especialidades?: { nombre: string };
    nombre_borrador?: string;
    apellido_borrador?: string;
    email_borrador?: string;
    telefono_borrador?: string;
    ciudad_borrador?: string;
    tipo_perfil_borrador?: string;
    documentos_adjuntos?: any;
    hoja_encargo_token?: string;
    fecha_pago?: string | null;
  };
  onViewDetails: (casoId: string) => void;
  onSendMessage: (casoId: string) => void;
}

const ClientCaseCard: React.FC<ClientCaseCardProps> = ({
  caso,
  onViewDetails,
  onSendMessage
}) => {
  const { data: caseDetails, isLoading: loadingDetails } = useClientCaseDetails(caso.id);
  const { data: notificacionesNoLeidas = 0 } = useCaseUnreadNotificationsCount(caso.id);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { toast } = useToast();

  // Formatear fecha
  const fecha = new Date(caso.created_at);
  const formattedDate = fecha.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const timeAgo = formatDistanceToNow(fecha, { addSuffix: true, locale: es });

  const handleUploadSuccess = () => {
    // Refetch case details to update document count
    // The useClientCaseDetails hook will automatically refetch
    setIsUploadModalOpen(false);
  };

  const handlePayment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('crear-sesion-checkout', {
        body: {
          plan_id: 'consulta-estrategica',
          caso_id: caso.id
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        // Redirigir a Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (error) {
      console.error('Error al crear sesión de pago:', error);
      toast({
        title: "Error en el pago",
        description: error instanceof Error ? error.message : "Error al procesar el pago. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const shouldShowPaymentButton = (estado: string) => {
    return ['listo_para_propuesta', 'esperando_pago'].includes(estado);
  };

  const getPaymentButtonText = (estado: string) => {
    switch (estado) {
      case 'listo_para_propuesta':
        return 'Pagar Consulta';
      case 'esperando_pago':
        return 'Completar Pago';
      default:
        return 'Pagar';
    }
  };

  // Estados específicos para el cliente
  const getClientStatusBadge = (estado: string) => {
    const statusConfig = {
      'disponible': {
        label: 'En Revisión',
        className: 'bg-gradient-to-r from-blue-500/80 to-blue-600/80 text-white border-blue-400 dark:border-blue-700'
      },
      'asignado': {
        label: 'En Proceso',
        className: 'bg-gradient-to-r from-indigo-500/80 to-indigo-600/80 text-white border-indigo-400 dark:border-indigo-700'
      },
      'esperando_pago': {
        label: 'Por Pagar',
        className: 'bg-gradient-to-r from-amber-500/80 to-amber-600/80 text-white border-amber-400 dark:border-amber-700'
      },
      'cerrado': {
        label: 'Finalizado',
        className: 'bg-gradient-to-r from-gray-500/80 to-gray-600/80 text-white border-gray-400 dark:border-gray-700'
      },
      'listo_para_propuesta': {
        label: 'En Preparación',
        className: 'bg-gradient-to-r from-purple-500/80 to-purple-600/80 text-white border-purple-400 dark:border-purple-700'
      }
    };
    
    const config = statusConfig[estado as keyof typeof statusConfig] || statusConfig.disponible;
    return (
      <Badge 
        className={`${config.className} text-xs font-medium px-3 py-1 shadow-sm border`}
      >
        {config.label}
      </Badge>
    );
  };

  const getProfileTypeBadge = (tipo?: string) => {
    if (!tipo) return null;
    
    return (
      <Badge variant="outline" className="text-xs font-medium px-2.5 py-1 rounded-full border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm shadow-sm">
        {tipo === 'empresa' ? (
          <>
            <Shield className="h-3 w-3 mr-1 text-blue-600 dark:text-blue-400" />
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

  const getProgressInfo = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return {
          text: 'Tu caso está siendo revisado por nuestro equipo',
          icon: <Clock className="h-4 w-4 text-blue-500" />
        };
      case 'asignado':
        return {
          text: 'Un abogado especialista está trabajando en tu caso',
          icon: <Shield className="h-4 w-4 text-green-500" />
        };
      case 'esperando_pago':
        return {
          text: 'Pendiente de pago para continuar con el proceso',
          icon: <AlertCircle className="h-4 w-4 text-amber-500" />
        };
      case 'cerrado':
        return {
          text: 'Tu caso ha sido finalizado exitosamente',
          icon: <CheckCircle className="h-4 w-4 text-gray-500" />
        };
      case 'listo_para_propuesta':
        return {
          text: 'Estamos preparando tu propuesta legal para revisión. Completa el pago para continuar.',
          icon: <Shield className="h-4 w-4 text-purple-500" />
        };
      default:
        return {
          text: 'Tu caso está en proceso',
          icon: <FileText className="h-4 w-4 text-gray-500" />
        };
    }
  };

  const progressInfo = getProgressInfo(caso.estado);

  // Renderizar indicadores de actividad
  const renderActivityIndicators = () => {
    if (loadingDetails) return null;

    const indicators = [];

    // Notificaciones no leídas específicas del caso
    if (notificacionesNoLeidas > 0) {
      indicators.push(
        <div key="notifications" className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
          <Bell className="h-3 w-3" />
          <span>{notificacionesNoLeidas}</span>
        </div>
      );
    }

    // Documentos del cliente
    if (caseDetails?.documentosCliente.length > 0) {
      indicators.push(
        <div key="documents" className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
          <FileText className="h-3 w-3" />
          <span>{caseDetails.documentosCliente.length}</span>
        </div>
      );
    }

    // Hoja de encargo
    if (caso.hoja_encargo_token) {
      indicators.push(
        <div key="hoja-encargo" className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
          <Shield className="h-3 w-3" />
          <span>Encargo</span>
        </div>
      );
    }

    // Indicador de abogado asignado (solo si el estado es 'asignado')
    if (caso.estado === 'asignado') {
      indicators.push(
        <div key="lawyer" className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
          <User className="h-3 w-3" />
          <span>En Proceso</span>
        </div>
      );
    }

    return indicators.length > 0 ? (
      <div className="flex items-center gap-2 flex-wrap">
        {indicators}
      </div>
    ) : null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Card className="relative transition-all duration-300 hover:shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col bg-white/80 dark:bg-[#181f2a]/90 backdrop-blur-sm rounded-2xl shadow-sm dark:shadow-blue-900/10 hover:border-blue-400">
        {/* Header con estado y fecha */}
        <CardContent className="p-6 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {getClientStatusBadge(caso.estado)}
              {getProfileTypeBadge(caso.tipo_perfil_borrador)}
              {caso.fecha_pago && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Pagado
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </div>
              <div className="text-xs text-muted-foreground">
                {timeAgo}
              </div>
            </div>
          </div>

          {/* Título del caso */}
          <div className="mb-4">
            <h3 className="font-semibold text-foreground text-lg mb-2 line-clamp-2">
              {caso.motivo_consulta}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Scale className="h-4 w-4" />
              <span>{caso.especialidades?.nombre || 'Derecho'}</span>
            </div>
          </div>

          {/* Información de progreso */}
          <div className="mb-4 p-4 rounded-xl border backdrop-blur-sm bg-blue-50/70 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              {progressInfo.icon}
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Estado Actual
              </span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {progressInfo.text}
            </p>
          </div>

          {/* Información del cliente */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>
                {caso.nombre_borrador} {caso.apellido_borrador}
              </span>
            </div>
            {caso.ciudad_borrador && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>{caso.ciudad_borrador}</span>
              </div>
            )}
          </div>

          {/* Indicadores de actividad */}
          {renderActivityIndicators() && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/20 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Actividad del Caso
                </span>
              </div>
              {renderActivityIndicators()}
            </div>
          )}

          {/* Última actividad */}
          {caseDetails?.ultimaActividad && (
            <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-800/10 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="truncate">
                  {caseDetails.ultimaActividad.descripcion}
                </span>
              </div>
            </div>
          )}

          {/* Botones de acción - estilo moderno */}
          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={() => onViewDetails(caso.id)}
              variant="default"
              size="sm"
              className="flex items-center gap-2 flex-1 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm hover:shadow-md hover:shadow-blue-500/20 dark:shadow-blue-900/20 transition-all duration-300 transform hover:scale-[1.02] focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 dark:focus:ring-blue-600/40"
            >
              <Eye className="h-4 w-4" />
              Ver Detalles
            </Button>
            
            {/* Botón de pago en estados permitidos */}
              {shouldShowPaymentButton(caso.estado) && (
              <Button
                onClick={handlePayment}
                variant="default"
                size="sm"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-emerald-500/20 dark:shadow-emerald-900/20 transform hover:scale-[1.02] focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-1 dark:focus:ring-emerald-600/40"
              >
                <CreditCard className="h-4 w-4" />
                {getPaymentButtonText(caso.estado)}
              </Button>
            )}
            
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-900/20 dark:hover:text-purple-300 transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-purple-500/10 dark:shadow-purple-900/10 transform hover:scale-[1.02] focus:ring-2 focus:ring-purple-500/40 focus:ring-offset-1 dark:focus:ring-purple-600/40"
            >
              <Upload className="h-4 w-4" />
              Subir
            </Button>
          </div>
        </CardContent>
      </Card>

      <ClientDocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        casoId={caso.id}
        onUploadSuccess={handleUploadSuccess}
      />
    </motion.div>
  );
};

export default ClientCaseCard; 