import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ClientCase {
  id: string;
  motivo_consulta: string;
  estado: string;
  created_at: string;
  fecha_cierre?: string;
  especialidad_id: number;
  cliente_id: string;
  especialidades?: {
    nombre: string;
  };
  // Campos básicos del cliente que puede ver
  nombre_borrador?: string;
  apellido_borrador?: string;
  email_borrador?: string;
  telefono_borrador?: string;
  ciudad_borrador?: string;
  tipo_perfil_borrador?: string;
  // Para mostrar información de progreso
  documentos_adjuntos?: any;
  // Token para hoja de encargo
  hoja_encargo_token?: string;
  fecha_pago?: string | null;
}

export const useClientCases = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-cases', user?.id],
    queryFn: async (): Promise<ClientCase[]> => {
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('casos')
        .select(`
          id,
          motivo_consulta,
          estado,
          created_at,
          fecha_cierre,
          especialidad_id,
          cliente_id,
          especialidades:especialidades(
            nombre
          ),
          nombre_borrador,
          apellido_borrador,
          email_borrador,
          telefono_borrador,
          ciudad_borrador,
          tipo_perfil_borrador,
          documentos_adjuntos,
          hoja_encargo_token,
          fecha_pago
        `)
        .eq('cliente_id', user.id as any)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown) as ClientCase[];
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}; 