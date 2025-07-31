import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Interfaz específica para casos del super admin (igual que en useSuperAdminStats)
interface CasosSuperAdmin {
  id: string;
  motivo_consulta: string;
  resumen_caso?: string;
  guia_abogado?: string;
  especialidad_id: number;
  estado: string;
  created_at: string;
  cliente_id: string;
  compras_realizadas: number;
  limite_compras: number;
  costo_en_creditos: number;
  valor_estimado?: string;
  tipo_lead?: string;
  canal_atencion?: string;
  ciudad_borrador?: string;
  nombre_borrador?: string;
  apellido_borrador?: string;
  email_borrador?: string;
  telefono_borrador?: string;
  tipo_perfil_borrador?: string;
  razon_social_borrador?: string;
  nif_cif_borrador?: string;
  nombre_gerente_borrador?: string;
  direccion_fiscal_borrador?: string;
  preferencia_horaria_contacto?: string;
  fecha_cierre?: string;
  cerrado_por?: string;
  documentos_adjuntos?: any;
  especialidades?: { nombre: string };
  profiles?: { 
    nombre: string; 
    apellido: string; 
    email: string;
    telefono?: string;
    ciudad?: string;
    tipo_perfil?: string;
    razon_social?: string;
    nif_cif?: string;
    nombre_gerente?: string;
    direccion_fiscal?: string;
  };
  asignaciones_casos?: Array<{
    abogado_id: string;
    estado_asignacion: string;
    fecha_asignacion: string;
    asignado_por?: string;
    notas_asignacion?: string;
    asignado_por_profile?: {
      nombre: string;
      apellido: string;
      email: string;
    };
    profiles: { nombre: string; apellido: string; email: string };
  }>;
  cerrado_por_profile?: {
    nombre: string;
    apellido: string;
    email: string;
  };
}

export const useAdminCases = () => {
  const [casos, setCasos] = useState<CasosSuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const { user } = useAuth();

  // Validación de seguridad para super admin
  useEffect(() => {
    const validateAccess = async () => {
      if (!user) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Validando acceso a useAdminCases:', user.id);
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, tipo_abogado')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('❌ Error obteniendo perfil:', profileError);
          setAccessDenied(true);
        } else if (profile && profile.role === 'abogado' && profile.tipo_abogado === 'super_admin') {
          console.log('✅ Acceso autorizado para super admin');
          setAccessDenied(false);
        } else {
          console.log('🚫 Acceso denegado:', { role: profile?.role, tipo: profile?.tipo_abogado });
          setAccessDenied(true);
        }
      } catch (error) {
        console.error('❌ Error general en validación:', error);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    };

    validateAccess();
  }, [user]);

  const fetchAdminCases = async () => {
    if (!user || accessDenied) {
      setCasos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Verificar explícitamente que el usuario es un super admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, tipo_abogado')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        setError('Error al verificar permisos de usuario');
        setCasos([]);
        return;
      }

      // Validación estricta: solo super admin pueden usar este hook
      if (profile.role !== 'abogado' || profile.tipo_abogado !== 'super_admin') {
        console.error('Acceso denegado: usuario no es super admin');
        setError('Acceso no autorizado');
        setCasos([]);
        return;
      }

      // Query optimizada para super admin con todas las relaciones necesarias
      const { data, error } = await supabase
        .from('casos')
        .select(`
          id,
          motivo_consulta,
          resumen_caso,
          guia_abogado,
          especialidad_id,
          estado,
          created_at,
          cliente_id,
          compras_realizadas,
          limite_compras,
          costo_en_creditos,
          valor_estimado,
          tipo_lead,
          canal_atencion,
          ciudad_borrador,
          nombre_borrador,
          apellido_borrador,
          email_borrador,
          telefono_borrador,
          tipo_perfil_borrador,
          razon_social_borrador,
          nif_cif_borrador,
          nombre_gerente_borrador,
          direccion_fiscal_borrador,
          preferencia_horaria_contacto,
          fecha_cierre,
          cerrado_por,
          documentos_adjuntos,
          especialidades (
            nombre
          ),
          profiles!casos_cliente_id_fkey (
            nombre,
            apellido,
            email,
            telefono,
            ciudad,
            tipo_perfil,
            razon_social,
            nif_cif,
            nombre_gerente,
            direccion_fiscal
          ),
          cerrado_por_profile:profiles!casos_cerrado_por_fkey (
            nombre,
            apellido,
            email
          ),
          asignaciones_casos!asignaciones_casos_caso_id_fkey (
            abogado_id,
            estado_asignacion,
            fecha_asignacion,
            asignado_por,
            notas_asignacion,
            asignado_por_profile:profiles!asignaciones_casos_asignado_por_fkey (nombre, apellido, email),
            profiles!asignaciones_casos_abogado_id_fkey (nombre, apellido, email)
          )
        `)
        .in('estado', ['borrador', 'listo_para_propuesta', 'esperando_pago', 'disponible', 'asignado', 'agotado', 'cerrado'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin cases:', error);
        setError('Error al cargar casos: ' + error.message);
        setCasos([]);
        return;
      }

      console.log('Casos cargados para super admin:', data?.length || 0);
      setCasos(data || []);
    } catch (err) {
      console.error('Error in fetchAdminCases:', err);
      setError('Error inesperado al cargar casos');
    } finally {
      setLoading(false);
    }
  };

  // Fetch cases when access is validated
  useEffect(() => {
    if (!accessDenied && user) {
      fetchAdminCases();
    }
  }, [accessDenied, user]);

  return { 
    casos, 
    loading, 
    error, 
    accessDenied,
    refetch: fetchAdminCases 
  };
}; 