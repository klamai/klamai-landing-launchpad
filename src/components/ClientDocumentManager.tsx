
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Upload, 
  Trash2, 
  Eye,
  Calendar,
  User,
  FileIcon,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useClientDocumentManagement } from '@/hooks/useClientDocumentManagement';
import ClientDocumentUploadModal from '@/components/ClientDocumentUploadModal';
import DocumentViewer from '@/components/DocumentViewer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';

interface ClientDocumentManagerProps {
  casoId: string;
}

const ClientDocumentManager: React.FC<ClientDocumentManagerProps> = ({ casoId }) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { 
    documentosCliente, 
    loading, 
    error,
    downloadDocument, 
    deleteDocument, 
    getSignedUrl,
    refetch 
  } = useClientDocumentManagement(casoId);

  const handleUploadSuccess = () => {
    refetch();
    toast({
      title: "Éxito",
      description: "Documento subido correctamente",
    });
  };

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

  const handleDelete = async (documentoId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este documento?')) {
      const result = await deleteDocument(documentoId);
      if (result.success) {
        toast({
          title: "Éxito",
          description: "Documento eliminado correctamente",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al eliminar el documento",
          variant: "destructive",
        });
      }
    }
  };

  const handleView = async (documento: any) => {
    try {
      console.log('Intentando ver documento:', documento);
      const signedUrl = await getSignedUrl(documento);
      console.log('URL firmada obtenida:', signedUrl);
      
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
      console.error('Error al cargar documento:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el documento",
        variant: "destructive",
      });
    }
  };

  const handleRetry = () => {
    console.log('Reintentando cargar documentos...');
    refetch();
  };

  const getTipoDocumentoBadge = (tipo: string) => {
    const tipos = {
      evidencia: { label: 'Evidencia', color: 'bg-blue-100 text-blue-800' },
      contrato: { label: 'Contrato', color: 'bg-green-100 text-green-800' },
      correspondencia: { label: 'Correspondencia', color: 'bg-purple-100 text-purple-800' },
      identificacion: { label: 'Identificación', color: 'bg-orange-100 text-orange-800' },
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

  console.log('=== CLIENT DOCUMENT MANAGER STATE ===');
  console.log('Caso ID:', casoId);
  console.log('Usuario:', user?.id);
  console.log('Loading:', loading);
  console.log('Error:', error);
  console.log('Documentos encontrados:', documentosCliente.length);
  console.log('Documentos data:', documentosCliente);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Documentos del Cliente
            </CardTitle>
            <div className="flex items-center gap-2">
              {error && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reintentar
                </Button>
              )}
              <Button onClick={() => setIsUploadModalOpen(true)} className="gap-2">
                <Upload className="h-4 w-4" />
                Subir Documento
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Error al cargar documentos</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <div className="mt-2 text-xs text-red-500">
                <p>Información de debugging:</p>
                <p>• Caso ID: {casoId}</p>
                <p>• Usuario ID: {user?.id}</p>
                <p>• Email: {user?.email}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando documentos...</p>
              </div>
            </div>
          ) : documentosCliente.length === 0 && !error ? (
            <div className="text-center py-8">
              <FileIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No hay documentos
              </h3>
              <p className="text-muted-foreground mb-4">
                No se encontraron documentos para este caso.
              </p>
              <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded border">
                <p className="font-medium mb-1">Información de debugging:</p>
                <p>• Caso ID: {casoId}</p>
                <p>• Usuario ID: {user?.id}</p>
                <p>• Email: {user?.email}</p>
                <p>• Estado: {loading ? 'Cargando' : 'Carga completa'}</p>
                <p>• Documentos encontrados: {documentosCliente.length}</p>
              </div>
              <Button 
                onClick={() => setIsUploadModalOpen(true)} 
                className="gap-2 mt-4"
              >
                <Upload className="h-4 w-4" />
                Subir Primer Documento
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentosCliente.map((documento) => (
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(documento.id)}
                          title="Eliminar documento"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ClientDocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        casoId={casoId}
        onUploadSuccess={handleUploadSuccess}
      />

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

export default ClientDocumentManager;
