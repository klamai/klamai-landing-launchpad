import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SecureLogger } from '@/utils/secureLogging';

interface SuperAdminStats {
  totalCasos: number;
  casosDisponibles: number;
  casosAsignados: number;
  casosCerrados: number;
  totalAbogados: number;
  abogadosActivos: number;
  casosEsperandoPago: number;
  casosAgotados: number;
  loading: boolean;
}

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
    profiles: { nombre: string; apellido: string; email: string };
  }>;
  cerrado_por_profile?: {
    nombre: string;
    apellido: string;
    email: string;
  };
}

interface AbogadoInfo {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  especialidades: number[] | null;
  creditos_disponibles: number;
  created_at: string;
  casos_asignados: number;
  casos_activos: number;
  tipo_abogado?: string;
}

export const useSuperAdminStats = () => {
  const [stats, setStats] = useState<SuperAdminStats>({
    totalCasos: 0,
    casosDisponibles: 0,
    casosAsignados: 0,
    casosCerrados: 0,
    totalAbogados: 0,
    abogadosActivos: 0,
    casosEsperandoPago: 0,
    casosAgotados: 0,
    loading: true
  });

  const [casos, setCasos] = useState<CasosSuperAdmin[]>([]);
  const [abogados, setAbogados] = useState<AbogadoInfo[]>([]);
  const [loadingCasos, setLoadingCasos] = useState(true);
  const [loadingAbogados, setLoadingAbogados] = useState(true);
  const [errorAbogados, setErrorAbogados] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const { user } = useAuth();

  // Validación de seguridad para super_admin
  useEffect(() => {
    const validateAccess = async () => {
      if (!user) {
        setAccessDenied(true);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, tipo_abogado')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('❌ Error validando acceso:', error);
          setAccessDenied(true);
        } else if (profile && profile.role === 'abogado' && profile.tipo_abogado === 'super_admin') {
          SecureLogger.info(`Acceso autorizado para super admin`, 'super_admin_stats');
          setAccessDenied(false);
        } else {
          SecureLogger.warn(`Acceso denegado: role=${profile?.role}, tipo=${profile?.tipo_abogado}`, 'super_admin_stats');
          setAccessDenied(true);
        }
      } catch (error) {
        console.error('❌ Error general en validación:', error);
        setAccessDenied(true);
      }
    };

    validateAccess();
  }, [user]);

  const fetchStats = async () => {
    if (accessDenied) return;

    try {
      // Estadísticas de casos
      const { data: casosData, error: casosError } = await supabase
        .from('casos')
        .select('estado');

      if (casosError) {
        console.error('Error fetching casos stats:', casosError);
        return;
      }

      const totalCasos = casosData?.length || 0;
      const casosDisponibles = casosData?.filter(c => c.estado === 'disponible').length || 0;
      const casosAsignados = casosData?.filter(c => c.estado === 'asignado').length || 0;
      const casosCerrados = casosData?.filter(c => c.estado === 'cerrado').length || 0;
      const casosEsperandoPago = casosData?.filter(c => c.estado === 'esperando_pago').length || 0;
      const casosAgotados = casosData?.filter(c => c.estado === 'agotado').length || 0;

      // Estadísticas de abogados
      const { data: abogadosData, error: abogadosError } = await supabase
        .from('profiles')
        .select('id, created_at')
        .eq('role', 'abogado');

      if (abogadosError) {
        console.error('Error fetching abogados stats:', abogadosError);
        return;
      }

      const totalAbogados = abogadosData?.length || 0;
      
      // Abogados activos (con casos asignados en los últimos 30 días)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: abogadosActivosData, error: abogadosActivosError } = await supabase
        .from('asignaciones_casos')
        .select('abogado_id')
        .gte('fecha_asignacion', thirtyDaysAgo.toISOString())
        .eq('estado_asignacion', 'activa');

      if (abogadosActivosError) {
        console.error('Error fetching abogados activos:', abogadosActivosError);
        return;
      }

      const abogadosActivos = new Set(abogadosActivosData?.map(a => a.abogado_id) || []).size;

      setStats({
        totalCasos,
        casosDisponibles,
        casosAsignados,
        casosCerrados,
        totalAbogados,
        abogadosActivos,
        casosEsperandoPago,
        casosAgotados,
        loading: false
      });
    } catch (error) {
      console.error('Error in fetchStats:', error);
    }
  };

  const fetchCasos = async () => {
    if (accessDenied) return;

    try {
      setLoadingCasos(true);
      
      const { data: casosData, error } = await supabase
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
          especialidades!casos_especialidad_id_fkey(nombre),
          profiles!casos_cliente_id_fkey(
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
          asignaciones_casos!asignaciones_casos_caso_id_fkey(
            abogado_id,
            estado_asignacion,
            fecha_asignacion,
            profiles!asignaciones_casos_abogado_id_fkey(
              nombre,
              apellido,
              email
            )
          ),
          cerrado_por_profile:profiles!casos_cerrado_por_fkey(
            nombre,
            apellido,
            email
          )
        `)
        .in('estado', ['disponible', 'asignado', 'cerrado', 'agotado', 'esperando_pago', 'listo_para_propuesta'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching casos:', error);
        return;
      }

      setCasos(casosData || []);
    } catch (error) {
      console.error('Error in fetchCasos:', error);
    } finally {
      setLoadingCasos(false);
    }
  };

  const fetchAbogados = async () => {
    if (accessDenied) return;

    try {
      setLoadingAbogados(true);
      setErrorAbogados(null);

      // Obtener abogados con sus especialidades
      const { data: abogadosData, error: abogadosError } = await supabase
        .from('profiles')
        .select(`
          id,
          nombre,
          apellido,
          email,
          especialidades,
          creditos_disponibles,
          created_at,
          tipo_abogado
        `)
        .eq('role', 'abogado')
        .order('created_at', { ascending: false });

      if (abogadosError) {
        console.error('Error fetching abogados:', abogadosError);
        setErrorAbogados('Error al cargar abogados');
        return;
      }

      // Obtener estadísticas de casos por abogado
      const { data: casosPorAbogadoData, error: casosError } = await supabase
        .from('asignaciones_casos')
        .select('abogado_id, estado_asignacion')
        .in('estado_asignacion', ['activa', 'completada']);

      if (casosError) {
        console.error('Error fetching casos por abogado:', casosError);
        setErrorAbogados('Error al cargar estadísticas de abogados');
        return;
      }

      // Crear mapa de estadísticas por abogado
      const casosPorAbogadoMap = new Map<string, { total: number; activos: number }>();
      
      casosPorAbogadoData?.forEach(asignacion => {
        const current = casosPorAbogadoMap.get(asignacion.abogado_id) || { total: 0, activos: 0 };
        current.total += 1;
        if (asignacion.estado_asignacion === 'activa') {
          current.activos += 1;
        }
        casosPorAbogadoMap.set(asignacion.abogado_id, current);
      });

      // Obtener nombres de especialidades
      const { data: especialidadesData, error: especialidadesError } = await supabase
        .from('especialidades')
        .select('id, nombre');

      if (especialidadesError) {
        console.error('Error fetching especialidades:', especialidadesError);
        setErrorAbogados('Error al cargar especialidades');
        return;
      }

      const especialidadesMap = new Map(
        especialidadesData?.map(esp => [esp.id, esp.nombre]) || []
      );

      // Procesar abogados con estadísticas
      const processedAbogados: AbogadoInfo[] = (abogadosData || []).map(abogado => {
        const estadisticas = casosPorAbogadoMap.get(abogado.id) || { total: 0, activos: 0 };
        
        return {
          id: abogado.id,
          nombre: abogado.nombre,
          apellido: abogado.apellido,
          email: abogado.email,
          especialidades: abogado.especialidades,
          creditos_disponibles: abogado.creditos_disponibles,
          created_at: abogado.created_at,
          casos_asignados: estadisticas.total,
          casos_activos: estadisticas.activos,
          tipo_abogado: abogado.tipo_abogado
        };
      });

      setAbogados(processedAbogados);
    } catch (error) {
      console.error('Error fetching abogados:', error);
      setErrorAbogados('Error inesperado al cargar abogados');
    } finally {
      setLoadingAbogados(false);
    }
  };

  const assignCaseToLawyer = async (casoId: string, abogadoId: string, notas?: string) => {
    if (accessDenied) {
      console.error('Acceso denegado: usuario no es super admin');
      return { error: 'Acceso no autorizado' };
    }

    try {
      // Usar upsert para manejar asignaciones duplicadas
      const { error } = await supabase
        .from('asignaciones_casos')
        .upsert({
          caso_id: casoId,
          abogado_id: abogadoId,
          asignado_por: user?.id,
          estado_asignacion: 'activa',
          fecha_asignacion: new Date().toISOString(),
          notas_asignacion: notas || null
        }, {
          onConflict: 'caso_id,abogado_id'
        });

      if (error) {
        console.error('Error assigning case:', error);
        return { error: error.message };
      }

      // Actualizar estado del caso
      const { error: updateError } = await supabase
        .from('casos')
        .update({ estado: 'asignado' })
        .eq('id', casoId);

      if (updateError) {
        console.error('Error updating case status:', updateError);
        return { error: updateError.message };
      }

      // Refetch data
      await fetchCasos();
      await fetchStats();

      return { success: true };
    } catch (error) {
      console.error('Error in assignCaseToLawyer:', error);
      return { error: 'Error inesperado al asignar caso' };
    }
  };

  const retryFetchAbogados = () => {
    setErrorAbogados(null);
    fetchAbogados();
  };

  // Fetch data when access is validated
  useEffect(() => {
    if (!accessDenied) {
      fetchStats();
      fetchCasos();
      fetchAbogados();
    }
  }, [accessDenied]);

  return {
    stats,
    casos,
    abogados,
    loadingCasos,
    loadingAbogados,
    errorAbogados,
    accessDenied,
    assignCaseToLawyer,
    retryFetchAbogados,
    refetchStats: fetchStats,
    refetchCasos: fetchCasos,
    refetchAbogados: fetchAbogados
  };
}; 