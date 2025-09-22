import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAssignCaseToLawyer, useAvailableLawyers } from '@/hooks/queries/useAdminLawyers';
import { useAdminCases } from '@/hooks/queries/useAdminCases';
import {
  Users,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Send
} from 'lucide-react';

interface BulkAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCases: Array<{
    id: string;
    profiles?: { nombre: string; apellido: string };
    nombre_borrador?: string;
    apellido_borrador?: string;
    motivo_consulta: string;
  }>;
  onSuccess?: () => void;
}

const BulkAssignmentModal: React.FC<BulkAssignmentModalProps> = ({
  isOpen,
  onClose,
  selectedCases,
  onSuccess
}) => {
  const [selectedLawyerId, setSelectedLawyerId] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [includeEmailNotification, setIncludeEmailNotification] = useState(true);
  const [createReminders, setCreateReminders] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const { data: lawyers = [], isLoading: lawyersLoading } = useAvailableLawyers();
  const { mutate: assignCase } = useAssignCaseToLawyer();
  const { toast } = useToast();

  const selectedLawyer = useMemo(() => {
    return lawyers.find(l => l.id === selectedLawyerId);
  }, [lawyers, selectedLawyerId]);

  const handleBulkAssign = async () => {
    if (!selectedLawyerId || selectedCases.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona un abogado y al menos un caso",
        variant: "destructive"
      });
      return;
    }

    setIsAssigning(true);
    let successCount = 0;
    let errorCount = 0;

    // Assign each case sequentially
    for (const caso of selectedCases) {
      try {
        await new Promise<void>((resolve, reject) => {
          assignCase(
            {
              casoId: caso.id,
              abogadoId: selectedLawyerId,
              notas: assignmentNotes || `Asignación masiva - ${selectedCases.length} casos`
            },
            {
              onSuccess: () => {
                successCount++;
                resolve();
              },
              onError: (error) => {
                errorCount++;
                console.error(`Error asignando caso ${caso.id}:`, error);
                resolve(); // Continue with next case
              }
            }
          );
        });
      } catch (error) {
        errorCount++;
      }
    }

    setIsAssigning(false);

    // Show results
    if (successCount > 0) {
      toast({
        title: "Asignación completada",
        description: `${successCount} casos asignados exitosamente${errorCount > 0 ? `, ${errorCount} errores` : ''}`,
      });

      // Reset form
      setSelectedLawyerId('');
      setAssignmentNotes('');
      setIncludeEmailNotification(true);
      setCreateReminders(false);

      onSuccess?.();
      onClose();
    } else {
      toast({
        title: "Error en asignación",
        description: "No se pudo asignar ningún caso",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    if (!isAssigning) {
      setSelectedLawyerId('');
      setAssignmentNotes('');
      setIncludeEmailNotification(true);
      setCreateReminders(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Asignación Masiva de Casos
          </DialogTitle>
          <DialogDescription>
            Asigna múltiples casos a un abogado de forma simultánea
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cases Summary */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">
                Casos Seleccionados ({selectedCases.length})
              </h3>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedCases.slice(0, 5).map((caso) => (
                <div key={caso.id} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 truncate">
                    {caso.profiles?.nombre || caso.nombre_borrador} {caso.profiles?.apellido || caso.apellido_borrador}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600 truncate">{caso.motivo_consulta}</span>
                </div>
              ))}
              {selectedCases.length > 5 && (
                <div className="text-sm text-gray-500 text-center">
                  ... y {selectedCases.length - 5} casos más
                </div>
              )}
            </div>
          </div>

          {/* Lawyer Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Seleccionar Abogado</Label>
            {lawyersLoading ? (
              <div className="flex items-center justify-center p-4 border-2 border-dashed rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm text-gray-600">Cargando abogados...</span>
              </div>
            ) : lawyers.length === 0 ? (
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <p className="text-sm text-gray-600">No se encontraron abogados disponibles</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {lawyers.map((lawyer) => (
                  <div
                    key={lawyer.id}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedLawyerId === lawyer.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedLawyerId(lawyer.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-sm font-medium">
                          {lawyer.nombre.charAt(0)}{lawyer.apellido.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {lawyer.nombre} {lawyer.apellido}
                          </p>
                          <p className="text-sm text-gray-600">{lawyer.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {lawyer.casos_activos} casos activos
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {lawyer.creditos_disponibles} créditos
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Lawyer Info */}
          {selectedLawyer && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Abogado Seleccionado</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Casos activos:</span>
                  <span className="ml-2 font-medium">{selectedLawyer.casos_activos}</span>
                </div>
                <div>
                  <span className="text-gray-600">Créditos:</span>
                  <span className="ml-2 font-medium">{selectedLawyer.creditos_disponibles}</span>
                </div>
              </div>
            </div>
          )}

          {/* Assignment Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas de Asignación (Opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Escribe notas adicionales para el abogado sobre estos casos..."
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Options */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Opciones Adicionales</h4>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Notificación por email</Label>
                <p className="text-xs text-muted-foreground">
                  Enviar email al abogado con los detalles de asignación
                </p>
              </div>
              <Switch
                checked={includeEmailNotification}
                onCheckedChange={setIncludeEmailNotification}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Recordatorios automáticos</Label>
                <p className="text-xs text-muted-foreground">
                  Crear recordatorios para seguimiento de casos
                </p>
              </div>
              <Switch
                checked={createReminders}
                onCheckedChange={setCreateReminders}
              />
            </div>
          </div>

          {/* Warning for high volume */}
          {selectedCases.length > 10 && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    Asignación de alto volumen
                  </p>
                  <p className="text-xs text-yellow-800 mt-1">
                    Estás asignando {selectedCases.length} casos. Esto puede sobrecargar al abogado seleccionado.
                    Considera dividir la asignación en lotes más pequeños.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isAssigning}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleBulkAssign}
            disabled={isAssigning || !selectedLawyerId || selectedCases.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isAssigning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Asignando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Asignar {selectedCases.length} Caso{selectedCases.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkAssignmentModal;