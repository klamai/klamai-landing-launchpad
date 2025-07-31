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
  const [retryCount, setRetryCount] = useState(0);
  const [accessDenied, setAccessDenied] = useState(false);
  const { user } = useAuth();

  // Validación de seguridad para clientes y abogados asignados
  useEffect(() => {
    const validateAccess = async () => {
      if (!user || !casoId) {
        setAccessDenied(true);
        return;
      }

      try {
        console.log('🔍 Validando acceso a useClientDocumentManagement:', user.id, 'caso:', casoId);
        
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

        console.log('Perfil del usuario:', profile);

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

        // Validar acceso según el rol
        if (profile.role === 'cliente') {
          // Cliente solo puede acceder a sus propios casos
          if (casoData.cliente_id === user.id) {
            console.log('✅ Acceso autorizado para cliente');
            setAccessDenied(false);
          } else {
            console.log('🚫 Cliente no puede acceder a caso de otro cliente');
            setAccessDenied(true);
          }
        } else if (profile.role === 'abogado') {
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
        } else {
          console.log('🚫 Rol no autorizado:', profile.role);
          setAccessDenied(true);
        }
      } catch (error) {
        console.error('❌ Error general en validación:', error);
        setAccessDenied(true);
      }
    };

    validateAccess();
  }, [user, casoId]);

  const fetchDocumentosCliente = async (isRetry = false) => {
    if (!casoId || !user || accessDenied) {
      console.log('No se puede buscar documentos - casoId:', casoId, 'user:', !!user, 'accessDenied:', accessDenied);
      setDocumentosCliente([]);
      return;
    }

    if (!isRetry) {
      setLoading(true);
      setError(null);
    }
    
    try {
      console.log('=== INICIO FETCH DOCUMENTOS CLIENTE ===');
      console.log('Caso ID:', casoId);
      console.log('Usuario ID:', user.id);
      
      const { data, error } = await supabase
        .from('documentos_cliente')
        .select('*')
        .eq('caso_id', casoId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documentos cliente:', error);
        setError('Error al cargar documentos');
        return;
      }

      console.log('Documentos encontrados:', data?.length || 0);
      setDocumentosCliente(data || []);
    } catch (err) {
      console.error('Error in fetchDocumentosCliente:', err);
      setError('Error inesperado al cargar documentos');
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

    try {
      console.log('=== INICIO UPLOAD DOCUMENTO ===');
      console.log('Archivo:', file.name, 'Tamaño:', file.size);
      console.log('Tipo documento:', tipoDocumento);

      // Verificar el perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, tipo_abogado, id, email')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error obteniendo perfil:', profileError);
        return { success: false, error: 'No se pudo obtener el perfil del usuario' };
      }

      // Verificar acceso al caso
      const { data: casoData, error: casoError } = await supabase
        .from('casos')
        .select('id, cliente_id, estado')
        .eq('id', casoId)
        .single();

      if (casoError) {
        console.error('Error obteniendo datos del caso:', casoError);
        return { success: false, error: 'No se pudo acceder al caso' };
      }

      // Validar permisos de subida
      let canUpload = false;
      if (profile.role === 'cliente') {
        canUpload = casoData.cliente_id === user.id;
      } else if (profile.role === 'abogado') {
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
      }

      if (!canUpload) {
        return { success: false, error: 'No tienes permisos para subir documentos a este caso' };
      }

      // Generar nombre único para el archivo
      const timestamp = new Date().getTime();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `casos/${casoId}/documentos_cliente/${fileName}`;

      // Subir archivo a storage
      const { error: uploadError } = await supabase.storage
        .from('documentos_legales')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return { success: false, error: 'Error al subir el archivo' };
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('documentos_legales')
        .getPublicUrl(filePath);

      // Guardar registro en la base de datos
      const { error: dbError } = await supabase
        .from('documentos_cliente')
        .insert({
          caso_id: casoId,
          cliente_id: casoData.cliente_id,
          tipo_documento: tipoDocumento,
          nombre_archivo: file.name,
          ruta_archivo: filePath,
          tamaño_archivo: file.size,
          descripcion: descripcion || null,
          fecha_subida: new Date().toISOString()
        });

      if (dbError) {
        console.error('Error saving document record:', dbError);
        // Intentar eliminar el archivo subido si falla el registro
        await supabase.storage.from('documentos_legales').remove([filePath]);
        return { success: false, error: 'Error al guardar el registro del documento' };
      }

      console.log('✅ Documento subido exitosamente');
      
      // Refetch documentos
      await fetchDocumentosCliente();
      
      return { success: true };
    } catch (error) {
      console.error('Error in uploadDocument:', error);
      return { success: false, error: 'Error inesperado al subir documento' };
    }
  };

  const getSignedUrl = async (documento: DocumentoCliente): Promise<string | null> => {
    if (!user || accessDenied) {
      return null;
    }

    try {
      const { data, error } = await supabase.storage
        .from('documentos_legales')
        .createSignedUrl(documento.ruta_archivo, 3600); // 1 hora

      if (error) {
        console.error('Error getting signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error in getSignedUrl:', error);
      return null;
    }
  };

  const downloadDocument = async (documento: DocumentoCliente) => {
    if (!user || accessDenied) {
      return;
    }

    try {
      const signedUrl = await getSignedUrl(documento);
      if (!signedUrl) {
        console.error('No se pudo obtener la URL del documento');
        return;
      }

      const response = await fetch(signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documento.nombre_archivo;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const deleteDocument = async (documentoId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || accessDenied) {
      return { success: false, error: 'Acceso no autorizado' };
    }

    try {
      // Obtener información del documento
      const { data: documento, error: fetchError } = await supabase
        .from('documentos_cliente')
        .select('*')
        .eq('id', documentoId)
        .single();

      if (fetchError || !documento) {
        return { success: false, error: 'Documento no encontrado' };
      }

      // Verificar permisos de eliminación
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, tipo_abogado, id, email')
        .eq('id', user.id)
        .single();

      if (profileError) {
        return { success: false, error: 'No se pudo obtener el perfil del usuario' };
      }

      let canDelete = false;
      if (profile.role === 'cliente') {
        canDelete = documento.cliente_id === user.id;
      } else if (profile.role === 'abogado') {
        if (profile.tipo_abogado === 'super_admin') {
          canDelete = true;
        } else {
          // Verificar asignación para abogados regulares
          const { data: asignacion, error: asignacionError } = await supabase
            .from('asignaciones_casos')
            .select('*')
            .eq('caso_id', documento.caso_id)
            .eq('abogado_id', user.id)
            .in('estado_asignacion', ['activa', 'completada'])
            .single();

          canDelete = !asignacionError && asignacion;
        }
      }

      if (!canDelete) {
        return { success: false, error: 'No tienes permisos para eliminar este documento' };
      }

      // Eliminar archivo de storage
      const { error: storageError } = await supabase.storage
        .from('documentos_legales')
        .remove([documento.ruta_archivo]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
      }

      // Eliminar registro de la base de datos
      const { error: dbError } = await supabase
        .from('documentos_cliente')
        .delete()
        .eq('id', documentoId);

      if (dbError) {
        console.error('Error deleting document record:', dbError);
        return { success: false, error: 'Error al eliminar el registro del documento' };
      }

      // Refetch documentos
      await fetchDocumentosCliente();
      
      return { success: true };
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      return { success: false, error: 'Error inesperado al eliminar documento' };
    }
  };

  // Fetch documents when access is validated
  useEffect(() => {
    if (!accessDenied && casoId && user) {
      fetchDocumentosCliente();
    }
  }, [accessDenied, casoId, user]);

  return {
    documentosCliente,
    loading,
    error,
    accessDenied,
    uploadDocument,
    downloadDocument,
    deleteDocument,
    getSignedUrl,
    refetch: () => fetchDocumentosCliente()
  };
}; 