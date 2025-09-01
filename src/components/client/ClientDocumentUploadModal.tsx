
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
import { 
  ALLOWED_FILE_TYPES_STRING,
  ALLOWED_FILE_TYPES_DISPLAY,
  MAX_FILE_SIZE_MB,
  MAX_FILES_PER_UPLOAD
} from '@/config/constants';

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [tipoDocumento, setTipoDocumento] = useState('prueba');
  const [descripcion, setDescripcion] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { uploadDocument } = useClientDocumentManagement(casoId);
  const { checkUploadRateLimit, recordUploadAttempt } = useDocumentUploadRateLimit();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const totalFiles = selectedFiles.length + newFiles.length;

      if (totalFiles > MAX_FILES_PER_UPLOAD) {
        toast({
          title: "Límite de archivos excedido",
          description: `Puedes seleccionar un máximo de ${MAX_FILES_PER_UPLOAD} archivos a la vez.`,
          variant: "destructive",
        });
        return;
      }

      const validatedFiles = newFiles.filter(file => {
        if (!isValidFileType(file)) {
          toast({
            title: `Tipo de archivo no permitido: ${file.name}`,
            description: `Solo se permiten: ${ALLOWED_FILE_TYPES_DISPLAY}`,
            variant: "destructive",
          });
          return false;
        }
        if (!isValidFileSize(file)) {
          toast({
            title: `Archivo demasiado grande: ${file.name}`,
            description: `El tamaño máximo es de ${MAX_FILE_SIZE_MB}MB.`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });

      setSelectedFiles(prevFiles => [...prevFiles, ...validatedFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !user) {
      toast({
        title: "No hay archivos para subir",
        description: "Por favor, selecciona al menos un archivo.",
        variant: "destructive",
      });
      return;
    }

    const rateLimitCheck = await checkUploadRateLimit(user.id);
    if (!rateLimitCheck.allowed) {
      toast({
        title: "Límite de subidas alcanzado",
        description: rateLimitCheck.error || "Has subido demasiados archivos. Inténtalo de nuevo más tarde.",
        variant: "destructive",
      });
      return;
    }

    // Validar tipo de documento
    if (!isValidDocumentType(tipoDocumento, 'cliente')) {
      toast({
        title: "Error",
        description: "Tipo de documento no válido",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;
    const sanitizedDescription = sanitizeDocumentDescription(descripcion);

    const uploadPromises = selectedFiles.map(file => 
      recordUploadAttempt(user.id)
        .then(() => uploadDocument(file, tipoDocumento, sanitizedDescription))
        .then(result => {
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            toast({
              title: `Error al subir ${file.name}`,
              description: result.error || "Ocurrió un error inesperado.",
              variant: "destructive",
            });
          }
        })
    );

    await Promise.allSettled(uploadPromises);

    setIsUploading(false);

    if (successCount > 0) {
      toast({
        title: "Subida completada",
        description: `${successCount} de ${selectedFiles.length} archivos se subieron correctamente.`,
      });
      onUploadSuccess();
    }

    if (errorCount === 0) {
      handleClose();
    } else {
      // Opcional: podrías querer limpiar los archivos que sí se subieron de la lista
      // Por ahora, se mantendrán para que el usuario vea cuáles fallaron.
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFiles([]);
      setTipoDocumento('prueba');
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
                accept={ALLOWED_FILE_TYPES_STRING}
                onChange={handleFileSelect}
                className="hidden"
                multiple
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  {selectedFiles.length > 0 ? `${selectedFiles.length} archivos seleccionados` : 'Haz clic para seleccionar archivos'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {ALLOWED_FILE_TYPES_DISPLAY} (máx. {MAX_FILE_SIZE_MB}MB)
                </p>
              </label>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {selectedFiles.map((file, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <FileText className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium text-gray-800 dark:text-gray-100 break-all"
                            title={file.name}
                          >
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground flex-shrink-0"
                        onClick={() => handleRemoveFile(index)}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
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
              <option value="prueba">Prueba (fotos, capturas, etc.)</option>
              <option value="contrato">Contrato o Acuerdo</option>
              <option value="comunicacion">Comunicación (emails, burofax)</option>
              <option value="factura">Factura o Justificante de Pago</option>
              <option value="notificacion">Notificación Judicial o Administrativa</option>
              <option value="identificacion">Documento de Identificación</option>
              <option value="poder_notarial">Poder Notarial</option>
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
              disabled={selectedFiles.length === 0 || isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  >
                  </motion.div>
                  Subiendo {selectedFiles.length} archivos...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir {selectedFiles.length} archivo(s)
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
                  <li>• Solo archivos seguros permitidos ({ALLOWED_FILE_TYPES_DISPLAY})</li>
                  <li>• Tamaño máximo: {MAX_FILE_SIZE_MB}MB por archivo</li>
                  <li>• Máximo {MAX_FILES_PER_UPLOAD} subidas por minuto</li>
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
