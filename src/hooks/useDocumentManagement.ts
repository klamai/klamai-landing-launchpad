import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DocumentoResolucion {
  id: string;
  caso_id: string;
  abogado_id: string;
  tipo_documento: string;
  nombre_archivo: string;
  ruta_archivo: string;
  tamaño_archivo?: number;
  descripcion?: string;
  version?: number;
  es_version_final?: boolean;
  fecha_subida: string;
  created_at: string;
  profiles?: {
    nombre: string;
    apellido: string;
    email: string;
  };
}

export const useDocumentManagement = (casoId?: string) => {
  const [documentosResolucion, setDocumentosResolucion] = useState<DocumentoResolucion[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchDocumentosResolucion = async () => {
    if (!casoId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documentos_resolucion')
        .select(`
          *,
          profiles:abogado_id (
            nombre,
            apellido,
            email
          )
        `)
        .eq('caso_id', casoId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documentos resolucion:', error);
        return;
      }

      setDocumentosResolucion(data || []);
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
      // Generar nombre único para el archivo usando la estructura correcta
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${file.name}`;
      // Usar la estructura de paths que esperan las políticas RLS: casos/{caso_id}/documentos_resolucion/
      const filePath = `casos/${casoId}/documentos_resolucion/${fileName}`;

      console.log('Subiendo archivo con path:', filePath);

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documentos_legales')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error al subir archivo:', uploadError);
        throw uploadError;
      }

      // Obtener URL del archivo (usamos getPublicUrl ya que el bucket es privado)
      const { data: { publicUrl } } = supabase.storage
        .from('documentos_legales')
        .getPublicUrl(filePath);

      console.log('URL pública generada:', publicUrl);

      // Guardar metadatos en la base de datos
      const { error: dbError } = await supabase
        .from('documentos_resolucion')
        .insert({
          caso_id: casoId,
          abogado_id: user.id,
          tipo_documento: tipoDocumento,
          nombre_archivo: file.name,
          ruta_archivo: publicUrl,
          tamaño_archivo: file.size,
          descripcion: descripcion || null,
          version: 1,
          es_version_final: false
        });

      if (dbError) {
        console.error('Error al guardar metadatos:', dbError);
        // Si falla la inserción en BD, eliminar el archivo subido
        await supabase.storage
          .from('documentos_legales')
          .remove([filePath]);
        throw dbError;
      }

      console.log('Documento subido exitosamente');

      // Refrescar la lista de documentos
      await fetchDocumentosResolucion();

      return { success: true };
    } catch (error) {
      console.error('Error uploading document:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  const downloadDocument = async (documento: DocumentoResolucion) => {
    try {
      const response = await fetch(documento.ruta_archivo);
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
        .from('documentos_resolucion')
        .select('ruta_archivo, abogado_id')
        .eq('id', documentoId)
        .single();

      if (!documento) {
        return { success: false, error: 'Documento no encontrado' };
      }

      // Verificar que el usuario es el propietario o es super admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, tipo_abogado')
        .eq('id', user.id)
        .single();

      const isOwner = documento.abogado_id === user.id;
      const isSuperAdmin = profile?.role === 'abogado' && profile?.tipo_abogado === 'super_admin';

      if (!isOwner && !isSuperAdmin) {
        return { success: false, error: 'No tienes permisos para eliminar este documento' };
      }

      // Eliminar de la base de datos
      const { error: dbError } = await supabase
        .from('documentos_resolucion')
        .delete()
        .eq('id', documentoId);

      if (dbError) {
        throw dbError;
      }

      // Extraer el path del archivo de la URL para la nueva estructura
      const url = new URL(documento.ruta_archivo);
      // Para la nueva estructura: casos/{caso_id}/documentos_resolucion/{filename}
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(-4).join('/'); // obtener "casos/{caso_id}/documentos_resolucion/filename"

      console.log('Eliminando archivo con path:', filePath);

      // Eliminar archivo del storage
      await supabase.storage
        .from('documentos_legales')
        .remove([filePath]);

      // Refrescar la lista
      await fetchDocumentosResolucion();

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
    if (casoId) {
      fetchDocumentosResolucion();
    }
  }, [casoId]);

  return {
    documentosResolucion,
    loading,
    uploadDocument,
    downloadDocument,
    deleteDocument,
    refetch: fetchDocumentosResolucion
  };
};