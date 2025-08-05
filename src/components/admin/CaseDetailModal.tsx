import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  FileText, 
  Euro,
  Clock,
  MessageSquare,
  Upload,
  Download,
  Bot,
  Eye,
  Building,
  Trash2,
  AlertCircle,
  ShieldCheck,
  Users,
  CreditCard,
  Send,
  Plus,
  Shield,
  UserPlus,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { useDocumentManagement } from '@/hooks/shared/useDocumentManagement';
import { useClientDocumentManagement } from '@/hooks/client/useClientDocumentManagement';
import { useCloseCase, useUpdateCase, useAdminCases } from '@/hooks/queries/useAdminCases';
import DocumentViewer from '@/components/shared/DocumentViewer';
import DocumentUploadModal from '@/components/shared/DocumentUploadModal';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ClientDocumentUploadModal from '@/components/client/ClientDocumentUploadModal';
import CaseEditModal from '@/components/shared/CaseEditModal';
import CaseNotesSection from '@/components/shared/CaseNotesSection';
import CaseAssignmentModal from '@/components/admin/CaseAssignmentModal';
import { useNavigate } from 'react-router-dom';

interface AdminCaseDetailModalProps {
  caso: {
    id: string;
    motivo_consulta: string;
    resumen_caso?: string;
    guia_abogado?: string;
    estado: string;
    created_at: string;
    valor_estimado?: string;
    tipo_lead?: string;
    tipo_perfil_borrador?: string;
    transcripcion_chat?: any;
    propuesta_estructurada?: any;
    documentos_adjuntos?: any;
    nombre_borrador?: string;
    apellido_borrador?: string;
    email_borrador?: string;
    telefono_borrador?: string;
    ciudad_borrador?: string;
    razon_social_borrador?: string;
    nif_cif_borrador?: string;
    nombre_gerente_borrador?: string;
    direccion_fiscal_borrador?: string;
    preferencia_horaria_contacto?: string;
    especialidades?: { id: number; nombre: string };
    profiles?: { 
      nombre: string; 
      apellido: string; 
      email: string;
      telefono?: string;
      ciudad?: string;
      tipo_perfil: string;
      razon_social?: string;
      nif_cif?: string;
      nombre_gerente?: string;
      direccion_fiscal?: string;
    };
    asignaciones_casos?: Array<{
      abogado_id: string;
      estado_asignacion: string;
      fecha_asignacion: string;
      notas_asignacion?: string;
      profiles: { nombre: string; apellido: string; email: string };
    }>;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onGenerateResolution: (casoId: string) => void;
  onUploadDocument: (casoId: string) => void;
  onSendMessage: (casoId: string) => void;
}

const AdminCaseDetailModal: React.FC<AdminCaseDetailModalProps> = ({
  caso,
  isOpen,
  onClose,
  onGenerateResolution,
  onUploadDocument,
  onSendMessage
}) => {
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isClientUploadModalOpen, setIsClientUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSolicitandoPago, setIsSolicitandoPago] = useState(false);
  const [convertingToClient, setConvertingToClient] = useState(false);
  
