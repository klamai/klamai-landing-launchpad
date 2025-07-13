
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Eye,
  AlertCircle,
  CheckCircle,
  File
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Document {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  data?: string; // base64 data
}

interface DocumentManagerProps {
  casoId: string;
  readOnly?: boolean;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ casoId, readOnly = false }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, [casoId]);

  const loadDocuments = () => {
    try {
      const storedDocs = localStorage.getItem(`documents_${casoId}`);
      if (storedDocs) {
        const parsedDocs = JSON.parse(storedDocs);
        setDocuments(Array.isArray(parsedDocs) ? parsedDocs : []);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    }
  };

  const saveDocuments = (newDocuments: Document[]) => {
    try {
      localStorage.setItem(`documents_${casoId}`, JSON.stringify(newDocuments));
      setDocuments(newDocuments);
    } catch (error) {
      console.error('Error saving documents:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los documentos",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newDocuments: Document[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validar tamaño (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Archivo demasiado grande",
            description: `${file.name} es demasiado grande. Máximo 10MB por archivo.`,
            variant: "destructive",
          });
          continue;
        }

        // Validar tipo de archivo
        const allowedTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Tipo de archivo no permitido",
            description: `${file.name} no es un tipo de archivo permitido.`,
            variant: "destructive",
          });
          continue;
        }

        // Convertir a base64
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const document: Document = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          data: fileData
        };

        newDocuments.push(document);
      }

      if (newDocuments.length > 0) {
        const updatedDocuments = [...documents, ...newDocuments];
        saveDocuments(updatedDocuments);
        
        toast({
          title: "Documentos subidos",
          description: `Se subieron ${newDocuments.length} documento(s) exitosamente.`,
        });
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Error al subir los documentos",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Limpiar el input
      event.target.value = '';
    }
  };

  const handleDeleteDocument = (index: number) => {
    const updatedDocuments = documents.filter((_, i) => i !== index);
    saveDocuments(updatedDocuments);
    
    toast({
      title: "Documento eliminado",
      description: "El documento ha sido eliminado exitosamente.",
    });
  };

  const handleDownloadDocument = (document: Document) => {
    if (!document.data) return;

    try {
      const link = window.document.createElement('a');
      link.href = document.data;
      link.download = document.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Error al descargar el documento",
        variant: "destructive",
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
    if (type.startsWith('image/')) return <Eye className="h-4 w-4" />;
    if (type === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Documentos del Caso
          </CardTitle>
          {!readOnly && (
            <div className="relative">
              <Input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                onChange={handleFileUpload}
                disabled={uploading}
                className="absolute inset-0 opacity-0 cursor-pointer"
                id="file-upload"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                className="flex items-center gap-2"
                asChild
              >
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Subiendo...' : 'Subir Documento'}
                </label>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No hay documentos adjuntos a este caso
            </p>
            {!readOnly && (
              <p className="text-sm text-gray-400">
                Puedes subir documentos usando el botón "Subir Documento"
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((document, index) => (
              <motion.div
                key={`${document.name}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {getFileIcon(document.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {document.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(document.size)} • {new Date(document.lastModified).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {document.type.split('/')[1]?.toUpperCase() || 'FILE'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 ml-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadDocument(document)}
                    className="h-8 w-8 p-0"
                    title="Descargar"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(index)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {!readOnly && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Información sobre documentos:</p>
                <ul className="space-y-1">
                  <li>• Tamaño máximo por archivo: 10MB</li>
                  <li>• Formatos permitidos: PDF, DOC, DOCX, TXT, JPG, PNG, GIF</li>
                  <li>• Los documentos se guardan localmente hasta que el caso sea procesado</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentManager;
