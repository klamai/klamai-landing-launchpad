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
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    cliente_id?: string | null;
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
  const [showLinkClientModal, setShowLinkClientModal] = useState(false);
  const [showConvertToClientModal, setShowConvertToClientModal] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [pagos, setPagos] = useState<any[]>([]);
  const [chargeConcept, setChargeConcept] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeExencion, setChargeExencion] = useState<'none' | 'b2b_ue' | 'fuera_ue' | 'suplido' | 'ajg'>('none');
  // Envío de propuesta (WhatsApp)
  const [showSendProposalModal, setShowSendProposalModal] = useState(false);
  const [proposalPhone, setProposalPhone] = useState('');
  const [includeCheckoutLink, setIncludeCheckoutLink] = useState(false);
  const [sendingProposal, setSendingProposal] = useState(false);

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

  const { mutate: closeCase, isPending: isClosingCase } = useCloseCase() as any;
  const { mutate: updateCase } = useUpdateCase() as any;
  
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

  // Cargar pagos del caso
  useEffect(() => {
    const loadPagos = async () => {
      if (!updatedCaso?.id) return;
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const { data, error } = await supabase.functions.invoke('listar-pagos-caso', {
        body: { caso_id: updatedCaso.id },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!error) setPagos(data?.pagos || []);
    };
    loadPagos();
  }, [updatedCaso?.id]);

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

  const getPaymentStatusLabel = (estado: string) => {
    const map: Record<string, string> = {
      succeeded: 'Hecho',
      paid: 'Hecho',
      processing: 'Procesando',
      pending: 'Pendiente',
      requires_action: 'Requiere acción',
      requires_payment_method: 'Requiere método de pago',
      failed: 'Fallido',
      canceled: 'Cancelado',
      refunded: 'Reembolsado',
    };
    return map[estado] || estado;
  };

  const computePagoAmount = (pago: any) => {
    return typeof pago.monto_total === 'number' ? pago.monto_total : Number(pago.monto_total || pago.monto || 0);
  };

  const computePagoNeto = (pago: any) => {
    const amount = computePagoAmount(pago);
    const comision = pago.comision != null ? Number(pago.comision) : null;
    if (pago.monto_neto != null) return Number(pago.monto_neto);
    if (pago.estado === 'succeeded' && comision != null) return Number(amount) - comision;
    return 0;
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
        <DialogContent className={`max-w-5xl w-full h-[90vh] md:h-[95vh] flex flex-col p-0 ${
          (updatedCaso.estado === 'asignado' || (updatedCaso as any)?.fecha_pago) ? 'border-2 border-green-300 dark:border-green-700' : ''
        }`}>
          <DialogHeader className={`px-6 py-4 flex-shrink-0 ${
            updatedCaso.estado === 'asignado' ? 'bg-green-50 dark:bg-green-950/30 border-b border-green-200 dark:border-green-800' : ''
          }`}>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalle del Caso #{updatedCaso.id.substring(0, 8)}
              {getStatusBadge(updatedCaso.estado)}
              {!updatedCaso?.cliente_id && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6 ml-1"
                        onClick={() => setShowLinkClientModal(true)}
                      >
                        <UserPlus className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span>Vincular cliente</span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {updatedCaso.estado === 'asignado' && updatedCaso.asignaciones_casos && updatedCaso.asignaciones_casos.length > 0 && (
                <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-semibold border border-green-200 dark:border-green-700">
                  <UserPlus className="h-3 w-3" />
                  Asignado a: {updatedCaso.asignaciones_casos[0].profiles?.nombre} {updatedCaso.asignaciones_casos[0].profiles?.apellido}
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-hidden" style={{ height: 'calc(90vh - 280px) md:calc(95vh - 320px)' }}>
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
                          <TabsTrigger value="pagos" className="flex items-center gap-1 px-3 py-2 flex-1 min-w-[80px] max-w-[100px] md:flex-none md:min-w-[100px] md:max-w-[120px] flex-shrink-0 whitespace-nowrap text-xs">
                            <Euro className="h-3 w-3" /> Pagos
                  </TabsTrigger>
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
                                <div className="ml-2 text-xs text-yellow-800 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded px-2 py-1 max-w-full">
                                  <div className="flex items-center gap-1 mb-0.5">
                                    <MessageSquare className="h-3 w-3" />
                                    <span className="font-medium">Nota de asignación</span>
                                  </div>
                                  <p className="whitespace-pre-wrap break-words leading-snug">{asignacion.notas_asignacion}</p>
                                </div>
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

                <TabsContent value="pagos" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Pagos del Caso</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {pagos.length > 0 ? (
                        <div className="overflow-x-auto">
                        <Table className="min-w-[700px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Concepto</TableHead>
                              <TableHead>Importe</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Solicitante</TableHead>
                  <TableHead>Gestión Klamai</TableHead>
                              <TableHead>Neto</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                          {pagos.map((pago) => {
                              const amount = typeof pago.monto_total === 'number' ? pago.monto_total : Number(pago.monto_total || pago.monto || 0);
                              return (
                                <TableRow key={pago.id}>
                                  <TableCell>{new Date(pago.created_at).toLocaleDateString('es-ES')}</TableCell>
                                  <TableCell>{pago.concepto || pago.descripcion || '—'}</TableCell>
                                  <TableCell>€{amount.toFixed(2)}</TableCell>
                                  <TableCell>
                                  <Badge variant={pago.estado === 'succeeded' ? 'default' : pago.estado === 'failed' ? 'destructive' : 'secondary'}>
                                      {getPaymentStatusLabel(pago.estado)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{pago.solicitante_rol || '—'}</TableCell>
                                  <TableCell>{pago.comision ? `€${Number(pago.comision).toFixed(2)}` : '€0.00'}</TableCell>
                                <TableCell>{(() => { const neto = computePagoNeto(pago); return neto > 0 ? `€${neto.toFixed(2)}` : '—'; })()}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                        {/* Total Neto */}
                        <div className="flex justify-end mt-3 pr-2">
                          <div className="text-sm font-semibold">
                            Total Neto: €{pagos.reduce((acc, p) => acc + computePagoNeto(p), 0).toFixed(2)}
                          </div>
                        </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No hay pagos registrados</div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {updatedCaso.guia_abogado && (
                <TabsContent value="guia" className="space-y-4 mt-0">
                  <Card className="shadow-md border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-950">
                      <CardHeader className="space-y-2">
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
                      <CardTitle className="text-base flex items-center gap-2">
                        Información del Cliente
                      {updatedCaso?.cliente_id ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="ml-2 h-7 text-xs"
                            onClick={() => window.location.href = '/abogados/dashboard/clientes'}
                            title="Abrir gestión de clientes"
                          >
                            Ver perfil
                          </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-2 h-7 text-xs"
                          onClick={() => setShowLinkClientModal(true)}
                          title="Vincular cliente"
                        >
                          <UserPlus className="h-3 w-3 mr-1" /> Vincular
                        </Button>
                      )}
                      </CardTitle>
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
                      {(updatedCaso as any)?.transcripcion_chat ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                          {JSON.stringify((updatedCaso as any).transcripcion_chat, null, 2)}
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
                        <CardTitle className="text-base">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          Documentos del Cliente
                        </div>
                        </CardTitle>
                        <div className="mt-3">
                        <Button
                            onClick={() => setIsClientUploadModalOpen(true)}
                          variant="outline"
                          size="sm"
                          className="gap-1"
                        >
                          <Upload className="h-3 w-3" />
                          Subir
                        </Button>
                        </div>
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
                      <CardHeader className="space-y-2">
                        <CardTitle className="text-base">Documentos de Resolución</CardTitle>
                        <div className="mt-3">
                        <Button
                            onClick={() => setIsUploadModalOpen(true)}
                          variant="outline"
                          size="sm"
                          className="gap-1"
                        >
                          <Upload className="h-3 w-3" />
                          Subir
                        </Button>
                        </div>
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
                {/* Toolbar compacta: desktop con grupos */}
                <div className="hidden md:flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => setIsEditModalOpen(true)} variant="default" className="rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-sm">
                      <User className="h-4 w-4 mr-1" /> Editar
                  </Button>
                    <Button size="sm" onClick={() => setShowAssignmentModal(true)} variant="default" className="rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-sm">
                      <Users className="h-4 w-4 mr-1" /> Asignar
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                  <Button
                    size="sm"
                              onClick={() => setShowPaymentModal(true)}
                              variant="default"
                              disabled={!updatedCaso?.cliente_id}
                              className="rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-sm disabled:opacity-60 disabled:pointer-events-auto"
                            >
                              <CreditCard className="h-4 w-4 mr-1" /> Cobrar
                  </Button>
                          </span>
                        </TooltipTrigger>
                        {!updatedCaso?.cliente_id && (
                          <TooltipContent>
                            <div className="flex items-center gap-2">
                              <span>Vincula el caso a un cliente para solicitar pago</span>
                              <Button size="sm" variant="outline" className="h-7 px-2 ml-2" onClick={() => setShowLinkClientModal(true)}>Vincular</Button>
                </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => onGenerateResolution(updatedCaso.id)} variant="outline" className="rounded-xl border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
                      <Bot className="h-4 w-4 mr-1" /> IA
                  </Button>
                    <Button size="sm" onClick={() => setIsUploadModalOpen(true)} variant="outline" className="rounded-xl">
                      <Upload className="h-4 w-4 mr-1" /> Documento
                  </Button>
                    <Button size="sm" onClick={() => onSendMessage(updatedCaso.id)} variant="outline" className="rounded-xl border-blue-200 dark:border-blue-800">
                      <MessageSquare className="h-4 w-4 mr-1" /> Mensaje
                  </Button>
                    {/* Botón visible para enviar propuesta cuando aplique */}
                    {updatedCaso?.estado === 'listo_para_propuesta' && (
                  <Button 
                    size="sm"
                        onClick={() => {
                          const seedPhone = (updatedCaso as any)?.telefono_borrador || (updatedCaso as any)?.profiles?.telefono || '';
                          setProposalPhone(seedPhone || '');
                          setIncludeCheckoutLink(false);
                          setShowSendProposalModal(true);
                        }}
                        className="rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-sm"
                      >
                        <Send className="h-4 w-4 mr-1" /> Enviar propuesta
                  </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="rounded-xl">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-60 p-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 shadow-lg">
                        {updatedCaso?.estado === 'listo_para_propuesta' && (
                          <DropdownMenuItem
                            onClick={() => {
                              const seedPhone = (updatedCaso as any)?.telefono_borrador || (updatedCaso as any)?.profiles?.telefono || '';
                              setProposalPhone(seedPhone || '');
                              setIncludeCheckoutLink(false);
                              setShowSendProposalModal(true);
                            }}
                            className="flex items-center gap-2 text-sm font-medium rounded-lg hover:bg-blue-50 hover:text-blue-900 dark:hover:bg-blue-900/30 dark:hover:text-blue-200 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-900 dark:data-[highlighted]:bg-blue-900/30 dark:data-[highlighted]:text-blue-200"
                          >
                            <Mail className="h-4 w-4 mr-1 text-indigo-600" /> Enviar propuesta
                          </DropdownMenuItem>
                        )}
                        {!updatedCaso?.cliente_id && (
                          <DropdownMenuItem onClick={() => setShowLinkClientModal(true)} className="flex items-center gap-2 text-sm font-medium rounded-lg hover:bg-blue-50 hover:text-blue-900 dark:hover:bg-blue-900/30 dark:hover:text-blue-200 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-900 dark:data-[highlighted]:bg-blue-900/30 dark:data-[highlighted]:text-blue-200">
                            <Plus className="h-4 w-4 mr-1 text-blue-600" /> Vincular/Convertir Cliente
                          </DropdownMenuItem>
                        )}
                        {updatedCaso?.estado === 'listo_para_propuesta' && (
                          <DropdownMenuItem
                            onClick={() => {
                              const seedPhone = (updatedCaso as any)?.telefono_borrador || (updatedCaso as any)?.profiles?.telefono || '';
                              setProposalPhone(seedPhone || '');
                              setIncludeCheckoutLink(false);
                              setShowSendProposalModal(true);
                            }}
                            className="flex items-center gap-2 text-sm font-medium rounded-lg hover:bg-blue-50 hover:text-blue-900 dark:hover:bg-blue-900/30 dark:hover:text-blue-200 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-900 dark:data-[highlighted]:bg-blue-900/30 dark:data-[highlighted]:text-blue-200"
                          >
                            <Mail className="h-4 w-4 mr-1 text-indigo-600" /> Enviar propuesta
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={handleCerrarCaso} disabled={isClosingCase} className="flex items-center gap-2 text-sm font-medium rounded-lg hover:bg-rose-50 hover:text-rose-900 dark:hover:bg-rose-900/30 dark:hover:text-rose-200 data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-900 dark:data-[highlighted]:bg-rose-900/30 dark:data-[highlighted]:text-rose-200">
                          <CheckCircle className="h-4 w-4 mr-1 text-rose-600" /> {isClosingCase ? 'Cerrando...' : 'Cerrar Caso'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {/* Móvil: 2 primarias + menú Más */}
                <div className="md:hidden flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => setIsEditModalOpen(true)} className="rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-sm">
                      <User className="h-4 w-4 mr-1" /> Editar
                  </Button>
                    <Button size="sm" onClick={() => setShowAssignmentModal(true)} className="rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-sm">
                      <Users className="h-4 w-4 mr-1" /> Asignar
                    </Button>
                    <Button size="sm" onClick={() => setShowPaymentModal(true)} disabled={!updatedCaso?.cliente_id} className="rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-sm disabled:opacity-60 disabled:pointer-events-none">
                      <CreditCard className="h-4 w-4 mr-1" /> Cobrar
                    </Button>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="rounded-xl">
                        <MoreHorizontal className="h-4 w-4 mr-1" /> Más
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60 p-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 shadow-lg">
                      {updatedCaso?.estado === 'listo_para_propuesta' && (
                        <DropdownMenuItem
                          onClick={() => {
                            const seedPhone = (updatedCaso as any)?.telefono_borrador || (updatedCaso as any)?.profiles?.telefono || '';
                            setProposalPhone(seedPhone || '');
                            setIncludeCheckoutLink(false);
                            setShowSendProposalModal(true);
                          }}
                          className="flex items-center gap-2 text-sm font-medium rounded-lg hover:bg-blue-50 hover:text-blue-900 dark:hover:bg-blue-900/30 dark:hover:text-blue-200 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-900 dark:data-[highlighted]:bg-blue-900/30 dark:data-[highlighted]:text-blue-200"
                        >
                          <Mail className="h-4 w-4 mr-1 text-indigo-600" /> Enviar propuesta
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onGenerateResolution(updatedCaso.id)} className="flex items-center gap-2 text-sm font-medium rounded-lg hover:bg-blue-50 hover:text-blue-900 dark:hover:bg-blue-900/30 dark:hover:text-blue-200 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-900 dark:data-[highlighted]:bg-blue-900/30 dark:data-[highlighted]:text-blue-200">
                        <Bot className="h-4 w-4 mr-1 text-purple-600" /> Generar con IA
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 text-sm font-medium rounded-lg hover:bg-blue-50 hover:text-blue-900 dark:hover:bg-blue-900/30 dark:hover:text-blue-200 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-900 dark:data-[highlighted]:bg-blue-900/30 dark:data-[highlighted]:text-blue-200">
                        <Upload className="h-4 w-4 mr-1 text-blue-600" /> Subir Documento
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSendMessage(updatedCaso.id)} className="flex items-center gap-2 text-sm font-medium rounded-lg hover:bg-blue-50 hover:text-blue-900 dark:hover:bg-blue-900/30 dark:hover:text-blue-200 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-900 dark:data-[highlighted]:bg-blue-900/30 dark:data-[highlighted]:text-blue-200">
                        <MessageSquare className="h-4 w-4 mr-1 text-emerald-600" /> Enviar Mensaje
                      </DropdownMenuItem>
                      {!updatedCaso?.cliente_id && (
                        <DropdownMenuItem onClick={() => setShowLinkClientModal(true)} className="flex items-center gap-2 text-sm font-medium rounded-lg hover:bg-blue-50 hover:text-blue-900 dark:hover:bg-blue-900/30 dark:hover:text-blue-200 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-900 dark:data-[highlighted]:bg-blue-900/30 dark:data-[highlighted]:text-blue-200">
                          <Plus className="h-4 w-4 mr-1 text-indigo-600" /> Vincular/Convertir Cliente
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleCerrarCaso} disabled={isClosingCase} className="flex items-center gap-2 text-sm font-medium rounded-lg hover:bg-rose-50 hover:text-rose-900 dark:hover:bg-rose-900/30 dark:hover:text-rose-200 data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-900 dark:data-[highlighted]:bg-rose-900/30 dark:data-[highlighted]:text-rose-200">
                        <CheckCircle className="h-4 w-4 mr-1 text-rose-600" /> {isClosingCase ? 'Cerrando...' : 'Cerrar Caso'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {/* Modal Enviar Propuesta (WhatsApp) */}
              <Dialog open={showSendProposalModal} onOpenChange={setShowSendProposalModal}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Enviar propuesta por WhatsApp</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="proposalPhone">Teléfono del cliente</Label>
                      <Input id="proposalPhone" value={proposalPhone} onChange={(e) => setProposalPhone(e.target.value)} placeholder="+34 600 000 000" />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Incluir enlace de pago</p>
                        <p className="text-xs text-muted-foreground">Opcional. No recomendado por defecto.</p>
                      </div>
                      <Switch checked={includeCheckoutLink} onCheckedChange={setIncludeCheckoutLink} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowSendProposalModal(false)} disabled={sendingProposal}>Cancelar</Button>
                  <Button
                      onClick={async () => {
                        if (!updatedCaso?.id) return;
                        try {
                          setSendingProposal(true);
                          const session = await supabase.auth.getSession();
                          const token = session.data.session?.access_token;
                          const { data, error } = await supabase.functions.invoke('enviar-propuesta-whatsapp', {
                            body: { caso_id: updatedCaso.id, include_checkout_url: includeCheckoutLink, phone_override: proposalPhone || undefined },
                            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                          });
                          if (error) throw new Error(error.message);
                          toast({ title: 'Propuesta enviada', description: 'Se envió por WhatsApp y se actualizó el estado.' });
                          setShowSendProposalModal(false);
                        } catch (e: any) {
                          toast({ title: 'Error', description: e?.message || 'No se pudo enviar la propuesta', variant: 'destructive' });
                        } finally {
                          setSendingProposal(false);
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={sendingProposal || !proposalPhone}
                    >
                      {sendingProposal ? 'Enviando…' : 'Enviar'}
                  </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Vincular Cliente */}
      <Dialog open={showLinkClientModal} onOpenChange={setShowLinkClientModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular cliente al caso</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Opciones:</p>
            <div className="space-y-2">
                  <Button
                    variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setShowLinkClientModal(false);
                  toast({ title: 'Pendiente', description: 'Implementar búsqueda por email y asignación de cliente.' });
                }}
                  >
                Buscar y vincular por email existente
                  </Button>
                  <Button
                    variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setShowLinkClientModal(false);
                  toast({ title: 'Pendiente', description: 'Enviar invitación al email del borrador para que complete el registro.' });
                }}
                  >
                Enviar invitación al email borrador
                  </Button>
                </div>
                </div>
        </DialogContent>
      </Dialog>
      {/* Modal Solicitar Pago (Cobro Ad-hoc) */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="monto">Importe base (EUR)</Label>
              <Input id="monto" type="number" inputMode="decimal" step="0.01" min="0.01" pattern="^\\d+(\\.\\d{1,2})?$" value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value)} placeholder="0.00" />
              </div>
            <div className="space-y-2">
              <Label htmlFor="concepto">Concepto</Label>
              <Input id="concepto" value={chargeConcept} maxLength={140} onChange={(e) => setChargeConcept(e.target.value)} placeholder="Ej. Honorarios adicionales" />
            </div>
            <div className="space-y-2">
              <Label>IVA / Exención</Label>
              <Select value={chargeExencion} onValueChange={(v) => setChargeExencion(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona IVA/Exención" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">IVA 21% (por defecto)</SelectItem>
                  <SelectItem value="b2b_ue">Exento: B2B intracomunitario</SelectItem>
                  <SelectItem value="fuera_ue">Exento: Cliente fuera de la UE</SelectItem>
                  <SelectItem value="suplido">Exento: Suplido/Gasto repercutido</SelectItem>
                  <SelectItem value="ajg">Exento: Asistencia Jurídica Gratuita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)} disabled={loadingPayment}>Cancelar</Button>
            <Button
              onClick={async () => {
                if (!updatedCaso?.id) return;
                const concepto = chargeConcept.replace(/[\u0000-\u001F\u007F]/g, '').trim();
                const montoBase = Number(chargeAmount);
                if (!concepto || !isFinite(montoBase) || montoBase <= 0) {
                  toast({ title: 'Datos inválidos', description: 'Ingresa un concepto y un monto válido (> 0).', variant: 'destructive' });
                  return;
                }
                try {
                  setLoadingPayment(true);
                  const session = await supabase.auth.getSession();
                  const token = session.data.session?.access_token;
                  const { data, error } = await supabase.functions.invoke('crear-cobro', {
                    body: {
                      caso_id: updatedCaso.id,
                      concepto,
                      monto_base: Math.round(montoBase * 100) / 100,
                      exencion_tipo: chargeExencion,
                    },
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                  });
                  if (error) throw new Error(error.message);
                  toast({ title: 'Cobro solicitado', description: 'Se ha creado el cobro y aparecerá en Pagos del cliente.' });
                  // Refrescar sección de pagos inmediatamente
                  try {
                    const session2 = await supabase.auth.getSession();
                    const token2 = session2.data.session?.access_token;
                    const { data: pagosData } = await supabase.functions.invoke('listar-pagos-caso', {
                      body: { caso_id: updatedCaso.id },
                      headers: token2 ? { Authorization: `Bearer ${token2}` } : undefined,
                    });
                    setPagos(pagosData?.pagos || []);
                  } catch {}
                  setShowPaymentModal(false);
                  setChargeConcept(''); setChargeAmount(''); setChargeExencion('none');
                } catch (e: any) {
                  console.error('Error creando cobro:', e);
                  toast({ title: 'Error', description: e?.message || 'No se pudo crear el cobro.', variant: 'destructive' });
                } finally {
                  setLoadingPayment(false);
                }
              }}
              disabled={loadingPayment}
            >
              {loadingPayment ? 'Creando...' : 'Crear cobro'}
            </Button>
          </DialogFooter>
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
        caso={updatedCaso as any}
        onSave={handleEditSuccess}
      />

      <CaseAssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        caso={updatedCaso as any}
      />
    </>
  );
};

export default AdminCaseDetailModal; 