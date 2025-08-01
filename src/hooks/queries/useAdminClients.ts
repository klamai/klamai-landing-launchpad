import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ClientInfo {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  ciudad: string;
  tipo_perfil: string;
  razon_social?: string;
  nif_cif?: string;
  nombre_gerente?: string;
  direccion_fiscal?: string;
  created_at: string;
  casos_count: number;
  casos_activos: number;
  casos_cerrados: number;
  total_gastado: number;
  total_pagos?: number;
  ingresos_totales?: number;
}

interface ClientCase {
  id: string;
  motivo_consulta: string;
  estado: string;
  created_at: string;
  valor_estimado: string;
  especialidades: {
    nombre: string;
  };
}

interface AddClientParams {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  ciudad: string;
  tipo_perfil: string;
  razon_social?: string;
  nif_cif?: string;
  nombre_gerente?: string;
  direccion_fiscal?: string;
}

// Función para validar acceso de super admin
const validateSuperAdminAccess = async (userId: string): Promise<boolean> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, tipo_abogado')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Error validando acceso:', error);
      return false;
    }

    return profile?.role === 'abogado' && profile?.tipo_abogado === 'super_admin';
  } catch (error) {
    console.error('❌ Error general en validación:', error);
    return false;
  }
};

// Función para obtener clientes con estadísticas
const fetchAdminClients = async (): Promise<ClientInfo[]> => {
  try {
    // Llamar a la Edge Function para obtener clientes
    const { data, error } = await supabase.functions.invoke('get-clients', {
      headers: {
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (error) {
      console.error('Error fetching clients:', error);
      throw new Error('Error al cargar clientes');
    }

    return data.data || [];
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Error inesperado al cargar clientes');
  }
};

// Función para obtener casos de un cliente específico
const fetchClientCases = async (clientId: string): Promise<ClientCase[]> => {
  try {
    const { data, error } = await supabase
      .from('casos')
      .select(`
        id,
        motivo_consulta,
        estado,
        created_at,
        valor_estimado,
        especialidades:especialidades(nombre)
      `)
      .eq('cliente_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching client cases:', error);
      throw new Error('Error al cargar casos del cliente');
    }

    return data || [];
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Error inesperado al cargar casos del cliente');
  }
};

// Función para añadir nuevo cliente
const addClient = async (clientData: AddClientParams): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .insert({
        ...clientData,
        role: 'cliente',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error adding client:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in addClient:', error);
    return { success: false, error: 'Error inesperado al añadir cliente' };
  }
};

// Hook para validar acceso de super admin
export const useSuperAdminAccess = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['superAdminAccess', user?.id],
    queryFn: () => validateSuperAdminAccess(user!.id),
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // Validación válida por 10 minutos
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// Hook principal para gestión de clientes
export const useAdminClients = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['adminClients', user?.id],
    queryFn: fetchAdminClients,
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // Datos frescos por 2 minutos
    gcTime: 5 * 60 * 1000, // Caché por 5 minutos
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 3;
    },
  });
};

// Hook para obtener casos de un cliente específico
export const useClientCases = (clientId: string | null) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['clientCases', clientId, user?.id],
    queryFn: () => fetchClientCases(clientId!),
    enabled: !!user && !!clientId,
    staleTime: 1 * 60 * 1000, // Datos frescos por 1 minuto
    gcTime: 3 * 60 * 1000, // Caché por 3 minutos
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 3;
    },
  });
};

// Hook para añadir nuevo cliente
export const useAddClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addClient,
    onSuccess: () => {
      // Invalidar queries relacionadas para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['adminClients'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminStats'] });
    },
    onError: (error) => {
      console.error('Error al añadir cliente:', error);
    },
  });
}; 