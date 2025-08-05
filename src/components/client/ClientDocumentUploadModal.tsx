
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useClientDocumentManagement } from '@/hooks/client/useClientDocumentManagement';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentUploadRateLimit } from '@/utils/rateLimiting';
import { 
  isValidFileType, 
  isValidFileSize, 
  sanitizeDocumentDescription,
  isValidDocumentType
} from '@/utils/security';

interface ClientDocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  casoId: string;
  onUploadSuccess: () => void;
}

const ClientDocumentUploadModal: React.FC<ClientDocumentUploadModalProps> = ({
  isOpen,
  onClose,
  casoId,
  onUploadSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState('evidencia');
  const [descripcion, setDescripcion] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { uploadDocument } = useClientDocumentManagement(casoId);
  const { checkUploadRateLimit, recordUploadAttempt } = useDocumentUploadRateLimit();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!isValidFileType(file)) {
        toast({
          title: "Error",
          description: "Tipo de archivo no permitido. Solo se aceptan PDF, imágenes y documentos de Word",
          variant: "destructive",
        });
        return;
      }

      // Validar tamaño de archivo
      if (!isValidFileSize(file)) {
        toast({
          title: "Error",
          description: "El archivo no puede ser mayor a 10MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo",
        variant: "destructive",
      });
      return;
    }

    // Verificar rate limiting
    const rateLimitCheck = await checkUploadRateLimit(user.id);
    
    if (!rateLimitCheck.allowed) {
      toast({
        title: "Error",
        description: rateLimitCheck.error || "Demasiadas subidas. Espera un momento antes de intentar de nuevo",
        variant: "destructive",
      });
      return;
    }

    // Validar tipo de documento
    if (!isValidDocumentType(tipoDocumento)) {
      toast({
        title: "Error",
        description: "Tipo de documento no válido",
        variant: "destructive",
      });
      return;
    }

    // Sanitizar descripción
    const sanitizedDescription = sanitizeDocumentDescription(descripcion);

    setIsUploading(true);

    try {
      // Registrar intento de subida
      await recordUploadAttempt(user.id);
      
      const result = await uploadDocument(
        selectedFile,
        tipoDocumento,
        sanitizedDescription
      );

      if (!result.success) {
        throw new Error(result.error || 'Error al subir el documento');
      }

      toast({
        title: "Éxito",
        description: "Documento subido correctamente",
      });

      // Limpiar formulario
      setSelectedFile(null);
      setTipoDocumento('evidencia');
      setDescripcion('');
      
      onUploadSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: error.message || "Error al subir el documento",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setTipoDocumento('evidencia');
      setDescripcion('');
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Documento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selección de archivo */}
          <div>
            <Label htmlFor="file-upload" className="block text-sm font-medium mb-2">
              Seleccionar Archivo
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Haz clic para seleccionar un archivo
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, Word, imágenes o texto (máx. 10MB)
                </p>
              </label>
            </div>
            
            {selectedFile && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            )}
          </div>

          {/* Tipo de documento */}
          <div>
            <Label htmlFor="tipo-documento" className="block text-sm font-medium mb-2">
              Tipo de Documento
            </Label>
            <select
              id="tipo-documento"
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="evidencia">Evidencia</option>
              <option value="contrato">Contrato</option>
              <option value="factura">Factura</option>
              <option value="correspondencia">Correspondencia</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          {/* Descripción */}
          <div>
            <Label htmlFor="descripcion" className="block text-sm font-medium mb-2">
              Descripción (opcional)
            </Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe brevemente el contenido del documento..."
              className="resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {descripcion.length}/500 caracteres
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isUploading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2"
                  >
                    ⏳
                  </motion.div>
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir
                </>
              )}
            </Button>
          </div>

          {/* Información de seguridad */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">Información de Seguridad:</p>
                <ul className="space-y-1">
                  <li>• Solo archivos seguros permitidos (PDF, Word, imágenes)</li>
                  <li>• Tamaño máximo: 10MB por archivo</li>
                  <li>• Máximo 10 subidas por minuto</li>
                  <li>• Descripción limitada a 500 caracteres</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDocumentUploadModal;
