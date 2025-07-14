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
  Building
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CaseDetailModalProps {
  caso: {
    id: string;
    motivo_consulta: string;
    estado: string;
    created_at: string;
    valor_estimado?: string;
    tipo_lead?: string;
    tipo_perfil_borrador?: string;
    transcripcion_chat?: any;
    propuesta_estructurada?: any;
    guia_abogado?: string;
    documentos_adjuntos?: any;
    nombre_borrador?: string;
    apellido_borrador?: string;
    email_borrador?: string;
    telefono_borrador?: string;
    ciudad_borrador?: string;
    razon_social_borrador?: string;
    nif_cif_borrador?: string;
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

  if (!caso) return null;

  const clientData = caso.profiles || {
    nombre: caso.nombre_borrador || '',
    apellido: caso.apellido_borrador || '',
    email: caso.email_borrador || '',
    telefono: caso.telefono_borrador || '',
    ciudad: caso.ciudad_borrador || '',
    tipo_perfil: caso.tipo_perfil_borrador || 'individual',
    razon_social: caso.razon_social_borrador || '',
    nif_cif: caso.nif_cif_borrador || ''
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

  return (
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
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Motivo de consulta:</p>
                      <p className="text-sm">{caso.motivo_consulta}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(caso.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{caso.especialidades?.nombre || 'Sin especialidad'}</span>
                      </div>
                    </div>
                    {caso.valor_estimado && (
                      <div className="flex items-center gap-1 text-sm">
                        <Euro className="h-4 w-4 text-muted-foreground" />
                        <span>Valor estimado: {caso.valor_estimado}</span>
                      </div>
                    )}
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

              {caso.guia_abogado && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Guía para el Abogado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{caso.guia_abogado}</p>
                  </CardContent>
                </Card>
              )}
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
                      {clientData.razon_social && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Razón social:</p>
                          <p className="text-sm">{clientData.razon_social}</p>
                        </div>
                      )}
                      {clientData.nif_cif && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">NIF/CIF:</p>
                          <p className="text-sm">{clientData.nif_cif}</p>
                        </div>
                      )}
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Documentos del Caso</CardTitle>
                </CardHeader>
                <CardContent>
                  {caso.documentos_adjuntos ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Documentos adjuntos por el cliente:</p>
                      <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto">
                        {JSON.stringify(caso.documentos_adjuntos, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay documentos adjuntos</p>
                    </div>
                  )}
                </CardContent>
              </Card>
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
                onClick={() => onUploadDocument(caso.id)}
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
  );
};

export default CaseDetailModal;