import React, { useState, useEffect } from 'react';
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
  UserPlus,
  Eye,
  Building,
  Trash2,
  AlertCircle,
  ShieldCheck
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
import { useDocumentManagement } from '@/hooks/useDocumentManagement';
import { useClientDocumentManagement } from '@/hooks/useClientDocumentManagement';
import DocumentViewer from '@/components/DocumentViewer';
import DocumentUploadModal from '@/components/DocumentUploadModal';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ClientDocumentUploadModal from './ClientDocumentUploadModal';
import CaseEditModal from './CaseEditModal';

interface CaseDetailModalProps {
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
  onAssignLawyer: (casoId: string) => void;
  onGenerateResolution: (casoId: string) => void;
  onUploadDocument: (casoId: string) => void;
  onSendMessage: (casoId: string) => void;
}

const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  caso,
  isOpen,
  onClose,
  onAssignLawyer,
  onGenerateResolution,
  onUploadDocument,
  onSendMessage
}) => {
  const [messageText, setMessageText] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<{name: string; url: string; type?: string; size?: number} | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showClientUploadModal, setShowClientUploadModal] = useState(false);
  const [userRole, setUserRole] = useState<'cliente' | 'abogado' | null>(null);
  const [lawyerType, setLawyerType] = useState<string | null>(null);
  const [isAssignedLawyer, setIsAssignedLawyer] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);

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

  // Agregar el estado para el botón de cerrar
  const [isClosing, setIsClosing] = useState(false);

  // Verificar rol y tipo de abogado
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, tipo_abogado')
        .eq('id', user.id)
        .single();
      
      setUserRole(profile?.role || null);
      setLawyerType(profile?.tipo_abogado || null);

      // Verificar si el abogado está asignado al caso
      if (profile?.role === 'abogado' && caso) {
        const { data: asignacion } = await supabase
          .from('asignaciones_casos')
          .select('estado_asignacion')
          .eq('caso_id', caso.id)
          .eq('abogado_id', user.id)
          .eq('estado_asignacion', 'activa')
          .single();
        
        setIsAssignedLawyer(!!asignacion);
      }
    };

    fetchUserRole();
  }, [user, caso]);

  if (!caso) return null;

  // Convertir a zona horaria de España
  const spainTimeZone = 'Europe/Madrid';
  const casoDate = toZonedTime(new Date(caso.created_at), spainTimeZone);

  const clientData = caso.profiles || {
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
    } else {
      toast({
        title: "Error",
        description: result.error || "Error al eliminar el documento",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClientDocument = async (docId: string) => {
    if (!isSuperAdmin) {
      toast({
        title: "Error",
        description: "No tienes permisos para eliminar documentos del cliente",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm('¿Estás seguro de que quieres eliminar este documento del cliente?')) {
      try {
        // Usar el hook de client document management para eliminar
        const result = await deleteClientDocument(docId);
        if (result.success) {
          toast({
            title: "Éxito",
            description: "Documento del cliente eliminado correctamente",
          });
          // Refetch client documents
          if (refetchClientDocuments) {
            refetchClientDocuments();
          }
        } else {
          toast({
            title: "Error",
            description: result.error || "Error al eliminar el documento",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error deleting client document:', error);
        toast({
          title: "Error",
          description: "Error al eliminar el documento del cliente",
          variant: "destructive",
        });
      }
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
    // Refetch client documents
    if (refetchClientDocuments) {
      refetchClientDocuments();
    }
    setShowClientUploadModal(false);
    toast({
      title: "Éxito",
      description: "Documento del cliente subido correctamente",
    });
  };

  const isSuperAdmin = userRole === 'abogado' && lawyerType === 'super_admin';

  // Función para cerrar el caso usando la función segura
  const handleCerrarCaso = async () => {
    if (!caso || !user) return;
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
          title: 'Caso cerrado',
          description: data.data.mensaje || 'El caso ha sido cerrado exitosamente.',
        });
        onClose(); // Cerrar el modal
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error: any) {
      console.error('Error cerrando caso:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cerrar el caso',
        variant: 'destructive',
      });
    } finally {
      setIsClosing(false);
    }
  };

  const handleEditSuccess = () => {
    // Recargar los datos del caso
    // Esto se puede implementar con un callback o recargando la página
    window.location.reload();
  };

  // Determinar si el usuario puede cerrar el caso
  const canCloseCase = () => {
    if (!user || !caso) return false;
    
    // No se puede cerrar si ya está cerrado
    if (caso.estado === 'cerrado') return false;
    
    // Super admin puede cerrar cualquier caso
    if (userRole === 'abogado' && lawyerType === 'super_admin') return true;
    
    // Abogado regular puede cerrar casos asignados
    if (userRole === 'abogado' && lawyerType === 'regular' && isAssignedLawyer) return true;
    
    return false;
  };

  // Determinar si el usuario puede subir documentos del cliente
  const canUploadClientDocuments = () => {
    if (!user || !caso) return false;
    
    // Super admin puede subir documentos del cliente a cualquier caso
    if (userRole === 'abogado' && lawyerType === 'super_admin') return true;
    
    // Abogado regular puede subir documentos del cliente solo a casos asignados
    if (userRole === 'abogado' && lawyerType === 'regular' && isAssignedLawyer) return true;
    
    return false;
  };

  // Determinar si el usuario puede eliminar documentos del cliente
  const canDeleteClientDocuments = () => {
    if (!user || !caso) return false;
    
    // Super admin puede eliminar documentos del cliente de cualquier caso
    if (userRole === 'abogado' && lawyerType === 'super_admin') return true;
    
    // Abogado regular puede eliminar documentos del cliente solo de casos asignados
    if (userRole === 'abogado' && lawyerType === 'regular' && isAssignedLawyer) return true;
    
    return false;
  };

  // Función para verificar si el usuario actual es el abogado asignado específico
  const isCurrentUserAssigned = (asignacion: any) => {
    return user && asignacion.abogado_id === user.id;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalle del Caso #{caso.id.substring(0, 8)}
              {getStatusBadge(caso.estado)}
            </DialogTitle>
          </DialogHeader>

          {/* ÁREA SCROLLABLE: todo el contenido relevante, incluyendo tabs y guía */}
          <ScrollArea className="flex-1 px-6 py-4 h-[calc(90vh-110px)] min-h-0">
            <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
              {/* Barra de tabs sticky con iconos y mejor color */}
              <div className="sticky top-0 z-10 bg-background pb-2">
                <TabsList className="flex w-full rounded-lg shadow-sm border mb-2 overflow-x-auto no-scrollbar flex-nowrap">
                  <TabsTrigger value="overview" className="flex items-center gap-1 px-4 py-2 min-w-[150px] flex-shrink-0 whitespace-nowrap">
                    <FileText className="h-4 w-4" /> Resumen
                  </TabsTrigger>
                  {userRole === 'abogado' && caso.guia_abogado && (
                    <TabsTrigger value="guia" className="flex items-center gap-1 px-4 py-2 min-w-[150px] flex-shrink-0 whitespace-nowrap">
                      <ShieldCheck className="h-4 w-4" /> Guía Abogado
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="client" className="flex items-center gap-1 px-4 py-2 min-w-[150px] flex-shrink-0 whitespace-nowrap">
                    <User className="h-4 w-4" /> Cliente
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex items-center gap-1 px-4 py-2 min-w-[150px] flex-shrink-0 whitespace-nowrap">
                    <MessageSquare className="h-4 w-4" /> Conversación
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="flex items-center gap-1 px-4 py-2 min-w-[150px] flex-shrink-0 whitespace-nowrap">
                    <FileText className="h-4 w-4" /> Documentos
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="space-y-4 mt-0">
                {/* Información del Caso (Resumen) ocupa todo el ancho y altura aumentada */}
                <Card className="shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-blue-900 dark:text-blue-200">Información del Caso</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Motivo de consulta:</p>
                      <p className="text-base">{caso.motivo_consulta}</p>
                    </div>
                    {caso.resumen_caso && (
                      <div>
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Resumen del caso:</p>
                        <div className="prose prose-slate bg-blue-50 max-w-none dark:prose-invert dark:bg-blue-950 p-5 rounded text-sm border border-blue-200 dark:border-blue-700 overflow-hidden">
                          <ScrollArea className="h-96">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {caso.resumen_caso}
                            </ReactMarkdown>
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
                      {userRole === 'abogado' && caso.valor_estimado && (
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
                {/* Estado y Asignación debajo del resumen */}
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
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Asignado el {format(new Date(asignacion.fecha_asignacion), 'dd/MM/yyyy', { locale: es })}
                            </p>
                            {asignacion.notas_asignacion && (
                              <div className={`mt-3 p-3 rounded-md border ${
                                isCurrentUserAssigned(asignacion) 
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 shadow-md' 
                                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
                              }`}>
                                <div className="flex items-start gap-2">
                                  <MessageSquare className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                                    isCurrentUserAssigned(asignacion)
                                      ? 'text-blue-600 dark:text-blue-400'
                                      : 'text-yellow-600 dark:text-yellow-400'
                                  }`} />
                                  <div className="flex-1">
                                    <p className={`text-xs font-medium mb-1 ${
                                      isCurrentUserAssigned(asignacion)
                                        ? 'text-blue-800 dark:text-blue-200'
                                        : 'text-yellow-800 dark:text-yellow-200'
                                    }`}>
                                      {isCurrentUserAssigned(asignacion) ? '📝 Nota para ti:' : 'Nota de Asignación:'}
                                    </p>
                                    <p className={`text-xs whitespace-pre-wrap ${
                                      isCurrentUserAssigned(asignacion)
                                        ? 'text-blue-700 dark:text-blue-300'
                                        : 'text-yellow-700 dark:text-yellow-300'
                                    }`}>
                                      {asignacion.notas_asignacion}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
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

              {/* Propuesta del Cliente (si existe) - solo visible para abogados */}
              {userRole === 'abogado' && caso.propuesta_estructurada && (
                  <Card className="shadow border border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-950">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold text-blue-900 dark:text-blue-200">Propuesta del Cliente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-32">
                        <div className="text-sm">
                          {typeof caso.propuesta_estructurada === 'string' ? (
                            <p className="whitespace-pre-wrap">{caso.propuesta_estructurada}</p>
                          ) : (
                            <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto">
                              {JSON.stringify(caso.propuesta_estructurada, null, 2)}
                            </pre>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

              {userRole === 'abogado' && caso.guia_abogado && (
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

              <TabsContent value="client" className="space-y-4">
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

              <TabsContent value="chat" className="space-y-4">
                {/* Solo mostrar transcripción para abogados */}
                {userRole === 'abogado' ? (
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
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Conversación</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>La transcripción de la conversación solo está disponible para abogados</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          Documentos del Cliente
                        </div>
                        {/* Botón para super admin y abogados asignados subir documentos del cliente */}
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
                                {/* Super admin y abogados asignados pueden eliminar documentos del cliente */}
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
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        Documentos de Resolución
                        <Button
                          onClick={() => setShowUploadModal(true)}
                          variant="outline"
                          size="sm"
                        >
                          <Upload className="h-4 w-4 mr-1" />
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
                          documentosResolucion.map((doc) => (
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
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No hay documentos de resolución</p>
                            <p className="text-xs">Sube el primer documento usando el botón de arriba</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>

        {/* BOTONES DE ACCIÓN - compactos y siempre visibles */}
        {caso.estado !== 'cerrado' && (
          <div className="border-t bg-background">
            <Separator />
            <div className="flex flex-col gap-2 p-2">
              {/* Primera fila: Acciones principales de gestión */}
              <div className="flex flex-col sm:flex-row gap-2">
                {isSuperAdmin && (
                  <Button 
                    className="w-full sm:w-auto"
                    size="sm"
                    onClick={() => onAssignLawyer(caso.id)}
                    variant="default"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Asignar Abogado
                  </Button>
                )}
                {(isSuperAdmin || (caso.asignaciones_casos && caso.asignaciones_casos.some(asignacion => 
                  asignacion.abogado_id === user?.id && asignacion.estado_asignacion === 'activa'
                ))) && (
                  <Button
                    className="w-full sm:w-auto"
                    size="sm"
                    onClick={() => setShowEditModal(true)}
                    variant="outline"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Editar Caso
                  </Button>
                )}
              </div>
              {/* Segunda fila: Herramientas y acciones de trabajo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <Button 
                  className="w-full"
                  size="sm"
                  onClick={() => onGenerateResolution(caso.id)} 
                  variant="outline"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Generar Resolución IA
                </Button>
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => setShowUploadModal(true)}
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Documento
                </Button>
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => onSendMessage(caso.id)}
                  variant="outline"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar Mensaje
                </Button>
                {canCloseCase() && (
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={handleCerrarCaso}
                    variant="destructive"
                    disabled={isClosing}
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    {isClosing ? 'Cerrando...' : 'Cerrar Caso'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Case Edit Modal */}
    <CaseEditModal
      caso={caso}
      isOpen={showEditModal}
      onClose={() => setShowEditModal(false)}
      onSave={handleEditSuccess}
    />

    {/* Document Viewer Modal */}
    <DocumentViewer
      isOpen={!!selectedDocument}
      onClose={() => setSelectedDocument(null)}
      document={selectedDocument}
    />

    {/* Document Upload Modal (para documentos de resolución) */}
    <DocumentUploadModal
      isOpen={showUploadModal}
      onClose={() => setShowUploadModal(false)}
      casoId={caso.id}
      onUploadSuccess={handleUploadSuccess}
    />

    {/* Client Document Upload Modal (para super admin) */}
    <ClientDocumentUploadModal
      isOpen={showClientUploadModal}
      onClose={() => setShowClientUploadModal(false)}
      casoId={caso.id}
      onUploadSuccess={handleClientUploadSuccess}
    />
  </>
);
};

export default CaseDetailModal;
