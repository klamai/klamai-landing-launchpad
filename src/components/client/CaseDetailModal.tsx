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
  MessageSquare,
  Eye,
  Download,
  PenTool,
  Shield,
  Building,
  Scale,
  Euro,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
  Plus
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { useClientDocumentManagement } from '@/hooks/client/useClientDocumentManagement';
import { useLawyerDocuments } from '@/hooks/client/useLawyerDocuments';
import DocumentViewer from '@/components/shared/DocumentViewer';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import CaseNotesSection from '@/components/shared/CaseNotesSection';
import { useNotificacionesNoLeidas } from '@/hooks/useNotificacionesNoLeidas';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CustomDocumensoEmbed from '@/components/shared/CustomDocumensoEmbed';
import ClientDocumentUploadModal from './ClientDocumentUploadModal';
import DocumentListItem from '@/components/shared/DocumentListItem';

interface ClientCaseDetailModalProps {
  caso: {
    id: string;
    motivo_consulta: string;
    resumen_caso?: string;
    estado: string;
    created_at: string;
    valor_estimado?: string;
    tipo_lead?: string;
    nombre_borrador?: string;
    apellido_borrador?: string;
    email_borrador?: string;
    telefono_borrador?: string;
    ciudad_borrador?: string;
    especialidades?: { id: number; nombre: string };
    hoja_encargo_token?: string; // Token para hoja de encargo
    profiles?: { 
      nombre: string; 
      apellido: string; 
      email: string;
      telefono?: string;
      ciudad?: string;
    };
    asignaciones_casos?: Array<{
      abogado_id: string;
      estado_asignacion: string;
      fecha_asignacion: string;
      notas_asignacion?: string;
      profiles: { nombre: string; apellido: string; email: string };
    }>;
    cliente_id?: string; // Added for client_id
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

const ClientCaseDetailModal: React.FC<ClientCaseDetailModalProps> = ({
  caso,
  isOpen,
  onClose
}) => {
  const [selectedDocument, setSelectedDocument] = useState<{name: string; url: string; type?: string; size?: number} | null>(null);
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { count: notificacionesNoLeidas } = useNotificacionesNoLeidas();

  const { 
    documentosCliente,
    loading: loadingClientDocs,
    downloadDocument: downloadClientDocument,
    getSignedUrl: getClientSignedUrl,
    refetch
  } = useClientDocumentManagement(caso?.id);

  // Pagos del caso
  const [pagos, setPagos] = useState<any[]>([]);
  useEffect(() => {
    const load = async () => {
      if (!caso?.id || !user) return;
      const { data } = await supabase
        .from('pagos')
        .select('*')
        .eq('caso_id', caso.id)
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });
      setPagos(data || []);
    };
    load();
  }, [caso?.id, user]);

