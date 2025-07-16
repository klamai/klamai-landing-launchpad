
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
  const { user } = useAuth();

  const fetchDocumentosCliente = async () => {
    if (!casoId || !user) {
      console.log('No se puede buscar documentos - casoId:', casoId, 'user:', !!user);
      return;
    }

    setLoading(true);
    try {
      console.log('Buscando documentos del cliente para caso:', casoId, 'usuario:', user.id);
      
      // Primero, verificar el rol del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, tipo_abogado')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error obteniendo perfil:', profileError);
        return;
      }

      console.log('Perfil del usuario:', profile);

      const { data, error } = await supabase
        .from('documentos_cliente')
        .select('*')
        .eq('caso_id', casoId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documentos cliente:', error);
        return;
      }

      console.log('Documentos cliente encontrados:', data?.length || 0);
      console.log('Documentos cliente data:', data);

      setDocumentosCliente(data || []);
    } catch (error) {
      console.error('Error:', error);
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
      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      // Estructura de paths para documentos del cliente: casos/{caso_id}/documentos_cliente/
      const filePath = `casos/${casoId}/documentos_cliente/${fileName}`;

      console.log('Subiendo documento del cliente con path:', filePath);

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documentos_legales')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error al subir archivo:', uploadError);
        throw uploadError;
      }

      // Guardar metadatos en la base de datos
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
        console.error('Error al guardar metadatos:', dbError);
        // Si falla la inserción en BD, eliminar el archivo subido
        await supabase.storage
          .from('documentos_legales')
          .remove([filePath]);
        throw dbError;
      }

      console.log('Documento del cliente subido exitosamente');

      // Refrescar la lista de documentos
      await fetchDocumentosCliente();

      return { success: true };
    } catch (error) {
      console.error('Error uploading client document:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  const getSignedUrl = async (documento: DocumentoCliente): Promise<string | null> => {
    try {
      console.log('Obteniendo URL firmada para:', documento.ruta_archivo);
      
      const { data, error } = await supabase.storage
        .from('documentos_legales')
        .createSignedUrl(documento.ruta_archivo, 3600); // 1 hora de expiración

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      console.log('URL firmada generada exitosamente:', data.signedUrl);
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
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
      console.error('Error downloading document:', error);
    }
  };

  const deleteDocument = async (documentoId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      // Obtener información del documento para eliminar el archivo
      const { data: documento } = await supabase
        .from('documentos_cliente')
        .select('ruta_archivo, cliente_id')
        .eq('id', documentoId)
        .single();

      if (!documento) {
        return { success: false, error: 'Documento no encontrado' };
      }

      // Verificar que el usuario es el propietario
      if (documento.cliente_id !== user.id) {
        return { success: false, error: 'No tienes permisos para eliminar este documento' };
      }

      // Eliminar de la base de datos
      const { error: dbError } = await supabase
        .from('documentos_cliente')
        .delete()
        .eq('id', documentoId);

      if (dbError) {
        throw dbError;
      }

      console.log('Eliminando archivo con path:', documento.ruta_archivo);

      // Eliminar archivo del storage
      await supabase.storage
        .from('documentos_legales')
        .remove([documento.ruta_archivo]);

      // Refrescar la lista
      await fetchDocumentosCliente();

      return { success: true };
    } catch (error) {
      console.error('Error deleting document:', error);
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
    uploadDocument,
    downloadDocument,
    deleteDocument,
    getSignedUrl,
    refetch: fetchDocumentosCliente
  };
};
