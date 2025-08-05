import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Grid3X3, List, Scale, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAssignedCases } from '@/hooks/queries/useAssignedCases';
import CaseCard from '@/components/shared/CaseCard';
import CaseDetailModal from '@/components/lawyer/CaseDetailModal';
import DocumentUploadModal from '@/components/shared/DocumentUploadModal';
import DocumentViewer from '@/components/shared/DocumentViewer';
import { useToast } from '@/hooks/use-toast';
import { useDocumentManagement } from '@/hooks/shared/useDocumentManagement';
import { useClientDocumentManagement } from '@/hooks/client/useClientDocumentManagement';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// Componente de acceso no autorizado
const UnauthorizedAccess = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Acceso No Autorizado
        </h2>
        <p className="text-red-600 dark:text-red-300 mb-4">
          Solo los abogados regulares pueden acceder a sus casos asignados.
        </p>
        <button
          onClick={() => window.location.href = '/abogados/dashboard'}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Volver al Dashboard
        </button>
      </div>
    </div>
  </div>
);

const AssignedCasesManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterState, setFilterState] = useState<string>('all');
  
  // Modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<any>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedCaseForUpload, setSelectedCaseForUpload] = useState<string>('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  
  const { data: cases, isLoading, error } = useAssignedCases();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Document management hooks - only initialize when we have a selected case
  const { 
    documentosResolucion, 
    loading: documentsLoading, 
    uploadDocument, 
    deleteDocument,
    refetch: refetchDocuments
  } = useDocumentManagement(selectedCaseDetail?.id);
  
  const { 
    documentosCliente, 
    loading: clientDocumentsLoading,
    refetch: refetchClientDocuments
  } = useClientDocumentManagement(selectedCaseDetail?.id);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando casos asignados...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Error al cargar casos
            </h2>
            <p className="text-red-600 dark:text-red-300 mb-4">
              {error.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtrar casos basado en búsqueda y estado
  const filteredCases = (cases || []).filter(caso => {
    const matchesSearch = !searchTerm || 
      caso.motivo_consulta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caso.nombre_borrador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caso.apellido_borrador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caso.email_borrador?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesState = filterState === 'all' || caso.estado === filterState;
    
    return matchesSearch && matchesState;
  });

  const handleViewDetails = async (casoId: string) => {
    try {
      // Find the case in our current cases array
      const caseDetails = (cases || []).find(c => c.id === casoId);
      if (caseDetails) {
        setSelectedCaseDetail({
          ...caseDetails,
          asignaciones_casos: [
            {
              abogado_id: user.id,
              estado_asignacion: 'activa', // Default for assigned cases
              fecha_asignacion: caseDetails.created_at,
              notas_asignacion: '',
              profiles: {
                nombre: user.user_metadata?.nombre || user.email,
                apellido: user.user_metadata?.apellido || '',
                email: user.email,
              }
            }
          ]
        });
        setDetailModalOpen(true);
      } else {
        toast({
          title: "Error",
          description: "No se pudo cargar la información del caso",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching case details:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del caso",
        variant: "destructive",
      });
    }
  };

  const handleGenerateResolution = (casoId: string) => {
    // Implementar generación de resolución
    toast({
      title: "Funcionalidad en desarrollo",
      description: "La generación de resoluciones estará disponible pronto",
    });
  };

  const handleUploadDocument = (casoId: string) => {
    setSelectedCaseForUpload(casoId);
    setUploadModalOpen(true);
  };

  const handleSendMessage = (casoId: string) => {
    // Implementar envío de mensajes
    toast({
      title: "Funcionalidad en desarrollo",
      description: "El sistema de mensajes estará disponible pronto",
    });
  };

  const handleAssignLawyer = () => {
    // Los abogados regulares no pueden asignar casos
    toast({
      title: "No autorizado",
      description: "Solo los super administradores pueden asignar casos",
      variant: "destructive",
    });
  };

  const handleDocumentUpload = async (file: File, description: string) => {
    if (!selectedCaseForUpload) {
      toast({
        title: "Error",
        description: "No se ha seleccionado un caso",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await uploadDocument(file, 'resolucion', description);
      if (result.success) {
        toast({
          title: "Éxito",
          description: "Documento subido correctamente",
        });
        refetchDocuments();
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
    }
  };

  const handleViewDocument = (document: any) => {
    setSelectedDocument(document);
    setViewerOpen(true);
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const result = await deleteDocument(documentId);
      if (result.success) {
        toast({
          title: "Éxito",
          description: "Documento eliminado correctamente",
        });
        refetchDocuments();
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al eliminar el documento",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el documento",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mis Casos Asignados
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredCases.length} de {cases?.length || 0} casos
          </p>
        </div>
        
        {/* Controles de vista */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por cliente, motivo o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">Todos los estados</option>
          <option value="disponible">Disponible</option>
          <option value="agotado">Agotado</option>
          <option value="cerrado">Cerrado</option>
          <option value="listo_para_propuesta">Listo para Propuesta</option>
        </select>
      </div>

      {/* Lista de casos */}
      {filteredCases.length === 0 ? (
        <div className="text-center py-12">
          <Scale className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No hay casos asignados
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || filterState !== 'all' 
              ? 'No se encontraron casos con los filtros aplicados'
              : 'Aún no tienes casos asignados'
            }
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        }>
          {filteredCases.map((caso) => (
            <CaseCard
              key={caso.id}
              caso={{
                id: caso.id,
                motivo_consulta: caso.motivo_consulta || '',
                resumen_caso: caso.resumen_caso,
                especialidad_id: caso.especialidad_id || 0,
                estado: caso.estado,
                created_at: caso.created_at,
                cliente_id: '',
                valor_estimado: caso.valor_estimado || '',
                tipo_lead: caso.tipo_lead,
                ciudad_borrador: caso.ciudad_borrador || '',
                nombre_borrador: caso.nombre_borrador,
                apellido_borrador: caso.apellido_borrador,
                email_borrador: caso.email_borrador,
                telefono_borrador: caso.telefono_borrador,
                tipo_perfil_borrador: 'individual',
                razon_social_borrador: '',
                nif_cif_borrador: '',
                nombre_gerente_borrador: '',
                direccion_fiscal_borrador: '',
                preferencia_horaria_contacto: '',
                documentos_adjuntos: null,
                especialidades: caso.especialidades,
                profiles: null,
                cerrado_por_profile: caso.cerrado_por_profile,
                asignaciones_casos: [{
                  abogado_id: '',
                  estado_asignacion: 'activa',
                  notas_asignacion: caso.notas_asignacion,
                  profiles: { nombre: 'Tú', apellido: '', email: '' }
                }]
              }}
              onViewDetails={handleViewDetails}
              onAssignLawyer={handleAssignLawyer}
              onGenerateResolution={handleGenerateResolution}
              onUploadDocument={handleUploadDocument}
              onSendMessage={handleSendMessage}
              hideAssignButton={true}
              showProminentNotes={true}
              hideAssignmentStyling={true}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      <CaseDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedCaseDetail(null);
        }}
        caso={selectedCaseDetail}
        onGenerateResolution={handleGenerateResolution}
        onUploadDocument={handleUploadDocument}
        onSendMessage={handleSendMessage}
      />

      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          setSelectedCaseForUpload('');
        }}
        casoId={selectedCaseForUpload}
        onUploadSuccess={() => {
          refetchDocuments();
          setUploadModalOpen(false);
          setSelectedCaseForUpload('');
          toast({
            title: "Éxito",
            description: "Documento subido correctamente",
          });
        }}
      />

      <DocumentViewer
        isOpen={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
      />
    </motion.div>
  );
};

export default AssignedCasesManagement; 