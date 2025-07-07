
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planId = searchParams.get('planId');
  const casoId = searchParams.get('casoId');

  useEffect(() => {
    console.log('AuthCallback - Estado inicial:', { 
      loading, 
      user: user?.id, 
      planId, 
      casoId 
    });

    if (loading) return;

    if (!user) {
      console.log('AuthCallback - No hay usuario, redirigiendo a auth');
      navigate('/auth');
      return;
    }

    if (!planId || !casoId) {
      console.log('AuthCallback - Faltan parámetros, redirigiendo al dashboard');
      navigate('/dashboard');
      return;
    }

    console.log('AuthCallback - Iniciando proceso de pago');
    processPayment();
  }, [user, loading, planId, casoId]);

  const processPayment = async () => {
    if (processing) return;
    setProcessing(true);
    setError(null);

    try {
      console.log('AuthCallback - Paso 1: Vinculando caso al usuario');
      
      // 1. Vincular caso al usuario y transferir datos borrador
      await linkCaseToUser(casoId!, user!.id);
      
      console.log('AuthCallback - Paso 2: Creando sesión de pago');

      // 2. Crear sesión de pago en Stripe
      const { data, error } = await supabase.functions.invoke('crear-sesion-checkout', {
        body: {
          plan_id: planId,
          caso_id: casoId
        }
      });

      console.log('AuthCallback - Respuesta de crear-sesion-checkout:', { data, error });

      if (error) {
        throw new Error(`Error en la función: ${error.message}`);
      }

      if (!data?.url) {
        throw new Error('No se recibió URL de pago de Stripe');
      }

      console.log('AuthCallback - Redirigiendo a Stripe:', data.url);
      
      // Esperar un momento antes de redirigir para asegurar que todo esté listo
      setTimeout(() => {
        window.location.href = data.url;
      }, 500);

    } catch (error) {
      console.error('AuthCallback - Error completo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      setError(errorMessage);
      
      toast({
        title: "Error al procesar el pago",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Esperar un poco antes de redirigir para que el usuario vea el error
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } finally {
      setProcessing(false);
    }
  };

  const linkCaseToUser = async (casoId: string, userId: string) => {
    console.log('AuthCallback - linkCaseToUser iniciado:', { casoId, userId });
    
    try {
      // 1. Obtener datos del caso
      console.log('AuthCallback - Obteniendo datos del caso');
      const { data: caso, error: casoError } = await supabase
        .from('casos')
        .select('*')
        .eq('id', casoId)
        .single();

      if (casoError) {
        console.error('AuthCallback - Error al obtener caso:', casoError);
        throw new Error(`Error al obtener caso: ${casoError.message}`);
      }

      if (!caso) {
        throw new Error('No se encontró el caso especificado');
      }

      console.log('AuthCallback - Caso obtenido:', caso);

      // 2. Actualizar caso con el cliente_id
      console.log('AuthCallback - Actualizando caso con cliente_id');
      const { error: updateCasoError } = await supabase
        .from('casos')
        .update({
          cliente_id: userId,
          estado: 'esperando_pago'
        })
        .eq('id', casoId);

      if (updateCasoError) {
        console.error('AuthCallback - Error al actualizar caso:', updateCasoError);
        throw new Error(`Error al vincular caso: ${updateCasoError.message}`);
      }

      console.log('AuthCallback - Caso actualizado exitosamente');

      // 3. Actualizar perfil del usuario con datos borrador (opcional)
      const profileUpdates: any = {};
      
      if (caso.nombre_borrador) profileUpdates.nombre = caso.nombre_borrador;
      if (caso.apellido_borrador) profileUpdates.apellido = caso.apellido_borrador;
      if (caso.telefono_borrador) profileUpdates.telefono = caso.telefono_borrador;
      if (caso.ciudad_borrador) profileUpdates.ciudad = caso.ciudad_borrador;
      if (caso.tipo_perfil_borrador) profileUpdates.tipo_perfil = caso.tipo_perfil_borrador;
      if (caso.razon_social_borrador) profileUpdates.razon_social = caso.razon_social_borrador;
      if (caso.nif_cif_borrador) profileUpdates.nif_cif = caso.nif_cif_borrador;
      if (caso.direccion_fiscal_borrador) profileUpdates.direccion_fiscal = caso.direccion_fiscal_borrador;
      if (caso.nombre_gerente_borrador) profileUpdates.nombre_gerente = caso.nombre_gerente_borrador;

      if (Object.keys(profileUpdates).length > 0) {
        console.log('AuthCallback - Actualizando perfil con:', profileUpdates);
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', userId);

        if (profileError) {
          console.error('AuthCallback - Error al actualizar perfil (no crítico):', profileError);
          // No lanzar error aquí para no bloquear el pago
        } else {
          console.log('AuthCallback - Perfil actualizado exitosamente');
        }
      }

    } catch (error) {
      console.error('AuthCallback - Error en linkCaseToUser:', error);
      throw error;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-red-950 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Error al procesar el pago
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Serás redirigido al dashboard en unos segundos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Procesando tu solicitud...
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {processing ? 'Configurando tu pago...' : 'Te estamos redirigiendo al sistema de pago seguro.'}
        </p>
        {planId && casoId && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Plan: {planId}</p>
            <p>Caso: {casoId.slice(0, 8)}...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
