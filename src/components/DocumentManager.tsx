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
  File,
  FolderOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DocumentFile {
  name: string;
  size: number;
  type?: string;
  created_at?: string;
  url?: string;
  path: string;
  source: 'supabase' | 'chat';
}

interface DocumentManagerProps {
  casoId: string;
  readOnly?: boolean;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ casoId, readOnly = false }) => {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, [casoId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      // Cargar documentos de Supabase Storage usando la estructura correcta: casos/{casoId}/adjuntos/
      const { data: files, error } = await supabase.storage
        .from('documentos_legales')
        .list(`casos/${casoId}/adjuntos`, {
          limit: 100,
          offset: 0,
        });

      let supabaseDocuments: DocumentFile[] = [];
      
      if (!error && files) {
        supabaseDocuments = files
          .filter(file => file.name !== '.readme.txt') // Filtrar archivo interno
          .map(file => ({
            name: file.name,
            size: file.metadata?.size || 0,
            type: file.metadata?.mimetype,
            created_at: file.created_at,
            path: `casos/${casoId}/adjuntos/${file.name}`,
            source: 'supabase' as const
          }));
      } else if (error) {
        console.warn('Error loading from Supabase Storage:', error);
      }

      // Cargar documentos del localStorage como fallback (de conversaciones de chat anteriores)
      const storedDocs = localStorage.getItem(`documents_${casoId}`);
      let chatDocuments: DocumentFile[] = [];
      
      if (storedDocs) {
        try {
          const parsedDocs = JSON.parse(storedDocs);
          if (Array.isArray(parsedDocs)) {
            chatDocuments = parsedDocs.map(doc => ({
              name: doc.name,
              size: doc.size,
              type: doc.type,
              created_at: doc.lastModified ? new Date(doc.lastModified).toISOString() : undefined,
              path: `localStorage/${doc.name}`,
              url: doc.data,
              source: 'chat' as const
            }));
          }
        } catch (e) {
          console.warn('Error parsing localStorage documents:', e);
        }
      }

      // Combinar documentos, priorizando los de Supabase
      const allDocuments = [...supabaseDocuments, ...chatDocuments];
      setDocuments(allDocuments);

    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los documentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedFiles: DocumentFile[] = [];

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

        // Generar nombre único para evitar conflictos
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const filePath = `casos/${casoId}/adjuntos/${fileName}`;

        console.log('Attempting to upload file:', { fileName, filePath, casoId });

        // Subir archivo a Supabase Storage con la estructura correcta
        const { error: uploadError } = await supabase.storage
          .from('documentos_legales')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          toast({
            title: "Error al subir archivo",
            description: `No se pudo subir ${file.name}: ${uploadError.message}`,
            variant: "destructive",
          });
          continue;
        }

        const documentFile: DocumentFile = {
          name: file.name,
          size: file.size,
          type: file.type,
          created_at: new Date().toISOString(),
          path: filePath,
          source: 'supabase'
        };

        uploadedFiles.push(documentFile);
      }

      if (uploadedFiles.length > 0) {
        // Recargar la lista de documentos
        await loadDocuments();
        
        toast({
          title: "Documentos subidos",
          description: `Se subieron ${uploadedFiles.length} documento(s) exitosamente.`,
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

  const handleDeleteDocument = async (document: DocumentFile) => {
    try {
      if (document.source === 'chat') {
        // Eliminar del localStorage
        const storedDocs = localStorage.getItem(`documents_${casoId}`);
        if (storedDocs) {
          const parsedDocs = JSON.parse(storedDocs);
          const updatedDocs = parsedDocs.filter((doc: any) => doc.name !== document.name);
          localStorage.setItem(`documents_${casoId}`, JSON.stringify(updatedDocs));
          await loadDocuments();
        }
      } else {
        // Eliminar de Supabase Storage
        const { error } = await supabase.storage
          .from('documentos_legales')
          .remove([document.path]);

        if (error) {
          console.error('Error deleting document:', error);
          toast({
            title: "Error",
            description: "Error al eliminar el documento",
            variant: "destructive",
          });
          return;
        }

        // Recargar la lista de documentos
        await loadDocuments();
      }
      
      toast({
        title: "Documento eliminado",
        description: "El documento ha sido eliminado exitosamente.",
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el documento",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocument = async (document: DocumentFile) => {
    try {
      if (document.source === 'chat' && document.url) {
        // Descargar desde localStorage
        const link = window.document.createElement('a');
        link.href = document.url;
        link.download = document.name;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        return;
      }

      // Descargar de Supabase Storage
      const { data, error } = await supabase.storage
        .from('documentos_legales')
        .download(document.path);

      if (error) {
        console.error('Error downloading document:', error);
        toast({
          title: "Error",
          description: "Error al descargar el documento",
          variant: "destructive",
        });
        return;
      }

      // Crear URL temporal y descargar
      const url = URL.createObjectURL(data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
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

  const getFileIcon = (type?: string) => {
    if (!type) return <File className="h-4 w-4" />;
    if (type.startsWith('image/')) return <Eye className="h-4 w-4" />;
    if (type === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Fecha desconocida';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Cargando documentos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-blue-600" />
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay documentos adjuntos a este caso
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              {!readOnly 
                ? "Puedes subir documentos usando el botón 'Subir Documento'"
                : "Este caso no tiene documentos adjuntos"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((document, index) => (
              <motion.div
                key={`${document.path}-${index}`}
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
                      {formatFileSize(document.size)} • {formatDate(document.created_at)}
                      {document.source === 'chat' && (
                        <span className="ml-1 text-orange-600">(Chat)</span>
                      )}
                      {document.source === 'supabase' && (
                        <span className="ml-1 text-green-600">(Dashboard)</span>
                      )}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {document.type?.split('/')[1]?.toUpperCase() || 'FILE'}
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
                      onClick={() => handleDeleteDocument(document)}
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
                  <li>• Los documentos se guardan de forma segura y protegida</li>
                  <li>• Los documentos marcados "(Chat)" provienen de tu conversación inicial</li>
                  <li>• Los documentos marcados "(Dashboard)" fueron subidos desde este panel</li>
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
