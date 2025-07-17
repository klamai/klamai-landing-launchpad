import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchCasos();
      fetchAbogados();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Verificar que el usuario es super admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, tipo_abogado')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'abogado' || profile.tipo_abogado !== 'super_admin') {
        console.error('Usuario no autorizado para ver estadísticas de super admin');
        setStats(prev => ({ ...prev, loading: false }));
        return;
      }

      // Obtener estadísticas de casos
      const { data: casoStats } = await supabase
        .from('casos')
        .select('estado')
        .in('estado', ['disponible', 'agotado', 'cerrado', 'esperando_pago']);

      // Obtener estadísticas de abogados
      const { data: abogadoStats } = await supabase
        .from('profiles')
        .select('id, created_at')
        .eq('role', 'abogado');

      // Obtener casos asignados
      const { data: asignacionStats } = await supabase
        .from('asignaciones_casos')
        .select('caso_id')
        .eq('estado_asignacion', 'activa');

      const totalCasos = casoStats?.length || 0;
      const casosDisponibles = casoStats?.filter(c => c.estado === 'disponible').length || 0;
      const casosCerrados = casoStats?.filter(c => c.estado === 'cerrado').length || 0;
      const casosEsperandoPago = casoStats?.filter(c => c.estado === 'esperando_pago').length || 0;
      const casosAgotados = casoStats?.filter(c => c.estado === 'agotado').length || 0;
      const casosAsignados = asignacionStats?.length || 0;
      const totalAbogados = abogadoStats?.length || 0;
      const abogadosActivos = abogadoStats?.filter(a => 
        new Date(a.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length || 0;

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
      console.error('Error fetching super admin stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchCasos = async () => {
    if (!user) return;

    try {
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
          documentos_adjuntos,
          especialidades (nombre),
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
          asignaciones_casos!asignaciones_casos_caso_id_fkey (
            abogado_id,
            estado_asignacion,
            fecha_asignacion,
            profiles!asignaciones_casos_abogado_id_fkey (nombre, apellido, email)
          )
        `)
        .in('estado', ['disponible', 'agotado', 'cerrado', 'esperando_pago'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching casos:', error);
        setCasos([]);
        return;
      }

      setCasos(data || []);
    } catch (error) {
      console.error('Error:', error);
      setCasos([]);
    } finally {
      setLoadingCasos(false);
    }
  };

  const fetchAbogados = async () => {
    if (!user) return;

    setLoadingAbogados(true);
    setErrorAbogados(null);

    try {
      console.log('🔍 Iniciando fetchAbogados con política RLS actualizada...');
      
      // Con la nueva política RLS, los super admins pueden ver todos los abogados
      const { data: abogadosData, error } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, email, especialidades, creditos_disponibles, created_at, tipo_abogado')
        .eq('role', 'abogado')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching abogados:', error);
        setErrorAbogados('Error al cargar la lista de abogados: ' + error.message);
        setAbogados([]);
        return;
      }

      console.log('✅ Abogados obtenidos exitosamente:', abogadosData?.length || 0);

      if (!abogadosData || abogadosData.length === 0) {
        console.log('⚠️ No se encontraron abogados');
        setAbogados([]);
        return;
      }

      // Para cada abogado, obtener estadísticas de casos asignados
      const abogadosConStats = await Promise.all(
        abogadosData.map(async (abogado) => {
          try {
            const { data: asignaciones } = await supabase
              .from('asignaciones_casos')
              .select('caso_id, estado_asignacion')
              .eq('abogado_id', abogado.id);

            const casos_asignados = asignaciones?.length || 0;
            const casos_activos = asignaciones?.filter(a => a.estado_asignacion === 'activa').length || 0;

            return {
              ...abogado,
              casos_asignados,
              casos_activos
            };
          } catch (error) {
            console.error(`Error obteniendo stats para abogado ${abogado.id}:`, error);
            return {
              ...abogado,
              casos_asignados: 0,
              casos_activos: 0
            };
          }
        })
      );

      console.log('✅ Abogados con estadísticas completados:', abogadosConStats.length);
      setAbogados(abogadosConStats);
    } catch (error) {
      console.error('❌ Error general en fetchAbogados:', error);
      setErrorAbogados('Error inesperado al cargar abogados');
      setAbogados([]);
    } finally {
      setLoadingAbogados(false);
    }
  };

  const assignCaseToLawyer = async (casoId: string, abogadoId: string, notas?: string) => {
    try {
      console.log('🎯 Asignando caso:', { casoId, abogadoId, notas });
      
      const { data, error } = await supabase.rpc('assign_case_to_lawyer', {
        p_caso_id: casoId,
        p_abogado_id: abogadoId,
        p_notas: notas || null
      });

      if (error) {
        console.error('❌ Error en assign_case_to_lawyer:', error);
        throw error;
      }

      console.log('✅ Caso asignado exitosamente');

      // Refrescar datos
      await Promise.all([fetchStats(), fetchCasos(), fetchAbogados()]);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error assigning case:', error);
      return { success: false, error: error.message };
    }
  };

  const retryFetchAbogados = () => {
    console.log('🔄 Reintentando fetchAbogados...');
    fetchAbogados();
  };

  return {
    stats,
    casos,
    abogados,
    loadingCasos,
    loadingAbogados,
    errorAbogados,
    refetchStats: fetchStats,
    refetchCasos: fetchCasos,
    refetchAbogados: fetchAbogados,
    retryFetchAbogados: fetchAbogados,
    assignCaseToLawyer
  };
};