  const handlePagarCobro = async (pagoId: string) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const { data, error } = await supabase.functions.invoke('pagar-cobro', {
        body: { pago_id: pagoId },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (error) throw new Error(error.message);
      if (data?.url) {
        window.location.href = data.url as string;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (e: any) {
      console.error('Error iniciando pago de cobro:', e);
      toast({ title: 'Error en el pago', description: e?.message || 'Inténtalo de nuevo.', variant: 'destructive' });
    }
  };

  // Obtener documentos del abogado
  const {
    data: documentosAbogado = [],
    isLoading: loadingLawyerDocs,
    error: lawyerDocsError
  } = useLawyerDocuments(caso?.id || '');

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

  // Verificar que el usuario es el propietario del caso usando campos del borrador
  useEffect(() => {
    if (caso && user) {
      // Validación por ID: verificar si el cliente_id del caso coincide con el user.id
      if (caso.cliente_id && user.id && caso.cliente_id !== user.id) {
        console.error('Acceso denegado: usuario no es propietario del caso');
        toast({
          title: 'Error',
          description: 'No tienes permisos para ver este caso',
          variant: 'destructive',
        });
        onClose();
      }
    }
  }, [caso, user, onClose, toast]);

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

  const handleViewLawyerDocument = async (doc: any) => {
    try {
      // Obtener URL firmada para el documento del abogado
      const { data, error } = await supabase.storage
        .from('documentos_legales')
        .createSignedUrl(doc.ruta_archivo, 3600); // 1 hora

      if (error) throw error;

      if (data?.signedUrl) {
        setSelectedDocument({
          name: doc.nombre_archivo,
          url: data.signedUrl,
          type: doc.tipo_documento,
          size: doc.tamaño_archivo
        });
      } else {
        throw new Error('No se pudo generar la URL');
      }
    } catch (error) {
      console.error('Error al obtener URL del documento del abogado:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la URL para visualizar el documento",
        variant: "destructive"
      });
    }
  };

  const downloadLawyerDocument = async (doc: any) => {
    try {
      // Obtener URL firmada para descarga
      const { data, error } = await supabase.storage
        .from('documentos_legales')
        .createSignedUrl(doc.ruta_archivo, 3600); // 1 hora

      if (error) throw error;

      if (data?.signedUrl) {
        // Crear enlace de descarga
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = doc.nombre_archivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Descarga iniciada",
          description: `Descargando ${doc.nombre_archivo}`,
        });
      } else {
        throw new Error('No se pudo generar la URL de descarga');
      }
    } catch (error) {
      console.error('Error al descargar documento del abogado:', error);
      toast({
        title: "Error",
        description: "No se pudo descargar el documento",
        variant: "destructive"
      });
    }
  };

  const handleUploadSuccess = () => {
    // Refetch documentos del cliente
    if (caso?.id) {
      refetch();
    }
    setIsUploadModalOpen(false);
    toast({
      title: "Documento subido",
      description: "El documento se ha subido correctamente",
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl w-full h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalle del Caso #{caso.id.substring(0, 8)}
              {getStatusBadge(caso.estado)}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0">
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
                        <TabsTrigger value="client" className="flex items-center gap-1 px-3 py-2 flex-1 min-w-[80px] max-w-[100px] md:flex-none md:min-w-[100px] md:max-w-[120px] flex-shrink-0 whitespace-nowrap text-xs">
                          <User className="h-3 w-3" /> Cliente
                        </TabsTrigger>
                        <TabsTrigger value="documents" className="flex items-center gap-1 px-3 py-2 flex-1 min-w-[100px] max-w-[120px] md:flex-none md:min-w-[120px] md:max-w-[140px] flex-shrink-0 whitespace-nowrap text-xs">
                          <FileText className="h-3 w-3" /> Mis Docs
                        </TabsTrigger>
                        <TabsTrigger value="lawyer-documents" className="flex items-center gap-1 px-3 py-2 flex-1 min-w-[120px] max-w-[140px] md:flex-none md:min-w-[140px] md:max-w-[160px] flex-shrink-0 whitespace-nowrap text-xs">
                          <User className="h-3 w-3" /> Docs Abog
                        </TabsTrigger>
                        <TabsTrigger value="pagos" className="flex items-center gap-1 px-3 py-2 flex-1 min-w-[100px] max-w-[120px] md:flex-none md:min-w-[120px] md:max-w-[140px] flex-shrink-0 whitespace-nowrap text-xs">
                          <Euro className="h-3 w-3" /> Pagos
                        </TabsTrigger>
                        <TabsTrigger value="hoja-encargo" className="flex items-center gap-1 px-3 py-2 flex-1 min-w-[100px] max-w-[120px] md:flex-none md:min-w-[120px] md:max-w-[140px] flex-shrink-0 whitespace-nowrap text-xs">
                          <Shield className="h-3 w-3" /> Hoja Enc
                        </TabsTrigger>
                        <TabsTrigger value="interacciones" className="relative flex-1 min-w-[90px] max-w-[110px] md:flex-none md:min-w-[110px] md:max-w-[130px] flex-shrink-0 whitespace-nowrap text-xs px-3 py-2">
                          Interacc
                          {notificacionesNoLeidas > 0 && (
                            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full border border-white dark:border-gray-800"></span>
                          )}
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
              <div className="flex-1 min-h-0 overflow-hidden" style={{ height: 'calc(100vh - 320px)' }}>
                <div className="h-full overflow-y-auto px-6 py-4">
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
                              <span className="font-medium text-blue-700 dark:text-blue-400">
                                Valor estimado: {caso.valor_estimado}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

        <TabsContent value="pagos" className="space-y-4 mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Euro className="h-5 w-5" /> Pagos del Caso
              </CardTitle>
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
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagos.map((pago) => {
                      const amount = typeof pago.monto_total === 'number' ? pago.monto_total : (typeof pago.monto === 'number' ? pago.monto : 0);
                      const estado = pago.estado || 'pending';
                      const isPending = estado === 'pending' || estado === 'processing';
                      return (
                        <TableRow key={pago.id}>
                          <TableCell>{new Date(pago.created_at).toLocaleDateString('es-ES')}</TableCell>
                          <TableCell>{pago.concepto || pago.descripcion || '—'}</TableCell>
                          <TableCell>€{Number(amount).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={estado === 'succeeded' ? 'default' : 'secondary'}>
                              {estado === 'succeeded' ? 'Completado' : 'Pendiente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {isPending && (
                              <Button size="sm" onClick={() => handlePagarCobro(pago.id)}>
                                Pagar ahora
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Euro className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay pagos registrados para este caso</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

                  <TabsContent value="client" className="space-y-4 mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Información del Cliente
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Nombre:</p>
                            <p className="text-sm">{caso.nombre_borrador} {caso.apellido_borrador}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Email:</p>
                            <p className="text-sm">{caso.email_borrador}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Teléfono:</p>
                            <p className="text-sm">{caso.telefono_borrador || 'No especificado'}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Ciudad:</p>
                            <p className="text-sm">{caso.ciudad_borrador || 'No especificada'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="documents" className="space-y-4 mt-0">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Mis Documentos
                            {documentosCliente.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {documentosCliente.length} documento{documentosCliente.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </CardTitle>
                          <Button
                            onClick={() => setIsUploadModalOpen(true)}
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            Subir Documento
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {loadingClientDocs ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Cargando documentos...</p>
                          </div>
                        ) : documentosCliente.length > 0 ? (
                          <div className="space-y-2">
                            {documentosCliente.map((doc) => (
                              <DocumentListItem
                                key={doc.id}
                                doc={doc as any}
                                variant="cliente"
                                onView={handleViewClientDocument}
                                onDownload={downloadClientDocument}
                                onDelete={() => {}} // El cliente no puede borrar sus propios documentos desde aquí
                                showDelete={false}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No hay documentos disponibles</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="lawyer-documents" className="space-y-4 mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Documentos del Abogado
                          {documentosAbogado.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {documentosAbogado.length} documento{documentosAbogado.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {loadingLawyerDocs ? (
                          <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                <div className="flex-1">
                                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                                  <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded animate-pulse w-24" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : lawyerDocsError ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm mb-2">Error al cargar documentos</p>
                            <p className="text-xs">
                              {lawyerDocsError.message}
                            </p>
                          </div>
                        ) : documentosAbogado.length > 0 ? (
                          <div className="space-y-3">
                            {documentosAbogado.map((doc) => (
                              <DocumentListItem
                                key={doc.id}
                                doc={doc as any}
                                variant="abogado"
                                onView={handleViewLawyerDocument}
                                onDownload={downloadLawyerDocument}
                                onDelete={() => {}} // El cliente no puede borrar documentos del abogado
                                showDelete={false}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm mb-2">No hay documentos del abogado disponibles</p>
                            <p className="text-xs">
                              Los documentos que suba tu abogado aparecerán aquí.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="hoja-encargo" className="space-y-4 mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Hoja de Encargo
                          {caso?.hoja_encargo_token && (
                            <Badge variant="secondary" className="text-xs">
                              Documento disponible
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {caso?.hoja_encargo_token ? (
                          <div className="space-y-4">
                            <div className="min-h-[500px] w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                              <CustomDocumensoEmbed
                                token={caso.hoja_encargo_token}
                                height="500px"
                                width="100%"
                                title="Hoja de Encargo"
                              />
                            </div>
                            
                            <div className="text-xs text-muted-foreground text-center">
                              <p>Documento seguro para firma digital</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm mb-2">No hay hoja de encargo disponible</p>
                            <p className="text-xs">
                              El administrador puede crear una hoja de encargo cuando sea necesario.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="interacciones" className="space-y-4 mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Interacciones</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Las interacciones están disponibles en la pestaña de Notas</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="notes" className="space-y-4 mt-0">
                    {caso?.id && <CaseNotesSection casoId={caso.id} onlyForClient={true} />}
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          </div>
        </DialogContent>

        {/* Modal de subida de documentos */}
        {caso && (
          <ClientDocumentUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            casoId={caso.id}
            onUploadSuccess={handleUploadSuccess}
          />
        )}
      </Dialog>

      <DocumentViewer
        isOpen={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        document={selectedDocument}
      />
    </>
  );
};

export default ClientCaseDetailModal; 