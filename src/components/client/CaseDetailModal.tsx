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
  MessageSquare,
  Eye,
  Download
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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { useClientDocumentManagement } from '@/hooks/client/useClientDocumentManagement';
import DocumentViewer from '@/components/DocumentViewer';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import CaseNotesSection from '@/components/CaseNotesSection';
import { useNotificacionesNoLeidas } from '@/hooks/useNotificacionesNoLeidas';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const { toast } = useToast();
  const { user } = useAuth();
  const { count: notificacionesNoLeidas } = useNotificacionesNoLeidas();

  const {
    documentosCliente,
    loading: loadingClientDocs,
    downloadDocument: downloadClientDocument,
    getSignedUrl: getClientSignedUrl,
    refetch: refetchClientDocuments
  } = useClientDocumentManagement(caso?.id);

  // Verificar que el usuario es el propietario del caso
  useEffect(() => {
    if (caso && user && caso.profiles?.email !== user.email) {
      console.error('Acceso denegado: usuario no es propietario del caso');
      toast({
        title: 'Error',
        description: 'No tienes permisos para ver este caso',
        variant: 'destructive',
      });
      onClose();
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

          <ScrollArea className="flex-1 px-6 py-4 h-[calc(90vh-110px)] min-h-0">
            <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
              <div className="sticky top-0 z-10 bg-background pb-2">
                <TabsList className="flex w-full rounded-lg shadow-sm border mb-2 overflow-x-auto no-scrollbar flex-nowrap">
                  <TabsTrigger value="overview" className="flex items-center gap-1 px-4 py-2 min-w-[150px] flex-shrink-0 whitespace-nowrap">
                    <FileText className="h-4 w-4" /> Resumen
                  </TabsTrigger>
                  <TabsTrigger value="client" className="flex items-center gap-1 px-4 py-2 min-w-[150px] flex-shrink-0 whitespace-nowrap">
                    <User className="h-4 w-4" /> Cliente
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="flex items-center gap-1 px-4 py-2 min-w-[150px] flex-shrink-0 whitespace-nowrap">
                    <FileText className="h-4 w-4" /> Documentos
                  </TabsTrigger>
                  <TabsTrigger value="interacciones" className="relative min-w-[150px] flex-shrink-0 whitespace-nowrap">
                    Interacciones
                    {notificacionesNoLeidas > 0 && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full border border-white dark:border-gray-800"></span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="flex items-center gap-1 px-4 py-2 min-w-[150px] flex-shrink-0 whitespace-nowrap">
                    <MessageSquare className="h-4 w-4" /> Notas
                  </TabsTrigger>
                </TabsList>
              </div>

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
                          <span className="text-sm text-gray-600 dark:text-gray-400">Sin asignar</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                        <p className="text-sm">{caso.nombre_borrador} {caso.apellido_borrador}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email:</p>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">{caso.email_borrador}</p>
                        </div>
                      </div>
                      {caso.telefono_borrador && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Teléfono:</p>
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm">{caso.telefono_borrador}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {caso.ciudad_borrador && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Ciudad:</p>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">{caso.ciudad_borrador}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      Mis Documentos
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
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No hay documentos disponibles</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="interacciones" className="space-y-4">
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
            </Tabs>
          </ScrollArea>
        </DialogContent>
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