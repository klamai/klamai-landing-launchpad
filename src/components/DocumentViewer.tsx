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
  const [textContent, setTextContent] = useState<string>('');
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);

  if (!document) return null;

  const isPDF = document.name.toLowerCase().endsWith('.pdf') || document.type?.includes('pdf');
  const isImage = document.type?.startsWith('image/') || 
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(document.name);
  const isMarkdown = document.name.toLowerCase().endsWith('.md') || document.type?.includes('markdown');
  const isText = document.name.toLowerCase().endsWith('.txt') || 
    document.type?.startsWith('text/') || 
    /\.(txt|md|json|xml|csv|log)$/i.test(document.name);

  // Cargar contenido de texto cuando se abre el documento
  useEffect(() => {
    if (isOpen && (isMarkdown || isText) && !isPDF && !isImage) {
      setIsLoadingText(true);
      setTextError(null);
      
      fetch(document.url)
        .then(response => {
          if (!response.ok) {
            throw new Error('No se pudo cargar el contenido del archivo');
          }
          return response.text();
        })
        .then(text => {
          setTextContent(text);
          setIsLoadingText(false);
        })
        .catch(error => {
          console.error('Error loading text content:', error);
          setTextError(error.message);
          setIsLoadingText(false);
        });
    }
  }, [isOpen, document.url, isMarkdown, isText, isPDF, isImage]);

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
    if (isMarkdown || isText) return <FileText className="h-6 w-6" />;
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

          <div className="border rounded-lg overflow-hidden bg-background">
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
                <div className="absolute top-2 right-2 bg-background/80 p-2 rounded">
                  <p className="text-xs text-muted-foreground">
                    ¿No se muestra el PDF? 
                    <Button variant="link" className="p-0 h-auto ml-1" onClick={handleOpenInNewTab}>
                      Abrir en nueva pestaña
                    </Button>
                  </p>
                </div>
              </div>
            )}

            {isImage && (
              <div className="flex justify-center items-center p-4">
                <img
                  src={document.url}
                  alt={document.name}
                  className="max-w-full max-h-[60vh] object-contain"
                />
              </div>
            )}

            {isMarkdown && (
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {isLoadingText ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : textError ? (
                  <div className="text-destructive text-center">
                    <p>Error al cargar el contenido: {textError}</p>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{textContent}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}

            {isText && !isMarkdown && (
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {isLoadingText ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : textError ? (
                  <div className="text-destructive text-center">
                    <p>Error al cargar el contenido: {textError}</p>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded">
                    {textContent}
                  </pre>
                )}
              </div>
            )}

            {!isPDF && !isImage && !isText && !isMarkdown && (
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