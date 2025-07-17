
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSuperAdminStats } from '@/hooks/useSuperAdminStats';
import { UserPlus, Scale, MapPin, Building, User, AlertCircle } from 'lucide-react';

interface CaseAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  caso: {
    id: string;
    motivo_consulta: string;
    especialidades?: { nombre: string };
    profiles?: { 
      nombre: string; 
      apellido: string; 
      email: string;
      ciudad?: string;
      tipo_perfil?: string;
      razon_social?: string;
    };
    nombre_borrador?: string;
    apellido_borrador?: string;
    email_borrador?: string;
    ciudad_borrador?: string;
    tipo_perfil_borrador?: string;
    razon_social_borrador?: string;
  } | null;
}

const CaseAssignmentModal: React.FC<CaseAssignmentModalProps> = ({
  isOpen,
  onClose,
  caso
}) => {
  const [selectedLawyerId, setSelectedLawyerId] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const { abogados, assignCaseToLawyer } = useSuperAdminStats();
  const { toast } = useToast();

  const handleAssignCase = async () => {
    if (!caso || !selectedLawyerId) {
      toast({
        title: "Error",
        description: "Selecciona un abogado para asignar el caso",
        variant: "destructive"
      });
      return;
    }

    setIsAssigning(true);
    
    try {
      const result = await assignCaseToLawyer(caso.id, selectedLawyerId, assignmentNotes);
      
      if (result.success) {
        toast({
          title: "¡Caso asignado exitosamente!",
          description: `El caso ha sido asignado al abogado seleccionado`,
        });
        
        // Reset form and close modal
        setSelectedLawyerId('');
        setAssignmentNotes('');
        onClose();
      } else {
        toast({
          title: "Error al asignar caso",
          description: result.error || "Ocurrió un error inesperado",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error assigning case:', error);
      toast({
        title: "Error inesperado",
        description: "No se pudo asignar el caso. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClose = () => {
    if (!isAssigning) {
      setSelectedLawyerId('');
      setAssignmentNotes('');
      onClose();
    }
  };

  if (!caso) return null;

  // Obtener datos del cliente combinando profiles y borrador
  const clientData = {
    nombre: caso.profiles?.nombre || caso.nombre_borrador || '',
    apellido: caso.profiles?.apellido || caso.apellido_borrador || '',
    email: caso.profiles?.email || caso.email_borrador || '',
    ciudad: caso.profiles?.ciudad || caso.ciudad_borrador || '',
    tipo_perfil: caso.profiles?.tipo_perfil || caso.tipo_perfil_borrador || 'individual',
    razon_social: caso.profiles?.razon_social || caso.razon_social_borrador || ''
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Asignar Caso a Abogado
          </DialogTitle>
          <DialogDescription className="text-base">
            Selecciona un abogado para asignar este caso y agregar notas si es necesario
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del caso */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              Información del Caso
            </h3>
            
            <div className="space-y-3">
              {/* Cliente */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cliente:</p>
                <div className="flex items-center gap-2">
                  {clientData.tipo_perfil === 'empresa' ? (
                    <Building className="h-4 w-4 text-blue-600" />
                  ) : (
                    <User className="h-4 w-4 text-green-600" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {clientData.nombre} {clientData.apellido}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {clientData.tipo_perfil === 'empresa' ? 'Empresa' : 'Individual'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{clientData.email}</p>
                {clientData.tipo_perfil === 'empresa' && clientData.razon_social && (
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Razón Social: {clientData.razon_social}
                  </p>
                )}
              </div>

              {/* Especialidad y ubicación */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Especialidad:</p>
                    <p className="text-sm text-gray-900 dark:text-white">{caso.especialidades?.nombre || 'Sin especialidad'}</p>
                  </div>
                </div>
                
                {clientData.ciudad && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Ciudad:</p>
                      <p className="text-sm text-gray-900 dark:text-white">{clientData.ciudad}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Motivo de consulta */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Motivo de consulta:</p>
                <div className="bg-white dark:bg-gray-700 p-3 rounded border">
                  <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                    {caso.motivo_consulta}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Selección de abogado */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                Seleccionar Abogado *
              </label>
              <Select value={selectedLawyerId} onValueChange={setSelectedLawyerId} disabled={isAssigning}>
                <SelectTrigger className="h-12 text-base border-2">
                  <SelectValue placeholder="Selecciona un abogado..." />
                </SelectTrigger>
                <SelectContent>
                  {abogados.map((abogado) => (
                    <SelectItem key={abogado.id} value={abogado.id} className="text-base py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {abogado.nombre} {abogado.apellido}
                        </span>
                        <span className="text-sm text-gray-500">
                          {abogado.casos_activos} casos activos • {abogado.creditos_disponibles} créditos
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notas de asignación */}
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                Notas de Asignación (Opcional)
              </label>
              <Textarea
                placeholder="Escribe notas adicionales para el abogado sobre este caso..."
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                className="text-base border-2 min-h-[100px]"
                disabled={isAssigning}
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isAssigning}
              className="h-11 px-6 text-base border-2"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAssignCase}
              disabled={isAssigning || !selectedLawyerId}
              className="h-11 px-6 text-base"
            >
              {isAssigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Asignando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Asignar Caso
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CaseAssignmentModal;
