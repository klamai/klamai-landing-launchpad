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
  ChevronLeft,
  ChevronRight,
  CreditCard,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface LawyerCaseDetailModalProps {
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

const LawyerCaseDetailModal: React.FC<LawyerCaseDetailModalProps> = ({
  caso,
  isOpen,
  onClose,
  onGenerateResolution,
  onUploadDocument,
  onSendMessage
}) => {
  const [selectedDocument, setSelectedDocument] = useState<{name: string; url: string; type?: string; size?: number} | null>(null);
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(false);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showClientUploadModal, setShowClientUploadModal] = useState(false);
  const [userRole, setUserRole] = useState<'cliente' | 'abogado' | null>(null);
  const [lawyerType, setLawyerType] = useState<string | null>(null);
  const [isAssignedLawyer, setIsAssignedLawyer] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [isUploadingClientDocument, setIsUploadingClientDocument] = useState(false);
  const [isGeneratingResolution, setIsGeneratingResolution] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isClosingCase, setIsClosingCase] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [pagos, setPagos] = useState<any[]>([]);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [creatingCharge, setCreatingCharge] = useState(false);
  const [chargeConcept, setChargeConcept] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeExencion, setChargeExencion] = useState<'none' | 'b2b_ue' | 'fuera_ue' | 'suplido' | 'ajg'>('none');

  const { 
    documentosResolucion, 
    loading: loadingDocs, 
    downloadDocument, 
    deleteDocument,
    getSignedUrl,
    refetch: refetchDocuments 
  } = useDocumentManagement(caso?.id);

  const {
    documentosCliente,
    loading: loadingClientDocs,
    downloadDocument: downloadClientDocument,
    getSignedUrl: getClientSignedUrl,
    refetch: refetchClientDocuments,
    deleteDocument: deleteClientDocument
  } = useClientDocumentManagement(caso?.id);

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

  // Cargar pagos del caso (lectura)
  useEffect(() => {
    const loadPagos = async () => {
      if (!caso?.id) return;
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const { data, error } = await supabase.functions.invoke('listar-pagos-caso', {
        body: { caso_id: caso.id },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!error) setPagos(data?.pagos || []);
    };
    loadPagos();
  }, [caso?.id]);

  // Verificar rol y tipo de abogado
  const fetchUserRole = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, tipo_abogado')
      .eq('id', user.id as any)
      .single();
    
    // @ts-ignore
    setUserRole((profile as any)?.role || null);
    // @ts-ignore
    setLawyerType((profile as any)?.tipo_abogado || null);

    // Para abogados regulares, asumimos que están asignados si llegan aquí
    // @ts-ignore
    if ((profile as any)?.role === 'abogado' && (profile as any)?.tipo_abogado === 'regular') {
      setIsAssignedLawyer(true);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserRole();
    }
  }, [user]);

  // Verificar que el usuario es un abogado regular
  useEffect(() => {
    // Solo validar si ya tenemos toda la información necesaria
    if (caso && user && userRole && lawyerType !== undefined) {
      if (userRole !== 'abogado' || lawyerType !== 'regular') {
        console.error('Acceso denegado:', { 
          userRole, 
          lawyerType,
          userId: user.id,
          casoId: caso.id 
        });
        toast({
          title: 'Error',
          description: 'No tienes permisos para ver este caso',
          variant: 'destructive',
        });
        onClose();
      }
    }
  }, [caso, user, userRole, lawyerType, onClose, toast]);

  if (!caso) return null;

  // Convertir a zona horaria de España
  const spainTimeZone = 'Europe/Madrid';
  const casoDate = toZonedTime(new Date(caso.created_at), spainTimeZone);

  const getStatusBadge = (estado: string) => {
    const statusConfig = {
      'disponible': { 
        label: 'Disponible', 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
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
    setShowUploadModal(false);
    toast({
      title: "Éxito",
      description: "Documento subido correctamente",
    });
  };

  const handleClientUploadSuccess = () => {
    refetchClientDocuments();
    setShowClientUploadModal(false);
    toast({
      title: "Éxito",
      description: "Documento del cliente subido correctamente",
    });
  };

  const handleCerrarCaso = async () => {
    if (!caso) return;
    
    setIsClosing(true);
    try {
      const { data, error } = await supabase.functions.invoke('close-case', {
        body: { caso_id: caso.id },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;
      
      if (data.success) {
        toast({
          title: "Éxito",
          description: data.data.mensaje || "Caso cerrado correctamente",
        });
        onClose();
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error: any) {
      console.error('Error al cerrar caso:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cerrar el caso",
        variant: "destructive"
      });
    } finally {
      setIsClosing(false);
    }
  };

  const handleEditSuccess = () => {
    window.location.reload();
  };

  // Determinar si el usuario puede cerrar el caso
  const canCloseCase = () => {
    if (!user || !caso) return false;
    
    // No se puede cerrar si ya está cerrado
    if (caso.estado === 'cerrado') return false;
    
    // Abogado regular puede cerrar casos asignados
    if (userRole === 'abogado' && lawyerType === 'regular' && isAssignedLawyer) return true;
    
    return false;
  };

  // Determinar si el usuario puede subir documentos del cliente
  const canUploadClientDocuments = () => {
    if (!user || !caso) return false;
    
    // Abogado regular puede subir documentos del cliente solo a casos asignados
    if (userRole === 'abogado' && lawyerType === 'regular' && isAssignedLawyer) return true;
    
    return false;
  };

  // Determinar si el usuario puede eliminar documentos del cliente
  const canDeleteClientDocuments = () => {
    if (!user || !caso) return false;
    
    // Abogado regular puede eliminar documentos del cliente solo de casos asignados
    if (userRole === 'abogado' && lawyerType === 'regular' && isAssignedLawyer) return true;
    
    return false;
  };

  // Función para verificar si el usuario actual es el abogado asignado específico
  const isCurrentUserAssigned = (asignacion: any) => {
    return user && asignacion.abogado_id === user.id;
  };

  const clientData = {
    nombre: caso.nombre_borrador || '',
    apellido: caso.apellido_borrador || '',
    email: caso.email_borrador || '',
    telefono: caso.telefono_borrador || '',
    ciudad: caso.ciudad_borrador || '',
    tipo_perfil: caso.tipo_perfil_borrador || 'individual',
    razon_social: caso.razon_social_borrador || '',
    nif_cif: caso.nif_cif_borrador || '',
    nombre_gerente: caso.nombre_gerente_borrador || '',
    direccion_fiscal: caso.direccion_fiscal_borrador || ''
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl w-full h-[90vh] md:h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalle del Caso #{caso.id.substring(0, 8)}
              {getStatusBadge(caso.estado)}
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
                          {caso.guia_abogado && (
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
                          <TabsTrigger value="documentos-resolucion" className="flex items-center gap-1 px-3 py-2 flex-1 min-w-[120px] max-w-[140px] md:flex-none md:min-w-[140px] md:max-w-[160px] flex-shrink-0 whitespace-nowrap text-xs">
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
                      {caso.resumen_caso && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Resumen del caso:</p>
                          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                            <ScrollArea className="h-96">
                              <div className="prose prose-slate max-w-none dark:prose-invert text-sm">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {caso.resumen_caso}
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
                          <span>{caso.especialidades?.nombre || 'Sin especialidad'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {caso.tipo_lead && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Tipo de lead:</p>
                            <Badge variant="secondary" className="capitalize">{caso.tipo_lead}</Badge>
                          </div>
                        )}
                        {caso.valor_estimado && (
                          <div className="flex items-center gap-1 text-sm">
                            <Euro className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-700 dark:text-blue-400">
                              Valor estimado: {caso.valor_estimado}
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
                        {getStatusBadge(caso.estado)}
                      </div>
                      {caso.asignaciones_casos && caso.asignaciones_casos.length > 0 ? (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Asignado a:</p>
                          {caso.asignaciones_casos.map((asignacion, idx) => (
                            <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">
                                  {asignacion.profiles?.nombre} {asignacion.profiles?.apellido}
                                </span>
                                {asignacion.notas_asignacion && (
                                  <Badge 
                                    variant="outline" 
                                    className={`ml-2 text-xs ${
                                      isCurrentUserAssigned(asignacion)
                                        ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-600'
                                        : 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600'
                                    }`}
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

                <TabsContent value="pagos" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Pagos del Caso</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {pagos.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Concepto</TableHead>
                              <TableHead>Importe</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Comisión</TableHead>
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
                                      {pago.estado}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{pago.comision ? `€${Number(pago.comision).toFixed(2)}` : '€0.00'}</TableCell>
                                  <TableCell>{pago.monto_neto ? `€${Number(pago.monto_neto).toFixed(2)}` : (pago.estado === 'succeeded' && pago.comision != null ? `€${(Number(amount) - Number(pago.comision)).toFixed(2)}` : '—')}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-sm text-muted-foreground">No hay pagos registrados</div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {caso.guia_abogado && (
                  <TabsContent value="guia" className="space-y-4 mt-0">
                    <Card className="shadow-md border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-950">
                      <CardHeader>
                        <CardTitle className="text-base font-bold text-blue-900 dark:text-blue-200">Guía para el Abogado</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-slate bg-white max-w-none dark:prose-invert dark:bg-gray-900 p-5 rounded text-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
                          <ScrollArea className="h-96">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {caso.guia_abogado}
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
                      {caso.transcripcion_chat ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {JSON.stringify(caso.transcripcion_chat, null, 2)}
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

                <TabsContent value="documentos-resolucion" className="space-y-4 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            Documentos del Cliente
                          </div>
                          {canUploadClientDocuments() && (
                            <Button
                              onClick={() => setShowClientUploadModal(true)}
                              variant="outline"
                              size="sm"
                              className="gap-1"
                            >
                              <Upload className="h-3 w-3" />
                              Subir
                            </Button>
                          )}
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
                                  {canDeleteClientDocuments() && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleDeleteClientDocument(doc.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No hay documentos del cliente</p>
                              <p className="text-xs">
                                {canUploadClientDocuments() 
                                  ? "Puedes subir documentos en nombre del cliente usando el botón de arriba"
                                  : "El cliente no ha subido documentos aún"
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="space-y-2">
                        <CardTitle className="text-base">
                          Documentos de Resolución
                        </CardTitle>
                        <div className="mt-3">
                          <Button
                            onClick={() => setShowUploadModal(true)}
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
                  {caso?.id && <CaseNotesSection casoId={caso.id} />}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {caso.estado !== 'cerrado' && (
            <div className="border-t bg-background">
              <Separator />
              <div className="p-2 md:p-4">
                {/* Toolbar compacta: desktop con grupos */}
                <div className="hidden md:flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => setShowEditModal(true)} variant="default" className="rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-sm">
                      <User className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    <Button size="sm" onClick={() => setShowChargeModal(true)} variant="default" disabled={!caso?.cliente_id} className="rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-sm disabled:opacity-60 disabled:pointer-events-none">
                      <CreditCard className="h-4 w-4 mr-1" /> Pago
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => onGenerateResolution(caso.id)} variant="outline" className="rounded-xl border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
                      <Bot className="h-4 w-4 mr-1" /> IA
                    </Button>
                    <Button size="sm" onClick={() => setShowUploadModal(true)} variant="outline" className="rounded-xl">
                      <Upload className="h-4 w-4 mr-1" /> Documento
                    </Button>
                    <Button size="sm" onClick={() => onSendMessage(caso.id)} variant="outline" className="rounded-xl">
                      <MessageSquare className="h-4 w-4 mr-1" /> Mensaje
                    </Button>
                    {canCloseCase() && (
                      <Button size="sm" onClick={handleCerrarCaso} variant="destructive" disabled={isClosing} className="rounded-xl">
                        <ShieldCheck className="h-4 w-4 mr-1" /> {isClosing ? 'Cerrando...' : 'Cerrar'}
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Móvil: 2 primarias + menú Más */}
                <div className="md:hidden flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => setShowEditModal(true)} className="rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-sm">
                      <User className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              size="sm"
                              onClick={() => setShowChargeModal(true)}
                              className="rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-sm disabled:opacity-60 disabled:pointer-events-auto"
                              disabled={!caso?.cliente_id}
                            >
                              <CreditCard className="h-4 w-4 mr-1" /> Pago
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {!caso?.cliente_id && (
                          <TooltipContent>Vincula el caso a un cliente para solicitar pago</TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="rounded-xl">
                        <MoreHorizontal className="h-4 w-4 mr-1" /> Más
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60 p-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 shadow-lg">
                      <DropdownMenuItem onClick={() => onGenerateResolution(caso.id)} className="flex items-center gap-2 text-sm font-medium rounded-lg hover:bg-blue-50 hover:text-blue-900 dark:hover:bg-blue-900/30 dark:hover:text-blue-200 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-900 dark:data-[highlighted]:bg-blue-900/30 dark:data-[highlighted]:text-blue-200">
                        <Bot className="h-4 w-4 mr-1 text-purple-600" /> Generar con IA
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 text-sm font-medium rounded-lg hover:bg-blue-50 hover:text-blue-900 dark:hover:bg-blue-900/30 dark:hover:text-blue-200 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-900 dark:data-[highlighted]:bg-blue-900/30 dark:data-[highlighted]:text-blue-200">
                        <Upload className="h-4 w-4 mr-1 text-blue-600" /> Subir Documento
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSendMessage(caso.id)} className="flex items-center gap-2 text-sm font-medium rounded-lg hover:bg-blue-50 hover:text-blue-900 dark:hover:bg-blue-900/30 dark:hover:text-blue-200 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-900 dark:data-[highlighted]:bg-blue-900/30 dark:data-[highlighted]:text-blue-200">
                        <MessageSquare className="h-4 w-4 mr-1 text-emerald-600" /> Enviar Mensaje
                      </DropdownMenuItem>
                      {canCloseCase() && (
                        <DropdownMenuItem onClick={handleCerrarCaso} disabled={isClosing} className="flex items-center gap-2 text-sm font-medium rounded-lg hover:bg-rose-50 hover:text-rose-900 dark:hover:bg-rose-900/30 dark:hover:text-rose-200 data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-900 dark:data-[highlighted]:bg-rose-900/30 dark:data-[highlighted]:text-rose-200">
                          <ShieldCheck className="h-4 w-4 mr-1 text-rose-600" /> {isClosing ? 'Cerrando...' : 'Cerrar'}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Solicitar Pago (ad-hoc) */}
      <Dialog open={showChargeModal} onOpenChange={setShowChargeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="concepto">Concepto</Label>
              <Input id="concepto" value={chargeConcept} onChange={(e) => setChargeConcept(e.target.value)} placeholder="Ej. Honorarios adicionales" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monto">Importe base (EUR)</Label>
              <Input id="monto" type="number" inputMode="decimal" step="0.01" min="0.01" value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value)} placeholder="0.00" />
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
            <Button variant="outline" onClick={() => setShowChargeModal(false)} disabled={creatingCharge}>Cancelar</Button>
            <Button
              onClick={async () => {
                if (!caso?.id) return;
                const concepto = chargeConcept.trim();
                const montoBase = Number(chargeAmount);
                if (!concepto || !isFinite(montoBase) || montoBase <= 0) {
                  toast({ title: 'Datos inválidos', description: 'Ingresa un concepto y un monto válido (> 0).', variant: 'destructive' });
                  return;
                }
                try {
                  setCreatingCharge(true);
                  const session = await supabase.auth.getSession();
                  const token = session.data.session?.access_token;
                  const { data, error } = await supabase.functions.invoke('crear-cobro', {
                    body: {
                      caso_id: caso.id,
                      concepto,
                      monto_base: Math.round(montoBase * 100) / 100,
                      exencion_tipo: chargeExencion,
                    },
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                  });
                  if (error) throw new Error(error.message);
                  toast({ title: 'Cobro solicitado', description: 'Se ha creado el cobro para el cliente.' });
                  setShowChargeModal(false);
                  setChargeConcept(''); setChargeAmount(''); setChargeExencion('none');
                } catch (e: any) {
                  console.error('Error creando cobro:', e);
                  toast({ title: 'Error', description: e?.message || 'No se pudo crear el cobro.', variant: 'destructive' });
                } finally {
                  setCreatingCharge(false);
                }
              }}
              disabled={creatingCharge}
            >
              {creatingCharge ? 'Creando...' : 'Crear cobro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        casoId={caso?.id || ''}
        onUploadSuccess={handleUploadSuccess}
      />

      <ClientDocumentUploadModal
        isOpen={showClientUploadModal}
        onClose={() => setShowClientUploadModal(false)}
        casoId={caso?.id || ''}
        onUploadSuccess={handleClientUploadSuccess}
      />

      <DocumentViewer
        isOpen={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        document={selectedDocument}
      />

      <CaseEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        caso={caso}
        onSave={handleEditSuccess}
      />
    </>
  );
};

export default LawyerCaseDetailModal; 