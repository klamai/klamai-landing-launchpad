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
import CaseDetailTabs from './CaseDetailTabs';
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
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

          {/* Tabs */}
          {caso && (
            <CaseDetailTabs
              caso={caso}
              documentosResolucion={documentosResolucion}
              documentosCliente={documentosCliente}
              onAssignLawyer={onAssignLawyer}
              onGenerateResolution={onGenerateResolution}
              onUploadDocument={onUploadDocument}
              onSendMessage={onSendMessage}
              documentsLoading={documentsLoading}
              clientDocumentsLoading={clientDocumentsLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modales de edición y eliminación */}
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
