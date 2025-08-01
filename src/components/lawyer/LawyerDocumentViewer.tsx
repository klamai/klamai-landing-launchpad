
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Eye,
  Calendar,
  User,
  FileIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useDocumentManagement } from '@/hooks/shared/useDocumentManagement';
import DocumentViewer from '@/components/shared/DocumentViewer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LawyerDocumentViewerProps {
  casoId: string;
}

const LawyerDocumentViewer: React.FC<LawyerDocumentViewerProps> = ({ casoId }) => {
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const { toast } = useToast();
  
  const { 
    documentosResolucion, 
    loading, 
    downloadDocument, 
    getSignedUrl
  } = useDocumentManagement(casoId);

  const handleDownload = async (documento: any) => {
    try {
      await downloadDocument(documento);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo descargar el documento",
        variant: "destructive",
      });
    }
  };

  const handleView = async (documento: any) => {
    try {
      console.log('Cliente intentando ver documento de resolución:', documento);
      const signedUrl = await getSignedUrl(documento);
      console.log('URL firmada obtenida para cliente:', signedUrl);
      
      if (signedUrl) {
        setSelectedDocument({ 
          name: documento.nombre_archivo,
          url: signedUrl,
          type: documento.tipo_documento,
          size: documento.tamaño_archivo
        });
        setIsViewerOpen(true);
      } else {
        throw new Error('No se pudo obtener la URL del documento');
      }
    } catch (error) {
      console.error('Error al cargar documento de resolución para cliente:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el documento",
        variant: "destructive",
      });
    }
  };

  const getTipoDocumentoBadge = (tipo: string) => {
    const tipos = {
      resolucion: { label: 'Resolución', color: 'bg-green-100 text-green-800' },
      dictamen: { label: 'Dictamen', color: 'bg-blue-100 text-blue-800' },
      informe: { label: 'Informe', color: 'bg-purple-100 text-purple-800' },
      propuesta: { label: 'Propuesta', color: 'bg-orange-100 text-orange-800' },
      otros: { label: 'Otros', color: 'bg-gray-100 text-gray-800' }
    };
    const tipoInfo = tipos[tipo as keyof typeof tipos] || tipos.otros;
    return <Badge className={tipoInfo.color}>{tipoInfo.label}</Badge>;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Desconocido';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  console.log('LawyerDocumentViewer - Documentos cargados:', documentosResolucion);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando documentos de resolución...</p>
        </div>
      </div>
    );
  }

  if (documentosResolucion.length === 0) {
    return (
      <div className="text-center py-8">
        <FileIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          No hay documentos disponibles
        </h3>
        <p className="text-muted-foreground">
          Los documentos de resolución aparecerán aquí cuando estén disponibles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Documento</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Abogado</TableHead>
            <TableHead>Tamaño</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documentosResolucion.map((documento) => (
            <TableRow key={documento.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{documento.nombre_archivo}</p>
                    {documento.descripcion && (
                      <p className="text-sm text-muted-foreground">
                        {documento.descripcion}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {getTipoDocumentoBadge(documento.tipo_documento)}
              </TableCell>
              <TableCell>
                {documento.profiles && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">
                      {documento.profiles.nombre} {documento.profiles.apellido}
                    </span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                {formatFileSize(documento.tamaño_archivo)}
              </TableCell>
              <TableCell>
                {format(new Date(documento.fecha_subida), 'dd/MM/yyyy', { locale: es })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(documento)}
                    title="Ver documento"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(documento)}
                    title="Descargar documento"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedDocument && (
        <DocumentViewer
          isOpen={isViewerOpen}
          onClose={() => {
            setIsViewerOpen(false);
            setSelectedDocument(null);
          }}
          document={selectedDocument}
        />
      )}
    </div>
  );
};

export default LawyerDocumentViewer;
