import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { filterCaseForClient } from '@/utils/caseDisplayUtils';
import { Caso } from '@/types/database';

export const useClientCases = () => {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchClientCases();
  }, [user]);

  const fetchClientCases = async () => {
    if (!user) {
      setCasos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Verificar explícitamente que el usuario es un cliente
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        setError('Error al verificar permisos de usuario');
        setCasos([]);
        return;
      }

      // Validación estricta: solo clientes pueden usar este hook
      if (profile.role !== 'cliente') {
        console.error('Acceso denegado: usuario no es cliente');
        setError('Acceso no autorizado');
        setCasos([]);
        return;
      }

      // Query específico para clientes: SOLO sus propios casos
      const { data, error: casesError } = await supabase
        .from('casos')
        .select(`
          *,
          especialidades (
            nombre
          ),
          profiles!casos_cliente_id_fkey (
            nombre,
            apellido,
            email,
            telefono,
            ciudad
          )
        `)
        .eq('cliente_id', user.id) // Filtro estricto: solo casos del cliente
        .order('created_at', { ascending: false });

      if (casesError) {
        console.error('Error fetching client cases:', casesError);
        setError('Error al cargar los casos');
        setCasos([]);
        return;
      }

      // Filtrar campos sensibles para clientes
      const processedCasos: Caso[] = (data || []).map(caso => ({
        ...caso,
        especialidades: caso.especialidades || undefined
      })).map(caso => filterCaseForClient(caso));

      setCasos(processedCasos);
    } catch (error) {
      console.error('Error in useClientCases:', error);
      setError('Error inesperado al cargar los casos');
      setCasos([]);
    } finally {
      setLoading(false);
    }
  };

  return { 
    casos, 
    loading, 
    error, 
    refetch: fetchClientCases 
  };
}; 