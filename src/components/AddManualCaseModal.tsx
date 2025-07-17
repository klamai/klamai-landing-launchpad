
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Sparkles, AlertTriangle, Zap } from 'lucide-react';

interface AddManualCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddManualCaseModal: React.FC<AddManualCaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [caseText, setCaseText] = useState('');
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

    if (caseText.trim().length < 50) {
      toast({
        title: "Error",
        description: "El texto del caso debe tener al menos 50 caracteres para poder extraer información suficiente",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('add-manual-case', {
        body: {
          caseText: caseText.trim()
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "¡Éxito!",
          description: "Caso creado exitosamente. Se está procesando con IA automáticamente...",
        });
        
        // Limpiar formulario
        setCaseText('');
        
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
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-blue-600" />
            Añadir Caso Manual con IA
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Procesamiento Automático con IA
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Pega el texto completo del caso y nuestros asistentes de IA personalizados se encargarán de:
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 ml-4 space-y-1">
                  <li>• <strong>Extraer automáticamente</strong> los datos del cliente</li>
                  <li>• <strong>Determinar la especialidad legal</strong> más apropiada</li>
                  <li>• <strong>Clasificar el tipo de lead</strong> (estándar, premium, urgente)</li>
                  <li>• <strong>Generar un resumen profesional</strong> del caso</li>
                  <li>• <strong>Crear una guía técnica</strong> para el abogado asignado</li>
                  <li>• <strong>Estimar el valor económico</strong> del caso</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caseText" className="text-sm font-medium">
              Texto Completo del Caso *
            </Label>
            <Textarea
              id="caseText"
              value={caseText}
              onChange={(e) => setCaseText(e.target.value)}
              placeholder="Pega aquí el texto completo del caso. Incluye TODA la información disponible:

📋 DATOS DEL CLIENTE:
- Nombre completo y datos de contacto
- Email y teléfono
- Ubicación (ciudad)
- Tipo de cliente (particular o empresa)
- Para empresas: razón social, CIF, gerente, dirección fiscal

⚖️ CONSULTA LEGAL:
- Descripción detallada del problema legal
- Hechos relevantes y cronología
- Documentación disponible
- Urgencia del caso
- Expectativas del cliente

💡 EJEMPLO:
Juan Pérez Martínez, email: juan.perez@email.com, teléfono: 600123456, Madrid.
Consulta sobre despido improcedente. Trabajaba en la empresa XYZ desde enero 2020, me despidieron el 15 de diciembre de 2023 sin causa justificada. Tengo contrato indefinido y nunca recibí amonestaciones. La empresa alega reestructuración pero han contratado a alguien nuevo para mi puesto. Necesito reclamar indemnización..."
              className="min-h-[300px] resize-none font-mono text-sm"
              disabled={loading}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {caseText.length}/10000 caracteres
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Mínimo 50 caracteres requeridos
              </p>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="font-medium text-amber-900 dark:text-amber-100">
                  ¿Cómo funciona el procesamiento automático?
                </h4>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li>1. <strong>Análisis de texto</strong>: Extracción automática de datos estructurados</li>
                  <li>2. <strong>Clasificación inteligente</strong>: Asignación de especialidad y tipo de lead</li>
                  <li>3. <strong>Procesamiento con IA</strong>: Resumen, guía y valoración del caso</li>
                  <li>4. <strong>Estado final</strong>: El caso queda listo para asignación a abogados</li>
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
              disabled={loading || !caseText.trim() || caseText.trim().length < 50}
              className="min-w-[180px]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Procesando con IA...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Crear Caso Automáticamente
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
