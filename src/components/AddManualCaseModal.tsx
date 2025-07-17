
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Sparkles, AlertTriangle } from 'lucide-react';

interface AddManualCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  especialidades: Array<{ id: number; nombre: string }>;
}

const AddManualCaseModal: React.FC<AddManualCaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  especialidades
}) => {
  const [caseText, setCaseText] = useState('');
  const [especialidadId, setEspecialidadId] = useState<string>('');
  const [tipoLead, setTipoLead] = useState<'estandar' | 'premium' | 'urgente'>('estandar');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!caseText.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa el texto del caso",
        variant: "destructive",
      });
      return;
    }

    if (!especialidadId) {
      toast({
        title: "Error", 
        description: "Por favor, selecciona una especialidad",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('add-manual-case', {
        body: {
          caseText: caseText.trim(),
          especialidadId: parseInt(especialidadId),
          tipoLead
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "¡Éxito!",
          description: "Caso creado exitosamente. Se está procesando con IA...",
        });
        
        // Limpiar formulario
        setCaseText('');
        setEspecialidadId('');
        setTipoLead('estandar');
        
        onSuccess();
        onClose();
      } else {
        throw new Error(data?.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error creando caso:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el caso",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCaseText('');
      setEspecialidadId('');
      setTipoLead('estandar');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-blue-600" />
            Añadir Caso Manual
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Procesamiento Inteligente
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Pega el texto completo del caso incluyendo datos del cliente y la consulta legal. 
                  Nuestro sistema de IA extraerá automáticamente la información estructurada, 
                  generará un resumen profesional y una guía para el abogado asignado.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caseText" className="text-sm font-medium">
              Texto del Caso *
            </Label>
            <Textarea
              id="caseText"
              value={caseText}
              onChange={(e) => setCaseText(e.target.value)}
              placeholder="Pega aquí el texto completo del caso. Incluye:
- Datos del cliente (nombre, email, teléfono, ciudad)
- Tipo de cliente (individual o empresa)
- Consulta legal completa
- Detalles adicionales relevantes
- Cualquier información de contacto o preferencias

Ejemplo:
Juan Pérez, email: juan@email.com, teléfono: 600123456, Madrid. 
Consulta sobre despido improcedente. Trabajo en empresa X desde hace 3 años, me despidieron sin causa justificada el 15/12/2023..."
              className="min-h-[200px] resize-none"
              disabled={loading}
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {caseText.length}/5000 caracteres
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="especialidad" className="text-sm font-medium">
                Especialidad *
              </Label>
              <Select value={especialidadId} onValueChange={setEspecialidadId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una especialidad" />
                </SelectTrigger>
                <SelectContent>
                  {especialidades.map((esp) => (
                    <SelectItem key={esp.id} value={esp.id.toString()}>
                      {esp.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoLead" className="text-sm font-medium">
                Tipo de Lead
              </Label>
              <Select value={tipoLead} onValueChange={(value: 'estandar' | 'premium' | 'urgente') => setTipoLead(value)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estandar">Estándar</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="font-medium text-amber-900 dark:text-amber-100">
                  Información Importante
                </h4>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• El caso se creará en estado "borrador" inicialmente</li>
                  <li>• La IA procesará el texto y extraerá los datos automáticamente</li>
                  <li>• Una vez procesado, el caso pasará a estado "disponible"</li>
                  <li>• Se generará un resumen profesional y guía para el abogado</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !caseText.trim() || !especialidadId}
              className="min-w-[140px]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Procesando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Crear Caso
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddManualCaseModal;
