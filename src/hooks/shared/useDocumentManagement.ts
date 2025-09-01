import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SecureLogger } from '@/utils/secureLogging';
import { es } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { sanitizeFileName } from '@/lib/utils';

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
  abogado?: {
    nombre: string;
    apellido: string;
  };
}

export const useDocumentManagement = (casoId?: string) => {
  const [documentosResolucion, setDocumentosResolucion] = useState<DocumentoResolucion[]>([]);
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const { user } = useAuth();

  // Validación de seguridad para abogados y super admins
  useEffect(() => {
    const validateAccess = async () => {
      if (!user || !casoId) {
        setAccessDenied(true);
        return;
      }

      try {
        console.log('🔍 Validando acceso a useDocumentManagement:', user.id, 'caso:', casoId);
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, tipo_abogado, id, email')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('❌ Error obteniendo perfil:', profileError);
          setAccessDenied(true);
          return;
        }

        if (!profile) {
          SecureLogger.warn('No se pudo obtener el perfil del usuario', 'document_management');
          return;
        }

        // Solo abogados pueden acceder a documentos de resolución
        if (profile.role !== 'abogado') {
          console.log('🚫 Solo abogados pueden acceder a documentos de resolución');
          setAccessDenied(true);
          return;
        }

        // Verificar acceso al caso
        const { data: casoData, error: casoError } = await supabase
          .from('casos')
          .select('id, cliente_id, estado')
          .eq('id', casoId)
          .single();

        if (casoError) {
          console.error('❌ Error obteniendo datos del caso:', casoError);
          setAccessDenied(true);
          return;
        }

        console.log('Datos del caso:', casoData);

        if (profile.tipo_abogado === 'super_admin') {
          console.log('✅ Acceso autorizado para super admin');
          setAccessDenied(false);
        } else {
          // Verificar asignación para abogados regulares
          const { data: asignacion, error: asignacionError } = await supabase
            .from('asignaciones_casos')
            .select('*')
            .eq('caso_id', casoId)
            .eq('abogado_id', user.id)
            .in('estado_asignacion', ['activa', 'completada'])
            .single();

          if (asignacionError || !asignacion) {
            console.log('🚫 Abogado regular no tiene asignación activa para este caso');
            setAccessDenied(true);
          } else {
            console.log('✅ Acceso autorizado para abogado regular asignado');
            setAccessDenied(false);
          }
        }
      } catch (error) {
        console.error('❌ Error general en validación:', error);
        setAccessDenied(true);
      }
    };

    validateAccess();
  }, [user, casoId]);

  const fetchDocumentosResolucion = async () => {
    if (!casoId || accessDenied) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documentos_resolucion')
        .select(`
          *,
          abogado:abogado_id (
            nombre,
            apellido
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
    if (!casoId || !user || accessDenied) {
      return { success: false, error: 'Acceso no autorizado' };
    }

    // Validar que el archivo existe y tiene un nombre válido
    if (!file || !file.name || typeof file.name !== 'string') {
      return { success: false, error: 'Archivo inválido o sin nombre' };
    }

    // Validar el tipo de documento
    if (!tipoDocumento || typeof tipoDocumento !== 'string') {
      return { success: false, error: 'Tipo de documento inválido' };
    }

    try {
      // Verificar permisos de subida
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, tipo_abogado, id, email')
        .eq('id', user.id)
        .single();

      if (profileError || profile?.role !== 'abogado') {
        return { success: false, error: 'Solo abogados pueden subir documentos de resolución' };
      }

      let canUpload = false;
      if (profile.tipo_abogado === 'super_admin') {
        canUpload = true;
      } else {
        // Verificar asignación para abogados regulares
        const { data: asignacion, error: asignacionError } = await supabase
          .from('asignaciones_casos')
          .select('*')
          .eq('caso_id', casoId)
          .eq('abogado_id', user.id)
          .in('estado_asignacion', ['activa', 'completada'])
          .single();

        canUpload = !asignacionError && asignacion;
      }

      if (!canUpload) {
        return { success: false, error: 'No tienes permisos para subir documentos a este caso' };
      }

      // Generar nombre único para el archivo usando la estructura correcta
      const timestamp = Date.now();
      const sanitizedName = sanitizeFileName(file.name);
      const fileName = `${timestamp}_${sanitizedName}`;
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

      // Guardar metadatos en la base de datos (guardamos el path del archivo)
      const { error: dbError } = await supabase
        .from('documentos_resolucion')
        .insert({
          caso_id: casoId,
          abogado_id: user.id,
          tipo_documento: tipoDocumento,
          nombre_archivo: file.name,
          ruta_archivo: filePath, // Guardamos el path relativo en lugar de la URL
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

  const getSignedUrl = async (documento: DocumentoResolucion): Promise<string | null> => {
    if (!user || accessDenied) {
      return null;
    }

    try {
      const { data, error } = await supabase.storage
        .from('documentos_legales')
        .createSignedUrl(documento.ruta_archivo, 3600); // 1 hora de expiración

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  };

  const downloadDocument = async (documento: DocumentoResolucion) => {
    if (!user || accessDenied) {
      return;
    }

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
    if (!user || accessDenied) {
      return { success: false, error: 'Acceso no autorizado' };
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

      // El ruta_archivo ya contiene el path relativo
      const filePath = documento.ruta_archivo;

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

  // Fetch documents when access is validated
  useEffect(() => {
    if (!accessDenied && casoId) {
      fetchDocumentosResolucion();
    }
  }, [accessDenied, casoId]);

  return {
    documentosResolucion,
    loading,
    accessDenied,
    uploadDocument,
    downloadDocument,
    deleteDocument,
    getSignedUrl,
    refetch: fetchDocumentosResolucion
  };
}; 