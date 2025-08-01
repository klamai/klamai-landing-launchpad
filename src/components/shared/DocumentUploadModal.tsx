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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState('resolucion');
  const [descripcion, setDescripcion] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { uploadDocument } = useDocumentManagement(casoId);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo no puede ser mayor a 10MB",
          variant: "destructive",
        });
        return;
      }

      // Validar tipo de archivo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Tipo de archivo no permitido. Solo se aceptan PDF, imágenes y documentos de Word",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadDocument(selectedFile, tipoDocumento, descripcion);
      
      if (result.success) {
        toast({
          title: "Éxito",
          description: "Documento subido correctamente",
        });
        onUploadSuccess();
        handleClose();
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al subir el documento",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "Error al subir el documento",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setTipoDocumento('resolucion');
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
            Subir Documento de Resolución
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
              <option value="resolucion">Resolución Legal</option>
              <option value="dictamen">Dictamen</option>
              <option value="informe">Informe Técnico</option>
              <option value="propuesta">Propuesta</option>
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
            <Label htmlFor="file-upload">Seleccionar archivo</Label>
            <div className="mt-1">
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,.md"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                className="w-full gap-2"
                disabled={isUploading}
              >
                <Upload className="h-4 w-4" />
                {selectedFile ? 'Cambiar archivo' : 'Seleccionar archivo'}
              </Button>
            </div>
          </div>

          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-700 dark:text-amber-300">
                <p className="font-medium mb-1">Tipos de archivo permitidos:</p>
                <p>PDF, Imágenes (JPG, PNG), Documentos Word (.doc, .docx)</p>
                <p className="mt-1">Tamaño máximo: 10MB</p>
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
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? 'Subiendo...' : 'Subir'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadModal;