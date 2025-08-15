import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SolicitudAbogadoFromDB {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  colegio_profesional?: string;
  numero_colegiado?: string;
  especialidades?: number[];
  experiencia_anos?: number;
  cv_url?: string;
  carta_motivacion?: string;
  documentos_verificacion?: any;
  estado: string;
  motivo_rechazo?: string;
  revisado_por?: string;
  fecha_revision?: string;
  notas_admin?: string;
  acepta_politicas: boolean;
  acepta_comunicacion: boolean;
  created_at: string;
  updated_at: string;
}

interface AutomatedApprovalResult {
  success: boolean;
  solicitud_id: string;
  email: string;
  nombre: string;
  apellido: string;
  activation_token: string;
  temp_password: string;
}

interface Especialidad {
  id: number;
  nombre: string;
}

interface RejectApplicationParams {
  applicationId: string;
  rejectionReason: string;
  adminNotes?: string;
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

// Función para obtener solicitudes de abogados
const fetchLawyerApplications = async (): Promise<SolicitudAbogadoFromDB[]> => {
  try {
    const { data, error } = await supabase
      .from('solicitudes_abogado')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      throw new Error('Error al cargar las solicitudes');
    }

    return data || [];
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Error inesperado al cargar las solicitudes');
  }
};

// Función para obtener especialidades
const fetchEspecialidades = async (): Promise<{[key: number]: string}> => {
  try {
    const { data, error } = await supabase
      .from('especialidades')
      .select('*');

    if (error) {
      console.error('Error fetching especialidades:', error);
      throw new Error('Error al cargar especialidades');
    }

    if (data) {
      return data.reduce((acc, esp) => {
        acc[esp.id] = esp.nombre;
        return acc;
      }, {} as {[key: number]: string});
    }

    return {};
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Error inesperado al cargar especialidades');
  }
};

// Función para aprobar solicitud automáticamente
const approveLawyerAutomated = async (applicationId: string): Promise<AutomatedApprovalResult> => {
  try {
    const { data, error } = await supabase.rpc('aprobar_solicitud_abogado_automatizado', {
      p_solicitud_id: applicationId,
      p_notas_admin: 'Aprobación automática realizada por super admin'
    });

    if (error) {
      console.error('Error approving application:', error);
      throw new Error('No se pudo aprobar la solicitud automáticamente');
    }

    // Enviar email de aprobación usando la función existente
    if (data && data.success) {
      try {
        await supabase.functions.invoke('send-lawyer-approval-email', {
          body: {
            tipo: 'aprobacion',
            email: data.email,
            nombre: data.nombre,
            apellido: data.apellido,
            credenciales: {
              email: data.email,
              password: data.temp_password,
              activationToken: data.activation_token
            }
          }
        });
      } catch (emailError) {
        console.warn('Error enviando email (pero la aprobación fue exitosa):', emailError);
      }
    }

    return data as AutomatedApprovalResult;
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Error inesperado durante la aprobación');
  }
};

// Función para rechazar solicitud
const rejectLawyerApplication = async ({ applicationId, rejectionReason, adminNotes }: RejectApplicationParams): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('solicitudes_abogado')
      .update({
        estado: 'rechazada',
        motivo_rechazo: rejectionReason,
        notas_admin: adminNotes,
        fecha_revision: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (error) {
      console.error('Error rejecting application:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'Error inesperado al rechazar la solicitud' };
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

// Hook principal para solicitudes de abogados
export const useAdminLawyerApplications = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['adminLawyerApplications', user?.id],
    queryFn: fetchLawyerApplications,
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // Datos frescos por 1 minuto
    gcTime: 3 * 60 * 1000, // Caché por 3 minutos
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 3;
    },
  });
};

// Hook para especialidades
export const useEspecialidades = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['especialidades', user?.id],
    queryFn: fetchEspecialidades,
    enabled: !!user,
    staleTime: 30 * 60 * 1000, // Datos frescos por 30 minutos (cambian poco)
    gcTime: 60 * 60 * 1000, // Caché por 1 hora
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 3;
    },
  });
};

// Hook para aprobar solicitud automáticamente
export const useApproveLawyerAutomated = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: approveLawyerAutomated,
    onSuccess: (data, applicationId) => {
      // Invalidar queries relacionadas para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['adminLawyerApplications'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminStats'] });
      
      // Actualizar optimísticamente la solicitud en el caché
      queryClient.setQueryData(['adminLawyerApplications'], (oldData: SolicitudAbogadoFromDB[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(app => 
          app.id === applicationId 
            ? { ...app, estado: 'aprobada', fecha_revision: new Date().toISOString() }
            : app
        );
      });
    },
    onError: (error) => {
      console.error('Error en aprobación automática:', error);
    },
  });
};

// Hook para rechazar solicitud
export const useRejectLawyerApplication = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: rejectLawyerApplication,
    onSuccess: (data, { applicationId }) => {
      // Invalidar queries relacionadas para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['adminLawyerApplications'] });
      
      // Actualizar optimísticamente la solicitud en el caché
      queryClient.setQueryData(['adminLawyerApplications'], (oldData: SolicitudAbogadoFromDB[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(app => 
          app.id === applicationId 
            ? { ...app, estado: 'rechazada', fecha_revision: new Date().toISOString() }
            : app
        );
      });
    },
    onError: (error) => {
      console.error('Error al rechazar solicitud:', error);
    },
  });
}; 