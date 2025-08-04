import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LawyerDocument {
  id: string;
  caso_id: string;
  abogado_id: string;
  tipo_documento: string;
  nombre_archivo: string;
  ruta_archivo: string;
  tamaño_archivo?: number;
  descripcion?: string;
  fecha_subida: string;
  created_at: string;
  profiles?: {
    nombre: string;
    apellido: string;
    email: string;
  };
}

export const useLawyerDocuments = (casoId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['lawyer-documents', casoId, user?.id],
    queryFn: async (): Promise<LawyerDocument[]> => {
      if (!user?.id || !casoId) {
        throw new Error('Usuario no autenticado o caso no especificado');
      }

      const { data, error } = await supabase
        .from('documentos_resolucion')
        .select(`
          *,
          profiles:profiles!documentos_resolucion_abogado_id_fkey(
            nombre,
            apellido,
            email
          )
        `)
        .eq('caso_id', casoId)
        .order('created_at', { ascending: false })
        .limit(2); // Solo los últimos 2 documentos

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!casoId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook específico para obtener solo los últimos 2 documentos del abogado
export const useLatestLawyerDocuments = (casoId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['latest-lawyer-documents', casoId, user?.id],
    queryFn: async (): Promise<LawyerDocument[]> => {
      if (!user?.id || !casoId) {
        return [];
      }

      const { data, error } = await supabase
        .from('documentos_resolucion')
        .select(`
          *,
          profiles:profiles!documentos_resolucion_abogado_id_fkey(
            nombre,
            apellido,
            email
          )
        `)
        .eq('caso_id', casoId)
        .order('created_at', { ascending: false })
        .limit(2); // Solo los últimos 2 documentos

      if (error) {
        console.error('Error fetching latest lawyer documents:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!user?.id && !!casoId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}; 