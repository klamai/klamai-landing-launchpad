
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';

interface CaseDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  caso: any;
  onSuccess: () => void;
}

const CaseDeleteConfirmModal = ({ isOpen, onClose, caso, onSuccess }: CaseDeleteConfirmModalProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!caso) return;
    
    setLoading(true);

    try {
      // Primero eliminar asignaciones relacionadas
      await supabase
        .from('asignaciones_casos')
        .delete()
        .eq('caso_id', caso.id);

      // Eliminar documentos de resolución
      await supabase
        .from('documentos_resolucion')
        .delete()
        .eq('caso_id', caso.id);

      // Eliminar documentos de cliente
      await supabase
        .from('documentos_cliente')
        .delete()
        .eq('caso_id', caso.id);

      // Finalmente eliminar el caso
      const { error } = await supabase
        .from('casos')
        .delete()
        .eq('id', caso.id);

      if (error) throw error;

      toast({
        title: "¡Caso eliminado!",
        description: "El caso y todos sus datos relacionados han sido eliminados correctamente",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error deleting case:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el caso",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  if (!caso) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Eliminación
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>¡Atención!</strong> Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Estás a punto de eliminar el siguiente caso:
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="font-semibold text-gray-900 dark:text-white">
                {getClientName()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                ID: {caso.id.substring(0, 8)}...
              </p>
              {caso.motivo_consulta && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {caso.motivo_consulta}
                </p>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Se eliminarán también:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Todas las asignaciones del caso</li>
              <li>Documentos de resolución asociados</li>
              <li>Documentos del cliente relacionados</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Eliminando...' : 'Eliminar Caso'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CaseDeleteConfirmModal;
