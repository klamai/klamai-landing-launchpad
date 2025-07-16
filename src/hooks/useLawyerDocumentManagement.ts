
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

export const useLawyerDocumentManagement = (casoId?: string) => {
  const [documentosCliente, setDocumentosCliente] = useState<DocumentoCliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDocumentosCliente = async () => {
    if (!casoId || !user) {
      console.log('[LawyerDocumentManagement] Sin casoId o usuario');
      setDocumentosCliente([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('[LawyerDocumentManagement] Iniciando fetch para caso:', casoId);
      console.log('[LawyerDocumentManagement] Usuario abogado:', user.id);
      
      // Verificar perfil del abogado
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, tipo_abogado')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('[LawyerDocumentManagement] Error obteniendo perfil:', profileError);
        throw new Error('No se pudo obtener el perfil del abogado');
      }

      console.log('[LawyerDocumentManagement] Perfil abogado:', profile);

      if (profile.role !== 'abogado') {
        throw new Error('Solo los abogados pueden usar este hook');
      }

      // Verificar acceso al caso
      const { data: casoData, error: casoError } = await supabase
        .from('casos')
        .select('id, cliente_id, estado')
        .eq('id', casoId)
        .single();

      if (casoError) {
        console.error('[LawyerDocumentManagement] Error obteniendo caso:', casoError);
        throw new Error('No se pudo acceder al caso');
      }

      console.log('[LawyerDocumentManagement] Datos del caso:', casoData);

      // Verificar permisos del abogado
      if (profile.tipo_abogado === 'super_admin') {
        console.log('[LawyerDocumentManagement] Super admin - acceso completo');
      } else {
        // Verificar asignación para abogados regulares
        const { data: asignacion, error: asignacionError } = await supabase
          .from('asignaciones_casos')
          .select('*')
          .eq('caso_id', casoId)
          .eq('abogado_id', user.id)
          .eq('estado_asignacion', 'activa')
          .single();

        if (asignacionError || !asignacion) {
          console.error('[LawyerDocumentManagement] Sin asignación activa:', asignacionError);
          throw new Error('No tienes asignación activa para este caso');
        }
        console.log('[LawyerDocumentManagement] Asignación encontrada:', asignacion);
      }

      // Obtener documentos del cliente
      const { data, error } = await supabase
        .from('documentos_cliente')
        .select('*')
        .eq('caso_id', casoId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[LawyerDocumentManagement] Error consultando documentos:', error);
        throw error;
      }

      console.log('[LawyerDocumentManagement] Documentos encontrados:', data?.length || 0);
      setDocumentosCliente(data || []);
      
    } catch (error) {
      console.error('[LawyerDocumentManagement] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getSignedUrl = async (documento: DocumentoCliente): Promise<string | null> => {
    try {
      console.log('[LawyerDocumentManagement] Obteniendo URL firmada para:', documento.ruta_archivo);
      
      const { data, error } = await supabase.storage
        .from('documentos_legales')
        .createSignedUrl(documento.ruta_archivo, 3600);

      if (error) {
        console.error('[LawyerDocumentManagement] Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('[LawyerDocumentManagement] Error getting signed URL:', error);
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
      console.error('[LawyerDocumentManagement] Error downloading document:', error);
      throw error;
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
    downloadDocument,
    getSignedUrl,
    refetch: fetchDocumentosCliente
  };
};