  // Estados para scroll de tabs
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(false);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConvertToClientModal, setShowConvertToClientModal] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Obtener los datos actualizados del caché de React Query
  const { data: allCases } = useAdminCases();
  const updatedCaso = allCases?.find(c => c.id === caso?.id) || caso;

  // Hooks que dependen de updatedCaso - siempre se ejecutan pero pueden fallar si no hay caso
  const { 
    documentosResolucion, 
    loading: loadingDocs, 
    downloadDocument, 
    deleteDocument,
    getSignedUrl,
    refetch: refetchDocuments 
  } = useDocumentManagement(updatedCaso?.id || '');

  const {
    documentosCliente,
    loading: loadingClientDocs,
    downloadDocument: downloadClientDocument,
    getSignedUrl: getClientSignedUrl,
    refetch: refetchClientDocuments,
    deleteDocument: deleteClientDocument
  } = useClientDocumentManagement(updatedCaso?.id || '');

  const { mutate: closeCase, isLoading: isClosingCase } = useCloseCase();
  const { mutate: updateCase, isLoading: isUpdatingCase } = useUpdateCase();
  
  // Verificar acceso usando el profile del contexto
  const isSuperAdmin = profile?.role === 'abogado' && profile?.tipo_abogado === 'super_admin';
  const hasAccess = isSuperAdmin;

  // Verificar acceso cuando el modal se abre
  useEffect(() => {
    if (isOpen && !hasAccess) {
      console.error('Acceso denegado: usuario no es super admin');
      toast({
        title: 'Error',
        description: 'No tienes permisos para ver este caso',
        variant: 'destructive',
      });
      onClose();
    }
  }, [isOpen, hasAccess, onClose, toast]);

  // Hook para detectar overflow en los tabs
  useEffect(() => {
    const checkOverflow = () => {
      if (tabsContainerRef.current) {
        const container = tabsContainerRef.current;
        const hasOverflow = container.scrollWidth > container.clientWidth;
        const scrollLeft = container.scrollLeft;
        const maxScrollLeft = container.scrollWidth - container.clientWidth;
        
        setShowLeftIndicator(hasOverflow && scrollLeft > 0);
        setShowRightIndicator(hasOverflow && scrollLeft < maxScrollLeft);
      }
    };

    // Ejecutar inmediatamente y después de un pequeño delay para asegurar que el DOM esté listo
    checkOverflow();
    const timeoutId = setTimeout(checkOverflow, 100);
    
    window.addEventListener('resize', checkOverflow);
    
    return () => {
      window.removeEventListener('resize', checkOverflow);
      clearTimeout(timeoutId);
    };
  }, [isOpen]); // Agregar isOpen como dependencia para que se ejecute cuando el modal se abre

  // Convertir a zona horaria de España
  const spainTimeZone = 'Europe/Madrid';
  const casoDate = updatedCaso ? toZonedTime(new Date(updatedCaso.created_at), spainTimeZone) : new Date();

  // Early return después de todos los hooks
  if (!updatedCaso) return null;

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

  const handleViewClientDocument = async (doc: any) => {
    const signedUrl = await getClientSignedUrl(doc);
    if (signedUrl) {
      setSelectedDocument({
        name: doc.nombre_archivo,
        url: signedUrl,
        type: doc.tipo_documento,
        size: doc.tamaño_archivo
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo generar la URL para visualizar el documento",
        variant: "destructive"
      });
    }
  };

  const handleViewResolutionDocument = async (doc: any) => {
    const signedUrl = await getSignedUrl(doc);
    if (signedUrl) {
      setSelectedDocument({
        name: doc.nombre_archivo,
        url: signedUrl,
        type: doc.tipo_documento,
        size: doc.tamaño_archivo
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo generar la URL para visualizar el documento",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const result = await deleteDocument(docId);
    if (result.success) {
      toast({
        title: "Éxito",
        description: "Documento eliminado correctamente",
      });
      refetchDocuments();
    } else {
      toast({
        title: "Error",
        description: result.error || "Error al eliminar el documento",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClientDocument = async (docId: string) => {
    const result = await deleteClientDocument(docId);
    if (result.success) {
      toast({
        title: "Éxito",
        description: "Documento del cliente eliminado correctamente",
      });
      refetchClientDocuments();
    } else {
      toast({
        title: "Error",
        description: result.error || "Error al eliminar el documento",
        variant: "destructive"
      });
    }
  };

  const handleUploadSuccess = () => {
    refetchDocuments();
    setIsUploadModalOpen(false);
    toast({
      title: "Éxito",
      description: "Documento subido correctamente",
    });
  };

  const handleClientUploadSuccess = () => {
    refetchClientDocuments();
    setIsClientUploadModalOpen(false);
    toast({
      title: "Éxito",
      description: "Documento del cliente subido correctamente",
    });
  };

  const handleCerrarCaso = async () => {
    if (!updatedCaso) return;
    
    closeCase(updatedCaso.id, {
      onSuccess: (data) => {
        if (data.success) {
          toast({
            title: "Éxito",
            description: "Caso cerrado correctamente",
          });
          onClose();
        } else {
          toast({
            title: "Error",
            description: data.error || "No se pudo cerrar el caso",
            variant: "destructive"
          });
        }
      },
      onError: (error) => {
        console.error('Error al cerrar caso:', error);
        toast({
          title: "Error",
          description: "Error inesperado al cerrar el caso",
          variant: "destructive"
        });
      }
    });
  };

  const handleEditSuccess = () => {
    // Ya no necesitamos recargar la página, React Query se encarga de actualizar el caché
    toast({
      title: "Éxito",
      description: "Caso actualizado correctamente",
    });
    setIsEditModalOpen(false);
  };

  const handleSolicitarPago = async () => {
    if (!updatedCaso) return;
    
    setLoadingPayment(true);
    try {
      // Aquí iría la lógica para solicitar pago
      // Por ahora es un placeholder
      toast({
        title: "Funcionalidad en desarrollo",
        description: "La funcionalidad de solicitar pago estará disponible pronto",
      });
    } catch (error) {
      console.error('Error al solicitar pago:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la solicitud de pago",
        variant: "destructive"
      });
    } finally {
      setLoadingPayment(false);
      setShowPaymentModal(false);
    }
  };

  const handleConvertToClient = async () => {
    if (!updatedCaso || !user) return;
    
    setConvertingToClient(true);
    try {
      // Aquí iría la lógica para convertir a cliente
      toast({
        title: 'Éxito',
        description: 'Caso convertido a cliente correctamente',
      });
      setShowConvertToClientModal(false);
    } catch (error: any) {
      console.error('Error convirtiendo a cliente:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al convertir a cliente',
        variant: 'destructive',
      });
    } finally {
      setConvertingToClient(false);
    }
  };

  const clientData = {
    nombre: updatedCaso.nombre_borrador || '',
    apellido: updatedCaso.apellido_borrador || '',
    email: updatedCaso.email_borrador || '',
    telefono: updatedCaso.telefono_borrador || '',
    ciudad: updatedCaso.ciudad_borrador || '',
    tipo_perfil: updatedCaso.tipo_perfil_borrador || 'individual',
    razon_social: updatedCaso.razon_social_borrador || '',
    nif_cif: updatedCaso.nif_cif_borrador || '',
    nombre_gerente: updatedCaso.nombre_gerente_borrador || '',
    direccion_fiscal: updatedCaso.direccion_fiscal_borrador || ''
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={`max-w-5xl w-full h-[95vh] flex flex-col p-0 ${
          updatedCaso.estado === 'asignado' ? 'border-2 border-green-200 dark:border-green-700' : ''
        }`}>
          <DialogHeader className={`px-6 py-4 flex-shrink-0 ${
            updatedCaso.estado === 'asignado' ? 'bg-green-50 dark:bg-green-950/30 border-b border-green-200 dark:border-green-800' : ''
          }`}>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalle del Caso #{updatedCaso.id.substring(0, 8)}
              {getStatusBadge(updatedCaso.estado)}
              {updatedCaso.estado === 'asignado' && updatedCaso.asignaciones_casos && updatedCaso.asignaciones_casos.length > 0 && (
                <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-semibold border border-green-200 dark:border-green-700">
                  <UserPlus className="h-3 w-3" />
                  Asignado a: {updatedCaso.asignaciones_casos[0].profiles?.nombre} {updatedCaso.asignaciones_casos[0].profiles?.apellido}
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-hidden" style={{ height: 'calc(100vh - 320px)' }}>
            <div className="h-full overflow-y-auto px-6 py-4">
              <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
                {/* Contenedor de tabs con scroll horizontal */}
                <div className="sticky top-0 z-10 bg-background border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <div className="px-6 py-3">
                    <div className="relative">
                      {/* Scroll horizontal para tabs */}
                      <div 
                        ref={tabsContainerRef}
                        className="overflow-x-auto scrollbar-hide scroll-smooth relative"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                        onScroll={() => {
                          if (tabsContainerRef.current) {
                            const container = tabsContainerRef.current;
                            const hasOverflow = container.scrollWidth > container.clientWidth;
                            const scrollLeft = container.scrollLeft;
                            const maxScrollLeft = container.scrollWidth - container.clientWidth;
                            
                            setShowLeftIndicator(hasOverflow && scrollLeft > 0);
                            setShowRightIndicator(hasOverflow && scrollLeft < maxScrollLeft);
                          }
                        }}
                      >
                        <TabsList className="flex w-full rounded-lg shadow-sm border mb-0 bg-white dark:bg-gray-800" style={{ minWidth: 'max-content' }}>
                          <TabsTrigger value="overview" className="flex items-center gap-1 px-3 py-2 flex-1 min-w-[100px] max-w-[120px] md:flex-none md:min-w-[120px] md:max-w-[140px] flex-shrink-0 whitespace-nowrap text-xs">
                            <FileText className="h-3 w-3" /> Resumen
                          </TabsTrigger>
                          {updatedCaso.guia_abogado && (
                            <TabsTrigger value="guia" className="flex items-center gap-1 px-3 py-2 flex-1 min-w-[120px] max-w-[140px] md:flex-none md:min-w-[140px] md:max-w-[160px] flex-shrink-0 whitespace-nowrap text-xs">
                              <ShieldCheck className="h-3 w-3" /> Guía Abog
                            </TabsTrigger>
                          )}
                          <TabsTrigger value="client" className="flex items-center gap-1 px-3 py-2 flex-1 min-w-[80px] max-w-[100px] md:flex-none md:min-w-[100px] md:max-w-[120px] flex-shrink-0 whitespace-nowrap text-xs">
                            <User className="h-3 w-3" /> Cliente
                          </TabsTrigger>
                          <TabsTrigger value="chat" className="flex items-center gap-1 px-3 py-2 flex-1 min-w-[100px] max-w-[120px] md:flex-none md:min-w-[120px] md:max-w-[140px] flex-shrink-0 whitespace-nowrap text-xs">
                            <MessageSquare className="h-3 w-3" /> Convers
                          </TabsTrigger>
                          <TabsTrigger value="documents" className="flex items-center gap-1 px-3 py-2 flex-1 min-w-[100px] max-w-[120px] md:flex-none md:min-w-[120px] md:max-w-[140px] flex-shrink-0 whitespace-nowrap text-xs">
                            <FileText className="h-3 w-3" /> Docs
                          </TabsTrigger>
                          <TabsTrigger value="notes" className="flex items-center gap-1 px-3 py-2 flex-1 min-w-[70px] max-w-[90px] md:flex-none md:min-w-[90px] md:max-w-[110px] flex-shrink-0 whitespace-nowrap text-xs">
                            <MessageSquare className="h-3 w-3" /> Notas
                          </TabsTrigger>
                        </TabsList>
                      </div>
                      
                      {/* Botones de navegación simplificados */}
                      {showLeftIndicator && (
                        <button
                          onClick={() => {
                            if (tabsContainerRef.current) {
                              tabsContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
                            }
                          }}
                          className="scroll-nav-button left-1"
                          title="Scroll izquierda"
                        >
                          <ChevronLeft className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                        </button>
                      )}
                      {showRightIndicator && (
                        <button
                          onClick={() => {
                            if (tabsContainerRef.current) {
                              tabsContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                            }
                          }}
                          className="scroll-nav-button right-1"
                          title="Scroll derecha"
                        >
                          <ChevronRight className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                        </button>
                      )}
                      
                      {/* Indicador visual simple de scroll */}
                      {showRightIndicator && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-60 pointer-events-none z-10"></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contenedor de contenido con altura fija */}
                <TabsContent value="overview" className="space-y-4 mt-0">
                  <Card className="shadow-md border border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        Información del Caso
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {updatedCaso.resumen_caso && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Resumen del caso:</p>
                          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                            <ScrollArea className="h-96">
                              <div className="prose prose-slate max-w-none dark:prose-invert text-sm">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {updatedCaso.resumen_caso}
                                </ReactMarkdown>
                              </div>
                            </ScrollArea>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span>{format(casoDate, 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(casoDate, { locale: es, addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{updatedCaso.especialidades?.nombre || 'Sin especialidad'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {updatedCaso.tipo_lead && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Tipo de lead:</p>
                            <Badge variant="secondary" className="capitalize">{updatedCaso.tipo_lead}</Badge>
                          </div>
                        )}
                        {updatedCaso.valor_estimado && (
                          <div className="flex items-center gap-1 text-sm">
                            <Euro className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-700 dark:text-blue-400">
                              Valor estimado: {updatedCaso.valor_estimado}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold text-gray-700 dark:text-gray-200">Estado y Asignación</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Estado actual:</p>
                        {getStatusBadge(updatedCaso.estado)}
                      </div>
                      {updatedCaso.asignaciones_casos && updatedCaso.asignaciones_casos.length > 0 ? (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Asignado a:</p>
                          {updatedCaso.asignaciones_casos.map((asignacion, idx) => (
                            <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">
                                  {asignacion.profiles?.nombre} {asignacion.profiles?.apellido}
                                </span>
                                {asignacion.notas_asignacion && (
                                  <Badge 
                                    variant="outline" 
                                    className="ml-2 text-xs bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600"
                                    title={asignacion.notas_asignacion}
                                  >
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    {asignacion.notas_asignacion.length > 30 
                                      ? `${asignacion.notas_asignacion.substring(0, 30)}...` 
                                      : asignacion.notas_asignacion
                                    }
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Asignado el {format(new Date(asignacion.fecha_asignacion), 'dd/MM/yyyy', { locale: es })}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Sin asignar</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {updatedCaso.guia_abogado && (
                  <TabsContent value="guia" className="space-y-4 mt-0">
                    <Card className="shadow-md border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-950">
                      <CardHeader>
                        <CardTitle className="text-base font-bold text-blue-900 dark:text-blue-200">Guía para el Abogado</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-slate bg-white max-w-none dark:prose-invert dark:bg-gray-900 p-5 rounded text-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
                          <ScrollArea className="h-96">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {updatedCaso.guia_abogado}
                            </ReactMarkdown>
                          </ScrollArea>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                <TabsContent value="client" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Información del Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Nombre completo:</p>
                          <p className="text-sm">{clientData.nombre} {clientData.apellido}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Tipo de perfil:</p>
                          <Badge variant="outline">
                            {clientData.tipo_perfil === 'empresa' ? (
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
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Email:</p>
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm">{clientData.email}</p>
                          </div>
                        </div>
                        {clientData.telefono && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Teléfono:</p>
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm">{clientData.telefono}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {clientData.ciudad && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Ciudad:</p>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm">{clientData.ciudad}</p>
                          </div>
                        </div>
                      )}

                      {clientData.tipo_perfil === 'empresa' && (
                        <>
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded space-y-2">
                            {clientData.razon_social && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Razón social:</p>
                                <p className="text-sm font-semibold">{clientData.razon_social}</p>
                              </div>
                            )}
                            {clientData.nif_cif && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">NIF/CIF:</p>
                                <p className="text-sm">{clientData.nif_cif}</p>
                              </div>
                            )}
                            {clientData.nombre_gerente && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Nombre del gerente:</p>
                                <p className="text-sm">{clientData.nombre_gerente}</p>
                              </div>
                            )}
                            {clientData.direccion_fiscal && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Dirección fiscal:</p>
                                <p className="text-sm">{clientData.direccion_fiscal}</p>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="chat" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Transcripción de la Conversación</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {updatedCaso.transcripcion_chat ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {JSON.stringify(updatedCaso.transcripcion_chat, null, 2)}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No hay transcripción disponible</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            Documentos del Cliente
                          </div>
                          <Button
                            onClick={() => setIsClientUploadModalOpen(true)}
                            variant="outline"
                            size="sm"
                            className="gap-1"
                          >
                            <Upload className="h-3 w-3" />
                            Subir
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {loadingClientDocs ? (
                            <div className="text-center py-4 text-muted-foreground">
                              <p className="text-sm">Cargando documentos...</p>
                            </div>
                          ) : documentosCliente.length > 0 ? (
                            <div className="space-y-2">
                              {documentosCliente.map((doc) => (
                                <div key={doc.id} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                                      {doc.nombre_archivo}
                                    </p>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                      {doc.tipo_documento} • {format(new Date(doc.fecha_subida), 'dd/MM/yyyy', { locale: es })}
                                    </p>
                                    {doc.descripcion && (
                                      <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                                        {doc.descripcion}
                                      </p>
                                    )}
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleViewClientDocument(doc)}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => downloadClientDocument(doc)}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDeleteClientDocument(doc.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No hay documentos del cliente</p>
                              <p className="text-xs">Puedes subir documentos en nombre del cliente usando el botón de arriba</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                          Documentos de Resolución
                          <Button
                            onClick={() => setIsUploadModalOpen(true)}
                            variant="outline"
                            size="sm"
                            className="gap-1"
                          >
                            <Upload className="h-3 w-3" />
                            Subir
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {loadingDocs ? (
                            <div className="text-center py-4 text-muted-foreground">
                              <p className="text-sm">Cargando documentos...</p>
                            </div>
                          ) : documentosResolucion.length > 0 ? (
                            <div className="space-y-2">
                              {documentosResolucion.map((doc) => (
                                <div key={doc.id} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                  <FileText className="h-4 w-4 text-green-600" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-green-900 dark:text-green-100 truncate">
                                      {doc.nombre_archivo}
                                    </p>
                                    <p className="text-xs text-green-700 dark:text-green-300">
                                      {doc.tipo_documento} • {format(new Date(doc.fecha_subida), 'dd/MM/yyyy', { locale: es })}
                                    </p>
                                    {doc.descripcion && (
                                      <p className="text-xs text-green-600 dark:text-green-400 truncate">
                                        {doc.descripcion}
                                      </p>
                                    )}
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleViewResolutionDocument(doc)}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => downloadDocument(doc)}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No hay documentos de resolución</p>
                              <p className="text-xs">Puedes subir documentos usando el botón de arriba</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4 mt-0">
                  {updatedCaso?.id && <CaseNotesSection casoId={updatedCaso.id} />}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {updatedCaso.estado !== 'cerrado' && (
            <div className="border-t bg-background">
              <Separator />
              <div className="p-4">
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Editar Caso
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowAssignmentModal(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Asignar Abogado
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => onGenerateResolution(updatedCaso.id)} 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Bot className="h-4 w-4" />
                    IA
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsUploadModalOpen(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Subir Documento
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onSendMessage(updatedCaso.id)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Enviar Mensaje
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowPaymentModal(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Solicitar Pago
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowConvertToClientModal(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Convertir en Cliente
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCerrarCaso}
                    variant="destructive"
                    disabled={isClosingCase}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {isClosingCase ? 'Cerrando...' : 'Cerrar Caso'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        casoId={updatedCaso?.id || ''}
        onUploadSuccess={handleUploadSuccess}
      />

      <ClientDocumentUploadModal
        isOpen={isClientUploadModalOpen}
        onClose={() => setIsClientUploadModalOpen(false)}
        casoId={updatedCaso?.id || ''}
        onUploadSuccess={handleClientUploadSuccess}
      />

      <DocumentViewer
        isOpen={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        document={selectedDocument}
      />

      <CaseEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        caso={updatedCaso}
        onSave={handleEditSuccess}
      />

      <CaseAssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        casoId={updatedCaso?.id || ''}
        onSuccess={() => {
          setShowAssignmentModal(false);
          // Refetch data
        }}
      />
    </>
  );
};

export default AdminCaseDetailModal; 