import React, { useState } from 'react';
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
  Trash2
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
import DocumentViewer from '@/components/DocumentViewer';
import DocumentUploadModal from '@/components/DocumentUploadModal';
import { useToast } from '@/hooks/use-toast';

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
    especialidades?: { nombre: string };
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
  const [loadingDocument, setLoadingDocument] = useState(false);
  const { toast } = useToast();

  const { 
    documentosResolucion, 
    loading: loadingDocs, 
    downloadDocument, 
    deleteDocument,
    getSignedUrl,
    refetch: refetchDocuments 
  } = useDocumentManagement(caso?.id);

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
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
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

  const handleViewClientDocument = (doc: any) => {
    if (doc.url) {
      setSelectedDocument({
        name: doc.nombre || doc.name || 'Documento del cliente',
        url: doc.url,
        type: doc.tipo || doc.type,
        size: doc.tamaño || doc.size
      });
    }
  };

  const handleViewResolutionDocument = async (doc: any) => {
    setLoadingDocument(true);
    try {
      console.log('Intentando ver documento:', doc);
      
      const signedUrl = await getSignedUrl(doc);
      console.log('URL firmada obtenida:', signedUrl);
      
      if (signedUrl) {
        setSelectedDocument({
          name: doc.nombre_archivo,
          url: signedUrl,
          type: doc.tipo_documento,
          size: doc.tamaño_archivo
        });
      } else {
        console.error('No se pudo generar la URL firmada');
        toast({
          title: "Error",
          description: "No se pudo generar la URL para visualizar el documento",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error al obtener URL firmada:', error);
      toast({
        title: "Error",
        description: "Error al cargar el documento",
        variant: "destructive"
      });
    } finally {
      setLoadingDocument(false);
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

  const handleUploadSuccess = () => {
    refetchDocuments();
    setShowUploadModal(false);
    toast({
      title: "Éxito",
      description: "Documento subido correctamente",
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalle del Caso #{caso.id.substring(0, 8)}
              {getStatusBadge(caso.estado)}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="flex-1">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="client">Cliente</TabsTrigger>
              <TabsTrigger value="chat">Conversación</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[60vh] mt-4">
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Información del Caso</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Motivo de consulta:</p>
                        <p className="text-sm">{caso.motivo_consulta}</p>
                      </div>
                      
                      {caso.resumen_caso && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Resumen del caso:</p>
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm">
                            {caso.resumen_caso}
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
                            <Euro className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-700 dark:text-green-400">
                              Valor estimado: {caso.valor_estimado}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Estado y Asignación</CardTitle>
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
                            <div key={idx} className="bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-green-600" />
                                <span className="font-medium">
                                  {asignacion.profiles?.nombre} {asignacion.profiles?.apellido}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Asignado el {format(new Date(asignacion.fecha_asignacion), 'dd/MM/yyyy', { locale: es })}
                              </p>
                              {asignacion.notas_asignacion && (
                                <p className="text-xs mt-1">{asignacion.notas_asignacion}</p>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {caso.guia_abogado && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Guía para el Abogado</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                          <p className="text-sm whitespace-pre-wrap">{caso.guia_abogado}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {caso.propuesta_estructurada && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Propuesta del Cliente</CardTitle>
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
                </div>
              </TabsContent>

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

              <TabsContent value="documents" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Documentos del Cliente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {caso.documentos_adjuntos ? (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground mb-2">Documentos adjuntos por el cliente:</p>
                          <div className="space-y-2">
                            {Array.isArray(caso.documentos_adjuntos) ? (
                              caso.documentos_adjuntos.map((doc: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm flex-1 cursor-pointer" onClick={() => handleViewClientDocument(doc)}>
                                    {doc.nombre || doc.name || `Documento ${idx + 1}`}
                                  </span>
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
                                    onClick={() => {
                                      const link = window.document.createElement('a');
                                      link.href = doc.url;
                                      link.download = doc.nombre || doc.name || `documento_${idx + 1}`;
                                      link.click();
                                    }}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto">
                                {JSON.stringify(caso.documentos_adjuntos, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No hay documentos del cliente</p>
                        </div>
                      )}
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
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
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
                                disabled={loadingDocument}
                              >
                                {loadingDocument ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
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
            </ScrollArea>
          </Tabs>

          {/* Action buttons */}
          {caso.estado !== 'cerrado' && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-2 pt-4">
                <Button
                  onClick={() => onAssignLawyer(caso.id)}
                  variant="default"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Asignar Abogado
                </Button>
                
                <Button
                  onClick={() => onGenerateResolution(caso.id)}
                  variant="outline"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Generar Resolución IA
                </Button>
                
                <Button
                  onClick={() => setShowUploadModal(true)}
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Documento
                </Button>
                
                <Button
                  onClick={() => onSendMessage(caso.id)}
                  variant="outline"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar Mensaje
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal */}
      <DocumentViewer
        isOpen={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        document={selectedDocument}
      />

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        casoId={caso.id}
        onUploadSuccess={handleUploadSuccess}
      />
    </>
  );
};

export default CaseDetailModal;
