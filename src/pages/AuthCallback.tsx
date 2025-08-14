
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
  const intent = searchParams.get('intent');
  const proposalToken = searchParams.get('token');

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

    // Nuevo flujo: si viene desde landing de propuesta con intent=pay y token
    if (intent === 'pay' && proposalToken && planId) {
      (async () => {
        try {
          console.log('AuthCallback - Flujo token propuesta: vinculando por token y creando checkout');
          // Vincular consentimientos anónimos al usuario autenticado para este token
          try {
            await supabase.functions.invoke('record-consent', {
              body: { proposal_token: proposalToken, link_only: true },
            });
            console.log('AuthCallback - Consentimientos vinculados exitosamente');
          } catch (e) {
            console.warn('AuthCallback - No se pudieron vincular consentimientos:', e);
          }
          const linkedCasoId = await linkCaseByProposalToken(proposalToken);
          await createCheckout(planId, linkedCasoId);
        } catch (e) {
          console.error('AuthCallback - Error en flujo por token de propuesta:', e);
          navigate('/dashboard');
        }
      })();
      return;
    }

    // Si tenemos casoId pero NO planId: sólo vincular el caso y volver al dashboard
    if (casoId && !planId) {
      (async () => {
        try {
          console.log('AuthCallback - Vinculación sin compra: intentando asignar caso');
          await linkCaseToUser(casoId, user.id);
          console.log('AuthCallback - Vinculación OK. Redirigiendo al dashboard');
          navigate('/dashboard');
        } catch (e) {
          console.error('AuthCallback - Error al vincular sin compra:', e);
          navigate('/dashboard');
        }
      })();
      return;
    }

    // Si faltan ambos, ir a dashboard
    if (!casoId && !planId) {
      console.log('AuthCallback - Sin parámetros relevantes, redirigiendo al dashboard');
      navigate('/dashboard');
      return;
    }

    // Si tenemos ambos planId y casoId => flujo de pago
    console.log('AuthCallback - Iniciando proceso de pago');
    processPayment();
  }, [user, loading, planId, casoId, navigate]);

  const processPayment = async () => {
    if (processing) return;
    setProcessing(true);
    setError(null);

    try {
      console.log('AuthCallback - Paso 1: Vinculando caso al usuario');
      await linkCaseToUser(casoId!, user!.id);
      console.log('AuthCallback - Paso 2: Creando sesión de pago');
      await createCheckout(planId!, casoId!);

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

  const createCheckout = async (planId: string, casoId: string) => {
    const { data, error } = await supabase.functions.invoke('crear-sesion-checkout', {
      body: { plan_id: planId, caso_id: casoId }
    });
    console.log('AuthCallback - Respuesta de crear-sesion-checkout:', { data, error });
    if (error) throw new Error(`Error en la función: ${error.message}`);
    if (!data?.url) throw new Error('No se recibió URL de pago de Stripe');
    setTimeout(() => { window.location.href = data.url; }, 300);
  };

  const linkCaseByProposalToken = async (token: string): Promise<string> => {
    console.log('AuthCallback - linkCaseByProposalToken iniciado');
    const { data, error } = await supabase.rpc('link_case_by_proposal_token', { p_token: token as any });
    if (error) throw new Error(error.message || 'No se pudo vincular el caso por token');
    const linkedCasoId = (data as any) as string;
    if (!linkedCasoId) throw new Error('No se obtuvo caso_id al vincular por token');
    return linkedCasoId;
  };

  const linkCaseToUser = async (casoId: string, userId: string) => {
    console.log('AuthCallback - linkCaseToUser iniciado:', { casoId, userId });
    
    try {
      // Obtener session_token del localStorage
      const sessionToken = localStorage.getItem('current_session_token');
      
      if (!sessionToken) {
        throw new Error('Token de sesión no encontrado');
      }

      console.log('AuthCallback - Usando función segura para asignar caso');
      
      // Usar la función segura para asignar el caso
      const { data, error } = await supabase.rpc('assign_anonymous_case_to_user', {
        p_caso_id: casoId,
        p_session_token: sessionToken,
        p_user_id: userId
      });

      if (error) {
        console.error('AuthCallback - Error en función assign_anonymous_case_to_user:', error);
        throw new Error(`Error al asignar caso: ${error.message}`);
      }

      if (!data) {
        throw new Error('No se pudo asignar el caso. El caso podría haber expirado o ya estar asignado.');
      }

      console.log('AuthCallback - Caso asignado exitosamente');

      // Limpiar tokens del localStorage después de asignación exitosa
      localStorage.removeItem('current_caso_id');
      localStorage.removeItem('current_session_token');

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
