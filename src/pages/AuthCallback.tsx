
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SecureLogger } from '@/utils/secureLogging';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('Verificando sesión...');

  const callbackIntent = useMemo(() => {
  const planId = searchParams.get('planId');
  const casoId = searchParams.get('casoId');
  const intent = searchParams.get('intent');
  const proposalToken = searchParams.get('token');
    const role = searchParams.get('role');

    if (role && !planId && !casoId && !intent && !proposalToken) {
      return { type: 'google-login', role };
    }
    if (intent === 'pay' && proposalToken && planId) {
      return { type: 'payment-proposal', proposalToken, planId };
    }
    if (casoId && !planId) {
      return { type: 'link-case', casoId };
    }
    if (planId && casoId) {
      return { type: 'payment', planId, casoId };
    }
    return { type: 'redirect-dashboard' };
  }, [searchParams]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      SecureLogger.info('No hay usuario, redirigiendo a /auth', 'auth_callback');
      navigate('/auth');
      return;
    }

    SecureLogger.info(`Intención detectada: ${callbackIntent.type}`, 'auth_callback');

    switch (callbackIntent.type) {
      case 'google-login':
        setMessage('Finalizando inicio de sesión...');
        handleGoogleLoginRedirect();
        break;
      case 'payment-proposal':
        setMessage('Preparando tu propuesta de pago...');
        processPaymentProposal(callbackIntent.planId!, callbackIntent.proposalToken!);
        break;
      case 'link-case':
        setMessage('Asociando tu caso...');
        linkCaseOnly(callbackIntent.casoId!);
        break;
      case 'payment':
        setMessage('Redirigiendo al sistema de pago seguro...');
        processPayment(callbackIntent.planId!, callbackIntent.casoId!);
        break;
      case 'redirect-dashboard':
      default:
        setMessage('Redirigiendo a tu dashboard...');
          navigate('/dashboard');
        break;
    }
  }, [user, authLoading, callbackIntent, navigate]);

  const processPayment = async (planId: string, casoId: string) => {
    if (processing) return;
    setProcessing(true);
    setError(null);

    try {
      SecureLogger.info('Paso 1: Vinculando caso al usuario', 'auth_callback');
      await linkCaseToUser(casoId, user!.id);
      SecureLogger.info('Paso 2: Creando sesión de pago', 'auth_callback');
      await createCheckout(planId, casoId);

    } catch (error) {
      SecureLogger.error(error, 'process_payment');
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

  const processPaymentProposal = async (planId: string, token: string) => {
    if (processing) return;
    setProcessing(true);
    setError(null);
    try {
      SecureLogger.info('Flujo token propuesta: vinculando por token y creando checkout', 'auth_callback');
      try {
        await supabase.functions.invoke('record-consent', {
          body: { proposal_token: token, link_only: true },
        });
        SecureLogger.info('Consentimientos vinculados exitosamente', 'auth_callback');
      } catch (e) {
        SecureLogger.warn('No se pudieron vincular consentimientos', 'auth_callback');
      }
      const linkedCasoId = await linkCaseByProposalToken(token);
      await createCheckout(planId, linkedCasoId);
    } catch (e: any) {
       SecureLogger.error(e, 'process_payment_proposal');
       setError(e.message || 'Ocurrió un error al procesar la propuesta.');
       setTimeout(() => navigate('/dashboard'), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const linkCaseOnly = async (casoId: string) => {
     if (processing) return;
     setProcessing(true);
     setError(null);
     try {
       SecureLogger.info('Vinculación sin compra: intentando asignar caso', 'auth_callback');
       await linkCaseToUser(casoId, user!.id);
       toast({ title: "Éxito", description: "El caso ha sido vinculado a tu cuenta." });
       SecureLogger.info('Vinculación OK. Redirigiendo al dashboard', 'auth_callback');
       navigate('/dashboard');
     } catch (e: any) {
       SecureLogger.error(e, 'link_case_only');
       setError(e.message || 'Ocurrió un error al vincular el caso.');
       setTimeout(() => navigate('/dashboard'), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const createCheckout = async (planId: string, casoId: string) => {
    const { data, error } = await supabase.functions.invoke('crear-sesion-checkout', {
      body: { plan_id: planId, caso_id: casoId }
    });
    SecureLogger.info('Respuesta de crear-sesion-checkout recibida', 'auth_callback');
    if (error) throw new Error(`Error en la función: ${error.message}`);
    if (!data?.url) throw new Error('No se recibió URL de pago de Stripe');
    setTimeout(() => { window.location.href = data.url; }, 300);
  };

  const linkCaseByProposalToken = async (token: string): Promise<string> => {
    SecureLogger.info('linkCaseByProposalToken iniciado', 'auth_callback');
    const { data, error } = await supabase.rpc('link_case_by_proposal_token', { p_token: token as any });
    if (error) throw new Error(error.message || 'No se pudo vincular el caso por token');
    const linkedCasoId = (data as any) as string;
    if (!linkedCasoId) throw new Error('No se obtuvo caso_id al vincular por token');
    return linkedCasoId;
  };

  const linkCaseToUser = async (casoId: string, userId: string) => {
    SecureLogger.info('linkCaseToUser iniciado', 'auth_callback');
    
    try {
      // Obtener session_token del localStorage
      const sessionToken = localStorage.getItem('current_session_token');
      
      if (!sessionToken) {
        throw new Error('Token de sesión no encontrado');
      }

      SecureLogger.info('Usando función segura para asignar caso', 'auth_callback');
      
      // Usar la función segura para asignar el caso
      const { data, error } = await supabase.rpc('assign_anonymous_case_to_user', {
        p_caso_id: casoId,
        p_session_token: sessionToken,
        p_user_id: userId
      });

      if (error) {
        SecureLogger.error(error, 'assign_anonymous_case_error');
        throw new Error(`Error al asignar caso: ${error.message}`);
      }

      if (!data) {
        throw new Error('No se pudo asignar el caso. El caso podría haber expirado o ya estar asignado.');
      }

      SecureLogger.info('Caso asignado exitosamente', 'auth_callback');

      // Limpiar tokens del localStorage después de asignación exitosa
      localStorage.removeItem('current_caso_id');
      localStorage.removeItem('current_session_token');

    } catch (error) {
      SecureLogger.error(error, 'link_case_to_user');
      throw error;
    }
  };

  // Nueva función para manejar la redirección del login con Google
  const handleGoogleLoginRedirect = async () => {
    try {
      const userId = user!.id;
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, tipo_abogado')
        // @ts-ignore
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        SecureLogger.error(profileError, 'get_profile_error');
        // Si no se puede obtener el perfil, redirigir al dashboard por defecto
        navigate('/dashboard');
        return;
      }

      // Log seguro: solo información no sensible
      SecureLogger.info(`Perfil obtenido para redirección: role=${profile.role}, tipo=${profile.tipo_abogado}`, 'auth_callback');

      // Redirigir según el rol del perfil
      const userProfile = profile as { role: string; tipo_abogado: string };

      if (userProfile.tipo_abogado === 'super_admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (userProfile.role === 'abogado') {
        navigate('/abogados/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }

    } catch (error) {
      SecureLogger.error(error, 'handle_google_login_redirect');
      // En caso de error, redirigir al dashboard por defecto
      navigate('/dashboard');
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
          {message}
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
