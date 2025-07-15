
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDocumentManagement } from '@/hooks/useDocumentManagement';
import { useToast } from '@/hooks/use-toast';

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
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [uploading, setUploading] = useState(false);
  const { uploadDocument } = useDocumentManagement(casoId);
  const { toast } = useToast();

  // Tipos de documentos permitidos
  const tiposDocumento = [
    { value: 'resolucion', label: 'Resolución Legal' },
    { value: 'dictamen', label: 'Dictamen' },
    { value: 'informe', label: 'Informe' },
    { value: 'contrato', label: 'Contrato' },
    { value: 'escritura', label: 'Escritura' },
    { value: 'sentencia', label: 'Sentencia' },
    { value: 'recurso', label: 'Recurso' },
    { value: 'demanda', label: 'Demanda' },
    { value: 'documento_texto', label: 'Documento de Texto' },
    { value: 'notas', label: 'Notas' },
    { value: 'otro', label: 'Otro' }
  ];

  // Tipos de archivos permitidos (incluyendo texto y markdown)
  const acceptedFileTypes = [
    '.pdf',
    '.doc', '.docx',
    '.txt', '.rtf',
    '.md', '.markdown',
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.csv',
    '.json', '.xml'
  ].join(',');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamaño del archivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo es demasiado grande. Máximo 10MB permitido.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !tipoDocumento) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo y especifica el tipo de documento.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const result = await uploadDocument(selectedFile, tipoDocumento, descripcion);
      
      if (result.success) {
        toast({
          title: "Éxito",
          description: "Documento subido correctamente.",
        });
        onUploadSuccess();
        handleClose();
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al subir el documento.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "Error inesperado al subir el documento.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setTipoDocumento('');
    setDescripcion('');
    setUploading(false);
    onClose();
  };

  const getFileTypeInfo = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isText = ['txt', 'rtf', 'csv'].includes(extension || '');
    const isMarkdown = ['md', 'markdown'].includes(extension || '');
    const isPdf = extension === 'pdf';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
    
    if (isMarkdown) return { type: 'Markdown', icon: '📝', color: 'text-blue-600' };
    if (isText) return { type: 'Texto', icon: '📄', color: 'text-green-600' };
    if (isPdf) return { type: 'PDF', icon: '📋', color: 'text-red-600' };
    if (isImage) return { type: 'Imagen', icon: '🖼️', color: 'text-purple-600' };
    return { type: 'Documento', icon: '📎', color: 'text-gray-600' };
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
          {/* Selector de archivo */}
          <div>
            <Label htmlFor="file-upload">Archivo</Label>
            <Input
              id="file-upload"
              type="file"
              accept={acceptedFileTypes}
              onChange={handleFileSelect}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Formatos permitidos: PDF, Word, Texto (.txt, .md), Imágenes, CSV, JSON, XML
            </p>
          </div>

          {/* Información del archivo seleccionado */}
          {selectedFile && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getFileTypeInfo(selectedFile).icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getFileTypeInfo(selectedFile).type} • {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tipo de documento */}
          <div>
            <Label htmlFor="tipo-documento">Tipo de documento</Label>
            <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecciona el tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                {tiposDocumento.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descripción */}
          <div>
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe brevemente el contenido del documento..."
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !tipoDocumento || uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadModal;
