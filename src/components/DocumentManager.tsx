
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Eye,
  AlertCircle,
  CheckCircle,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Document {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  url?: string;
}interface DocumentManagerProps {
  casoId: string;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ casoId }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, [casoId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      // Cargar documentos desde el caso en la base de datos
      const { data: caso, error } = await supabase
        .from('casos')
        .select('documentos_adjuntos')
        .eq('id', casoId)
        .single();

      if (error) {
        console.error('Error loading documents:', error);
        return;
      }

      const storedDocs = caso?.documentos_adjuntos as Document[] || [];
      setDocuments(storedDocs);

    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los documentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newDocuments: Document[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validar tamaño (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Archivo demasiado grande",
            description: `${file.name} excede el límite de 10MB`,
            variant: "destructive"
          });
          continue;
        }

        // Validar tipo de archivo
        const allowedTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/jpg',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Tipo de archivo no permitido",
            description: `${file.name} no es un tipo de archivo permitido`,
            variant: "destructive"
          });
          continue;
        }

        // Crear objeto documento
        const documentData: Document = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        };

        // Si es necesario, subir a Supabase Storage (opcional)
        try {
          const fileName = `${casoId}/${Date.now()}-${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documentos_legales')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Storage upload error:', uploadError);
            // Continuar sin URL si falla la subida
          } else {
            // Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
              .from('documentos_legales')
              .getPublicUrl(fileName);
            
            documentData.url = publicUrl;
          }
        } catch (storageError) {
          console.error('Storage error:', storageError);
          // Continuar sin storage si falla
        }

        newDocuments.push(documentData);
      }

      // Actualizar lista de documentos
      const updatedDocuments = [...documents, ...newDocuments];
      setDocuments(updatedDocuments);

      // Guardar en la base de datos
      const { error: updateError } = await supabase
        .from('casos')
        .update({ documentos_adjuntos: updatedDocuments })
        .eq('id', casoId);

      if (updateError) {
        console.error('Error updating documents:', updateError);
        toast({
          title: "Error",
          description: "No se pudieron guardar los documentos",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Documentos subidos",
        description: `Se subieron ${newDocuments.length} documento(s) exitosamente`,
      });

    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Error al subir los archivos",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Limpiar input
      event.target.value = '';
    }
  };

  const handleDeleteDocument = async (index: number) => {
    try {
      const updatedDocuments = documents.filter((_, i) => i !== index);
      setDocuments(updatedDocuments);

      // Actualizar en la base de datos
      const { error } = await supabase
        .from('casos')
        .update({ documentos_adjuntos: updatedDocuments })
        .eq('id', casoId);

      if (error) {
        console.error('Error deleting document:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el documento",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Documento eliminado",
        description: "El documento se eliminó exitosamente",
      });

    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el documento",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes('image')) return <FileText className="h-5 w-5 text-blue-500" />;
    if (type.includes('word') || type.includes('document')) return <FileText className="h-5 w-5 text-blue-600" />;
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos del Caso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentos del Caso ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Arrastra archivos aquí o haz clic para seleccionar
          </p>
          <Input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button
              variant="outline"
              disabled={isUploading}
              className="cursor-pointer"
              asChild
            >
              <span className="flex items-center gap-2">
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Seleccionar Archivos
                  </>
                )}
              </span>
            </Button>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Máximo 10MB por archivo. Formatos: PDF, DOC, DOCX, JPG, PNG
          </p>
        </div>

        {/* Documents List */}
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No hay documentos adjuntos</p>
            <p className="text-sm text-gray-400">Sube documentos relevantes para tu caso</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getFileIcon(doc.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatFileSize(doc.size)}</span>
                      <span>•</span>
                      <span>{new Date(doc.lastModified).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {doc.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(doc.url, '_blank')}
                      title="Ver documento"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDocument(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Eliminar documento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentManager;
