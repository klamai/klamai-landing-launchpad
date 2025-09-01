import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useDocumentManagement } from '@/hooks/shared/useDocumentManagement';
import { 
  ALLOWED_FILE_TYPES_STRING,
  ALLOWED_FILE_TYPES_DISPLAY,
  MAX_FILE_SIZE_MB,
  MAX_FILES_PER_UPLOAD
} from '@/config/constants';
import { isValidDocumentType, isValidFileSize } from '@/utils/security';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  casoId: string;
  onUploadSuccess: () => void;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  casoId,
  onUploadSuccess
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [tipoDocumento, setTipoDocumento] = useState('escrito_judicial');
  const [descripcion, setDescripcion] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { uploadDocument } = useDocumentManagement(casoId);

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
    if (selectedFiles.length === 0) {
      toast({
        title: "No hay archivos seleccionados",
        description: "Por favor, selecciona uno o más archivos para subir.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidDocumentType(tipoDocumento, 'abogado')) {
      toast({
        title: "Tipo de documento no válido",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    const uploadPromises = selectedFiles.map(file => 
      uploadDocument(file, tipoDocumento, descripcion)
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
          return result;
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
      // No cerrar el modal si hubo errores, para que el usuario pueda reintentar.
      // Limpiar solo los que se subieron con éxito.
      const successfulNames = (await Promise.all(uploadPromises))
        .filter(r => r.success)
        .map(r => r.fileName); // Asumiendo que uploadDocument devuelve el nombre del archivo
      setSelectedFiles(prevFiles => prevFiles.filter(f => !successfulNames.includes(f.name)));
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setTipoDocumento('escrito_judicial');
    setDescripcion('');
    setIsUploading(false);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Documento de Abogado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="tipo-documento">Tipo de documento</Label>
            <select
              id="tipo-documento"
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value)}
              className="w-full mt-1 p-2 border border-input rounded-md bg-background"
            >
              <option value="escrito_judicial">Escrito Judicial (demanda, recurso, etc.)</option>
              <option value="dictamen_informe">Dictamen / Informe</option>
              <option value="propuesta_honorarios">Propuesta de Honorarios</option>
              <option value="notificacion_requerimiento">Notificación / Requerimiento</option>
              <option value="borrador">Borrador</option>
              <option value="sentencia_resolucion">Sentencia / Resolución</option>
              <option value="otros">Otros</option>
            </select>
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe el contenido del documento..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="file-upload" className="block text-sm font-medium mb-2">
              Seleccionar Archivo
            </Label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
              <input
                id="file-upload"
                type="file"
                accept={ALLOWED_FILE_TYPES_STRING}
                onChange={handleFileSelect}
                className="hidden"
                multiple
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedFiles.length > 0 ? `${selectedFiles.length} archivos seleccionados` : 'Haz clic para seleccionar archivos'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {ALLOWED_FILE_TYPES_DISPLAY} (máx. {MAX_FILE_SIZE_MB}MB)
                </p>
              </label>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {selectedFiles.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium text-blue-900 dark:text-blue-100 break-all"
                          title={file.name}
                        >
                          {file.name}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
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

          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-700 dark:text-amber-300">
                <p className="font-medium mb-1">Tipos de archivo permitidos:</p>
                <p>{ALLOWED_FILE_TYPES_DISPLAY}</p>
                <p className="mt-1">Tamaño máximo: {MAX_FILE_SIZE_MB}MB</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1"
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpload} 
              className="flex-1"
              disabled={selectedFiles.length === 0 || isUploading}
            >
              {isUploading ? `Subiendo ${selectedFiles.length} archivos...` : `Subir ${selectedFiles.length} archivo(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadModal;