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
  // Información básica del abogado (solo nombre para el cliente)
  profiles?: {
    nombre: string;
    apellido: string;
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

      // Verificar que el usuario es el propietario del caso
      const { data: caso, error: casoError } = await supabase
        .from('casos')
        .select('cliente_id')
        .eq('id', casoId)
        .eq('cliente_id', user.id)
        .single();

      if (casoError || !caso) {
        throw new Error('No tienes permisos para ver este caso');
      }

      // Obtener documentos de resolución (documentos del abogado) para este caso
      const { data, error } = await supabase
        .from('documentos_resolucion')
        .select(`
          id,
          caso_id,
          abogado_id,
          tipo_documento,
          nombre_archivo,
          ruta_archivo,
          tamaño_archivo,
          descripcion,
          fecha_subida,
          created_at,
          profiles:abogado_id(
            nombre,
            apellido
          )
        `)
        .eq('caso_id', casoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!casoId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}; 