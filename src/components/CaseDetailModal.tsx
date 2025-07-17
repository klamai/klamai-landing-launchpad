
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Calendar, 
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
  UserPlus,
  MessageSquare,
  Upload,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useDocumentManagement } from '@/hooks/useDocumentManagement';
import { useClientDocumentManagement } from '@/hooks/useClientDocumentManagement';
import CaseEditModal from './CaseEditModal';
import CaseDeleteConfirmModal from './CaseDeleteConfirmModal';

interface CaseDetailModalProps {
  caso: any;
  isOpen: boolean;
  onClose: () => void;
  onAssignLawyer: (casoId: string) => void;
  onGenerateResolution: (casoId: string) => void;
  onUploadDocument: (casoId: string) => void;
  onSendMessage: (casoId: string) => void;
}

const CaseDetailModal = ({ caso, isOpen, onClose, onAssignLawyer, onGenerateResolution, onUploadDocument, onSendMessage }: CaseDetailModalProps) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const { toast } = useToast();

  // Document management hooks - only initialize when we have a selected case
  const { 
    documentosResolucion, 
    loading: documentsLoading, 
    uploadDocument, 
    deleteDocument,
    refetch: refetchDocuments
  } = useDocumentManagement(caso?.id);
  
  const { 
    documentosCliente, 
    loading: clientDocumentsLoading,
    refetch: refetchClientDocuments
  } = useClientDocumentManagement(caso?.id);

  const handleEditSuccess = () => {
    toast({
      title: "Caso actualizado",
      description: "Los cambios se han guardado correctamente",
    });
    // El componente padre se actualizará automáticamente por el realtime
  };

  const handleDeleteSuccess = () => {
    onClose(); // Cerrar el modal de detalles
    toast({
      title: "Caso eliminado",
      description: "El caso ha sido eliminado correctamente",
    });
    // El componente padre se actualizará automáticamente por el realtime
  };

  const getStatusBadge = (estado: string) => {
    const statusConfig = {
      'disponible': { label: 'Disponible', variant: 'default' as const, icon: AlertCircle },
      'agotado': { label: 'Agotado', variant: 'destructive' as const, icon: Clock },
      'cerrado': { label: 'Cerrado', variant: 'secondary' as const, icon: CheckCircle },
      'esperando_pago': { label: 'Esperando Pago', variant: 'outline' as const, icon: Clock }
    };
    
    const config = statusConfig[estado as keyof typeof statusConfig] || statusConfig.disponible;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getClientName = () => {
    if (!caso) return '';
    
    if (caso.profiles?.nombre) {
      return `${caso.profiles.nombre} ${caso.profiles.apellido || ''}`.trim();
    }
    
    if (caso.nombre_borrador) {
      return `${caso.nombre_borrador} ${caso.apellido_borrador || ''}`.trim();
    }
    
    if (caso.razon_social_borrador) {
      return caso.razon_social_borrador;
    }
    
    return 'Cliente sin nombre';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Detalles del Caso
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(true)}
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteModalOpen(true)}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              ID: {caso?.id?.substring(0, 8)}... • Estado: {caso?.estado}
            </DialogDescription>
          </DialogHeader>

          {/* Case Details Content */}
          {caso && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Información Básica</h3>
                  {getStatusBadge(caso.estado)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cliente</p>
                    <p className="font-medium">{getClientName()}</p>
                  </div>
                  
                  {caso.email_borrador && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{caso.email_borrador}</span>
                    </div>
                  )}
                  
                  {caso.telefono_borrador && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{caso.telefono_borrador}</span>
                    </div>
                  )}
                  
                  {caso.ciudad_borrador && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{caso.ciudad_borrador}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{format(new Date(caso.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                  </div>
                  
                  {caso.especialidades?.nombre && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Especialidad</p>
                      <p className="font-medium">{caso.especialidades.nombre}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Case Description */}
              {caso.motivo_consulta && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Motivo de Consulta</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {caso.motivo_consulta}
                  </p>
                </div>
              )}

              {/* Case Summary */}
              {caso.resumen_caso && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Resumen del Caso</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {caso.resumen_caso}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button onClick={() => onAssignLawyer(caso.id)} variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Asignar Abogado
                </Button>
                <Button onClick={() => onGenerateResolution(caso.id)} variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Generar Resolución
                </Button>
                <Button onClick={() => onUploadDocument(caso.id)} variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Documento
                </Button>
                <Button onClick={() => onSendMessage(caso.id)} variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar Mensaje
                </Button>
              </div>

              {/* Documents Section */}
              {(documentosResolucion.length > 0 || documentosCliente.length > 0) && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Documentos</h3>
                  
                  {documentosResolucion.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Documentos de Resolución</h4>
                      <div className="space-y-2">
                        {documentosResolucion.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <FileText className="h-4 w-4" />
                            <span className="flex-1">{doc.nombre_archivo}</span>
                            <span className="text-sm text-gray-500">
                              {format(new Date(doc.fecha_subida), 'dd/MM/yyyy', { locale: es })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {documentosCliente.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Documentos del Cliente</h4>
                      <div className="space-y-2">
                        {documentosCliente.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <FileText className="h-4 w-4" />
                            <span className="flex-1">{doc.nombre_archivo}</span>
                            <span className="text-sm text-gray-500">
                              {format(new Date(doc.fecha_subida), 'dd/MM/yyyy', { locale: es })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit and Delete Modals */}
      <CaseEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        caso={caso}
        onSuccess={handleEditSuccess}
      />

      <CaseDeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        caso={caso}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
};

export default CaseDetailModal;
