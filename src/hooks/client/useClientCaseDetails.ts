import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCaseUnreadNotificationsCount } from './useCaseNotifications';

interface ClientCaseDetails {
  // Información básica del caso
  id: string;
  motivo_consulta: string;
  estado: string;
  created_at: string;
  fecha_cierre?: string;
  especialidad_id: number;
  cliente_id: string;
  especialidades?: { nombre: string };
  
  // Información del cliente
  nombre_borrador?: string;
  apellido_borrador?: string;
  email_borrador?: string;
  telefono_borrador?: string;
  ciudad_borrador?: string;
  tipo_perfil_borrador?: string;
  
  // Documentos y recursos
  documentos_adjuntos?: any;
  hoja_encargo_token?: string;
  
  // Estadísticas de documentos
  documentosCliente: Array<{
    id: string;
    tipo_documento: string;
    nombre_archivo: string;
    created_at: string;
  }>;
  
  // Notificaciones no leídas
  notificacionesNoLeidas: number;
  
  // Última actividad
  ultimaActividad?: {
    tipo: 'documento' | 'notificacion' | 'estado';
    descripcion: string;
    fecha: string;
  };
}

export const useClientCaseDetails = (casoId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-case-details', casoId, user?.id],
    queryFn: async (): Promise<ClientCaseDetails> => {
      if (!user?.id || !casoId) {
        throw new Error('Usuario no autenticado o caso no especificado');
      }

      // Obtener información básica del caso
      const { data: caso, error: casoError } = await supabase
        .from('casos')
        .select(`
          id,
          motivo_consulta,
          estado,
          created_at,
          fecha_cierre,
          especialidad_id,
          cliente_id,
          especialidades!casos_especialidad_id_fkey(
            nombre
          ),
          nombre_borrador,
          apellido_borrador,
          email_borrador,
          telefono_borrador,
          ciudad_borrador,
          tipo_perfil_borrador,
          documentos_adjuntos,
          hoja_encargo_token
        `)
        .eq('id', casoId)
        .eq('cliente_id', user.id)
        .single();

      if (casoError) throw casoError;

      // Obtener documentos del cliente
      const { data: documentosCliente, error: docsError } = await supabase
        .from('documentos_cliente')
        .select('id, tipo_documento, nombre_archivo, created_at')
        .eq('caso_id', casoId)
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;

      // Determinar última actividad (sin información de abogados)
      const ultimaActividad = determinarUltimaActividad(
        caso,
        documentosCliente || []
      );

      return {
        ...caso,
        documentosCliente: documentosCliente || [],
        notificacionesNoLeidas: 0, // Se calculará con el hook específico
        ultimaActividad
      };
    },
    enabled: !!user?.id && !!casoId,
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 3 * 60 * 1000, // 3 minutos
  });
};

// Función auxiliar para determinar la última actividad (sin información de abogados)
const determinarUltimaActividad = (
  caso: any,
  documentos: any[]
) => {
  const actividades = [];

  // Último documento
  if (documentos.length > 0) {
    actividades.push({
      tipo: 'documento' as const,
      descripcion: `Documento añadido: ${documentos[0].nombre_archivo}`,
      fecha: documentos[0].created_at
    });
  }

  // Cambio de estado
  if (caso.estado) {
    actividades.push({
      tipo: 'estado' as const,
      descripcion: `Estado actualizado a: ${caso.estado}`,
      fecha: caso.created_at
    });
  }

  // Retornar la actividad más reciente
  if (actividades.length === 0) {
    return {
      tipo: 'estado' as const,
      descripcion: 'Caso creado',
      fecha: caso.created_at
    };
  }

  return actividades.sort((a, b) => 
    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  )[0];
}; 