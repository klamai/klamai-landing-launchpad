import React from 'react';
import { motion } from 'framer-motion';
import { X, Download, FileText, Image as ImageIcon, File } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [textContent, setTextContent] = React.useState('');

  React.useEffect(() => {
    if (!document) return; // Early exit for useEffect if document is null

    const isText = document.type?.startsWith('text/') ||
      /\.(txt|json|xml|csv|html|js|ts|jsx|tsx|css|scss)$/i.test(document.name);
    const isMarkdown = document.type === 'text/markdown' || document.name.toLowerCase().endsWith('.md');

    if (isText || isMarkdown) {
      fetch(document.url)
        .then(response => response.text())
        .then(text => setTextContent(text))
        .catch(() => setTextContent('No se pudo cargar el contenido del archivo'));
    }
  }, [document, textContent]); // Add document to dependency array

  if (!document) return null;

  const isPDF = document.name.toLowerCase().endsWith('.pdf') || document.type?.includes('pdf');
  const isImage = document.type?.startsWith('image/') || 
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(document.name);
  const isText = document.type?.startsWith('text/') ||
    /\.(txt|json|xml|csv|html|js|ts|jsx|tsx|css|scss)$/i.test(document.name);
  const isMarkdown = document.type === 'text/markdown' || document.name.toLowerCase().endsWith('.md');

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = document.url;
    link.download = document.name;
    link.click();
  };

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-6 w-6" />;
    if (isPDF) return <FileText className="h-6 w-6" />;
    if (isText || isMarkdown) return <FileText className="h-6 w-6" />;
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
          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Descargar
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
            {isPDF && (
              <iframe
                src={document.url}
                className="w-full h-[60vh]"
                title={document.name}
              />
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


            {isText && (
              <div className="p-4 h-[60vh] overflow-auto">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {textContent}
                </pre>
              </div>
            )}

            {isMarkdown && (
              <div className="p-4 h-[60vh] overflow-auto prose dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {textContent}
                </ReactMarkdown>
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
