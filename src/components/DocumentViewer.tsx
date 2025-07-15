
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Download, FileText, Image as ImageIcon, File, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    name: string;
    url: string;
    type?: string;
    size?: number;
  } | null;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  isOpen,
  onClose,
  document
}) => {
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  if (!document) return null;

  const isPDF = document.name.toLowerCase().endsWith('.pdf') || document.type?.includes('pdf');
  const isImage = document.type?.startsWith('image/') || 
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(document.name);
  const isMarkdown = document.name.toLowerCase().endsWith('.md') || 
    document.name.toLowerCase().endsWith('.markdown');
  const isTextFile = document.name.toLowerCase().endsWith('.txt') || 
    document.name.toLowerCase().endsWith('.rtf') ||
    document.name.toLowerCase().endsWith('.csv') ||
    isMarkdown;

  // Función para leer el contenido de archivos de texto
  const loadTextContent = async () => {
    if (!isTextFile) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(document.url);
      if (!response.ok) {
        throw new Error('Error al cargar el archivo');
      }
      const text = await response.text();
      setFileContent(text);
    } catch (err) {
      console.error('Error loading text content:', err);
      setError('No se pudo cargar el contenido del archivo');
    } finally {
      setLoading(false);
    }
  };

  // Cargar contenido cuando se abre el modal y es un archivo de texto
  useEffect(() => {
    if (isOpen && isTextFile) {
      loadTextContent();
    } else {
      setFileContent('');
      setError('');
    }
  }, [isOpen, document?.url, isTextFile]);

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = document.url;
    link.download = document.name;
    link.click();
  };

  const handleOpenInNewTab = () => {
    window.open(document.url, '_blank');
  };

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-6 w-6" />;
    if (isPDF) return <FileText className="h-6 w-6" />;
    if (isTextFile) return <FileText className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon()}
            {document.name}
            {document.size && (
              <span className="text-sm text-muted-foreground">
                ({formatFileSize(document.size)})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="flex justify-end mb-4 gap-2">
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Descargar
            </Button>
            {isPDF && (
              <Button variant="outline" onClick={handleOpenInNewTab} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Abrir en nueva pestaña
              </Button>
            )}
          </div>

          <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
            {/* Archivos PDF */}
            {isPDF && (
              <div className="relative">
                <iframe
                  src={document.url}
                  className="w-full h-[60vh]"
                  title={document.name}
                  onError={() => {
                    console.error('Error loading PDF in iframe');
                  }}
                />
                {/* Fallback message si el iframe no funciona */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Si el PDF no se muestra correctamente, usa el botón "Abrir en nueva pestaña"
                  </p>
                </div>
              </div>
            )}

            {/* Archivos de imagen */}
            {isImage && (
              <div className="flex justify-center items-center p-4">
                <img
                  src={document.url}
                  alt={document.name}
                  className="max-w-full max-h-[60vh] object-contain"
                />
              </div>
            )}

            {/* Archivos de texto y markdown */}
            {isTextFile && (
              <div className="p-4 h-[60vh] overflow-auto">
                {loading && (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
                
                {error && (
                  <div className="flex flex-col items-center justify-center h-full text-red-500">
                    <FileText className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Error al cargar el archivo</p>
                    <p className="text-sm">{error}</p>
                    <Button variant="outline" onClick={handleDownload} className="mt-4 gap-2">
                      <Download className="h-4 w-4" />
                      Descargar archivo
                    </Button>
                  </div>
                )}

                {!loading && !error && fileContent && (
                  <>
                    {isMarkdown ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{fileContent}</ReactMarkdown>
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm font-mono bg-white dark:bg-gray-800 p-4 rounded border">
                        {fileContent}
                      </pre>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Otros tipos de archivos */}
            {!isPDF && !isImage && !isTextFile && (
              <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
                <File className="h-16 w-16 mb-4" />
                <p className="text-lg font-medium mb-2">Vista previa no disponible</p>
                <p className="text-sm">
                  Este tipo de archivo no se puede previsualizar en el navegador.
                </p>
                <Button variant="outline" onClick={handleDownload} className="mt-4 gap-2">
                  <Download className="h-4 w-4" />
                  Descargar archivo
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewer;
