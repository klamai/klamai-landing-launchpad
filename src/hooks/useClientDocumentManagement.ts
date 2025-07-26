
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
  const { user } = useAuth();

  const fetchDocumentosCliente = async (isRetry = false) => {
    if (!casoId || !user) {
      console.log('No se puede buscar documentos - casoId:', casoId, 'user:', !!user);
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
      console.log('Usuario email:', user.email);
      
      // Verificar el contexto de autenticación
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      console.log('Estado de autenticación:', authUser?.user ? 'Autenticado' : 'No autenticado');
      if (authError) {
        console.error('Error de autenticación:', authError);
        throw new Error('Usuario no autenticado correctamente');
      }

      // Verificar el perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, tipo_abogado, id, email')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error obteniendo perfil:', profileError);
        throw new Error('No se pudo obtener el perfil del usuario');
      }

      console.log('Perfil del usuario completo:', profile);

      // Verificar acceso al caso
      const { data: casoData, error: casoError } = await supabase
        .from('casos')
        .select('id, cliente_id, estado')
        .eq('id', casoId)
        .single();

      if (casoError) {
        console.error('Error obteniendo datos del caso:', casoError);
        throw new Error('No se pudo acceder al caso');
      }

      console.log('Datos del caso:', casoData);

      // Si es abogado, verificar asignación
      if (profile.role === 'abogado') {
        if (profile.tipo_abogado === 'super_admin') {
          console.log('Usuario es super admin - acceso completo');
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
            console.error('No hay asignación activa para este abogado:', asignacionError);
            throw new Error('No tienes asignación activa para este caso');
          }
          console.log('Asignación encontrada:', asignacion);
        }
      }

      // Realizar la consulta de documentos
      console.log('Ejecutando consulta de documentos...');
      const { data, error } = await supabase
        .from('documentos_cliente')
        .select('*')
        .eq('caso_id', casoId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error en consulta de documentos:', error);
        console.error('Detalles del error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('Consulta exitosa - Documentos encontrados:', data?.length || 0);
      console.log('Datos de documentos:', data);

      setDocumentosCliente(data || []);
      setRetryCount(0);
      console.log('=== FIN FETCH DOCUMENTOS CLIENTE ===');
      
    } catch (error) {
      console.error('Error en fetchDocumentosCliente:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      
      // Retry logic para errores de red o temporales
      if (retryCount < 2 && !isRetry) {
        console.log(`Reintentando... (intento ${retryCount + 1})`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchDocumentosCliente(true), 1000);
      }
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
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
      console.log('=== SUBIENDO DOCUMENTO CLIENTE ===');
      console.log('Caso ID:', casoId);
      console.log('Usuario ID:', user.id);
      console.log('Usuario email:', user.email);

      // Verificar el contexto de autenticación
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Error de autenticación:', authError);
        return { success: false, error: 'Usuario no autenticado correctamente' };
      }

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

      console.log('Perfil del usuario:', profile);

      // Obtener información del caso para determinar el cliente_id correcto
      const { data: casoData, error: casoError } = await supabase
        .from('casos')
        .select('id, cliente_id, estado')
        .eq('id', casoId)
        .single();

      if (casoError) {
        console.error('Error obteniendo caso:', casoError);
        return { success: false, error: 'No se pudo obtener información del caso' };
      }

      console.log('Caso encontrado:', casoData);

      // Determinar el cliente_id correcto
      let clienteIdToUse: string;
      
      if (profile.role === 'cliente') {
        // Si es cliente, usar su propio ID
        clienteIdToUse = user.id;
      } else if (profile.role === 'abogado' && profile.tipo_abogado === 'super_admin') {
        // Si es super admin, usar el cliente_id del caso
        clienteIdToUse = casoData.cliente_id;
      } else {
        return { success: false, error: 'No tienes permisos para subir documentos del cliente' };
      }

      console.log('Cliente ID a usar:', clienteIdToUse);

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
          cliente_id: clienteIdToUse, // Usar el cliente_id correcto
          tipo_documento: tipoDocumento,
          nombre_archivo: fileName,
          ruta_archivo: filePath,
          tamaño_archivo: file.size,
          descripcion: descripcion || null,
          fecha_subida: new Date().toISOString()
        });

      if (dbError) {
        console.error('Error al guardar metadatos:', dbError);
        // Si falla la inserción en BD, eliminar el archivo subido
        await supabase.storage
          .from('documentos_legales')
          .remove([filePath]);
        throw dbError;
      }

      console.log('✅ Documento subido exitosamente');
      
      // Refetch documentos
      await fetchDocumentosCliente();

      return { success: true };
    } catch (error) {
      console.error('❌ Error general subiendo documento:', error);
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
    if (!casoId || !user) {
      return { success: false, error: 'No se puede eliminar - casoId o usuario no válidos' };
    }

    try {
      console.log('=== ELIMINANDO DOCUMENTO CLIENTE ===');
      console.log('Documento ID:', documentoId);
      console.log('Caso ID:', casoId);
      console.log('Usuario ID:', user.id);

      // Verificar el contexto de autenticación
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Error de autenticación:', authError);
        return { success: false, error: 'Usuario no autenticado correctamente' };
      }

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

      console.log('Perfil del usuario:', profile);

      // Verificar acceso al caso
      const { data: casoData, error: casoError } = await supabase
        .from('casos')
        .select('id, cliente_id, estado')
        .eq('id', casoId)
        .single();

      if (casoError) {
        console.error('Error obteniendo caso:', casoError);
        return { success: false, error: 'No se pudo obtener información del caso' };
      }

      console.log('Caso encontrado:', casoData);

      // Verificar permisos: cliente propietario o super admin
      const isOwner = profile.role === 'cliente' && casoData.cliente_id === user.id;
      const isSuperAdmin = profile.role === 'abogado' && profile.tipo_abogado === 'super_admin';

      if (!isOwner && !isSuperAdmin) {
        console.error('Acceso denegado - no es propietario ni super admin');
        return { success: false, error: 'No tienes permisos para eliminar este documento' };
      }

      // Obtener información del documento antes de eliminar
      const { data: documentoData, error: documentoError } = await supabase
        .from('documentos_cliente')
        .select('*')
        .eq('id', documentoId)
        .single();

      if (documentoError) {
        console.error('Error obteniendo documento:', documentoError);
        return { success: false, error: 'No se pudo obtener información del documento' };
      }

      console.log('Documento a eliminar:', documentoData);

      // Eliminar archivo de storage
      const { error: storageError } = await supabase.storage
        .from('documentos_legales')
        .remove([documentoData.ruta_archivo]);

      if (storageError) {
        console.error('Error eliminando archivo de storage:', storageError);
        // Continuar aunque falle storage, para eliminar el registro
      }

      // Eliminar registro de la base de datos
      const { error: deleteError } = await supabase
        .from('documentos_cliente')
        .delete()
        .eq('id', documentoId);

      if (deleteError) {
        console.error('Error eliminando registro:', deleteError);
        return { success: false, error: 'Error al eliminar el documento de la base de datos' };
      }

      console.log('✅ Documento eliminado exitosamente');
      
      // Refetch documentos
      await fetchDocumentosCliente();

      return { success: true };
    } catch (error) {
      console.error('❌ Error general eliminando documento:', error);
      return { success: false, error: 'Error inesperado al eliminar el documento' };
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
