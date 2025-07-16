
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DocumentoCliente {
  id: string;
  caso_id: string;
  cliente_id: string;
  tipo_documento: string;
  nombre_archivo: string;
  ruta_archivo: string;
  tamaño_archivo?: number;
  descripcion?: string;
  fecha_subida: string;
  created_at: string;
}

export const useClientDocumentManagement = (casoId?: string) => {
  const [documentosCliente, setDocumentosCliente] = useState<DocumentoCliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDocumentosCliente = async () => {
    if (!casoId || !user) {
      console.log('[ClientDocumentManagement] Sin casoId o usuario');
      setDocumentosCliente([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('[ClientDocumentManagement] Iniciando fetch para caso:', casoId);
      console.log('[ClientDocumentManagement] Usuario cliente:', user.id);
      
      // Verificar que el usuario es cliente y propietario del caso
      const { data: casoData, error: casoError } = await supabase
        .from('casos')
        .select('id, cliente_id, estado')
        .eq('id', casoId)
        .eq('cliente_id', user.id)
        .single();

      if (casoError) {
        console.error('[ClientDocumentManagement] Error obteniendo caso:', casoError);
        throw new Error('No se pudo acceder al caso o no eres el propietario');
      }

      console.log('[ClientDocumentManagement] Caso verificado:', casoData);

      // Obtener documentos del cliente
      const { data, error } = await supabase
        .from('documentos_cliente')
        .select('*')
        .eq('caso_id', casoId)
        .eq('cliente_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ClientDocumentManagement] Error consultando documentos:', error);
        throw error;
      }

      console.log('[ClientDocumentManagement] Documentos encontrados:', data?.length || 0);
      setDocumentosCliente(data || []);
      
    } catch (error) {
      console.error('[ClientDocumentManagement] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (
    file: File,
    tipoDocumento: string,
    descripcion?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!casoId || !user) {
      return { success: false, error: 'Usuario no autenticado o caso no especificado' };
    }

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `casos/${casoId}/documentos_cliente/${fileName}`;

      console.log('[ClientDocumentManagement] Subiendo documento con path:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('documentos_legales')
        .upload(filePath, file);

      if (uploadError) {
        console.error('[ClientDocumentManagement] Error al subir archivo:', uploadError);
        throw uploadError;
      }

      const { error: dbError } = await supabase
        .from('documentos_cliente')
        .insert({
          caso_id: casoId,
          cliente_id: user.id,
          tipo_documento: tipoDocumento,
          nombre_archivo: file.name,
          ruta_archivo: filePath,
          tamaño_archivo: file.size,
          descripcion: descripcion || null
        });

      if (dbError) {
        console.error('[ClientDocumentManagement] Error al guardar metadatos:', dbError);
        await supabase.storage
          .from('documentos_legales')
          .remove([filePath]);
        throw dbError;
      }

      console.log('[ClientDocumentManagement] Documento subido exitosamente');
      await fetchDocumentosCliente();

      return { success: true };
    } catch (error) {
      console.error('[ClientDocumentManagement] Error uploading document:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  const getSignedUrl = async (documento: DocumentoCliente): Promise<string | null> => {
    try {
      console.log('[ClientDocumentManagement] Obteniendo URL firmada para:', documento.ruta_archivo);
      
      const { data, error } = await supabase.storage
        .from('documentos_legales')
        .createSignedUrl(documento.ruta_archivo, 3600);

      if (error) {
        console.error('[ClientDocumentManagement] Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('[ClientDocumentManagement] Error getting signed URL:', error);
      return null;
    }
  };

  const downloadDocument = async (documento: DocumentoCliente) => {
    try {
      const signedUrl = await getSignedUrl(documento);
      if (!signedUrl) {
        throw new Error('No se pudo generar la URL de descarga');
      }

      const response = await fetch(signedUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = documento.nombre_archivo;
      link.click();
      
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[ClientDocumentManagement] Error downloading document:', error);
      throw error;
    }
  };

  const deleteDocument = async (documentoId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      const { data: documento } = await supabase
        .from('documentos_cliente')
        .select('ruta_archivo, cliente_id')
        .eq('id', documentoId)
        .eq('cliente_id', user.id)
        .single();

      if (!documento) {
        return { success: false, error: 'Documento no encontrado o no tienes permisos' };
      }

      const { error: dbError } = await supabase
        .from('documentos_cliente')
        .delete()
        .eq('id', documentoId)
        .eq('cliente_id', user.id);

      if (dbError) {
        throw dbError;
      }

      await supabase.storage
        .from('documentos_legales')
        .remove([documento.ruta_archivo]);

      await fetchDocumentosCliente();

      return { success: true };
    } catch (error) {
      console.error('[ClientDocumentManagement] Error deleting document:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  useEffect(() => {
    if (casoId && user) {
      fetchDocumentosCliente();
    }
  }, [casoId, user]);

  return {
    documentosCliente,
    loading,
    error,
    uploadDocument,
    downloadDocument,
    deleteDocument,
    getSignedUrl,
    refetch: fetchDocumentosCliente
  };
};
