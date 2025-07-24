
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useStripePayment } from '@/hooks/useStripePayment';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isLoading, isProcessing, initiatePayment, resetState } = useStripePayment();

  const planId = searchParams.get('planId');
  const casoId = searchParams.get('casoId');

  useEffect(() => {
    console.log('AuthCallback - Estado inicial:', { 
      loading, 
      user: user?.id, 
      planId, 
      casoId,
      processing,
      isProcessing
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

    // Prevenir múltiples ejecuciones
    if (processing || isProcessing) {
      console.log('AuthCallback - Ya está procesando, saltando');
      return;
    }

    console.log('AuthCallback - Iniciando proceso de pago');
    processPayment();
  }, [user, loading, planId, casoId, processing, isProcessing]);

  const processPayment = async () => {
    if (processing || isProcessing) {
      console.log('AuthCallback - Proceso ya en marcha, saltando');
      return;
    }
    
    setProcessing(true);
    setError(null);

    try {
      console.log('AuthCallback - Paso 1: Vinculando caso al usuario');
      
      // 1. Vincular caso al usuario y transferir datos borrador
      await linkCaseToUser(casoId!, user!.id);
      
      console.log('AuthCallback - Paso 2: Iniciando pago con hook mejorado');

      // 2. Usar el hook mejorado para manejar el pago
      await initiatePayment({
        planId: planId!,
        casoId: casoId!
      });

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
          {processing || isProcessing ? 'Configurando tu pago...' : 'Te estamos redirigiendo al sistema de pago seguro.'}
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
