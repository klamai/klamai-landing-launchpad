
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

interface StripePaymentOptions {
  planId: string;
  casoId: string;
}

interface StripePaymentState {
  isLoading: boolean;
  isProcessing: boolean;
  sessionId: string | null;
  error: string | null;
}

export function useStripePayment() {
  const [state, setState] = useState<StripePaymentState>({
    isLoading: false,
    isProcessing: false,
    sessionId: null,
    error: null
  });

  const { toast } = useToast();
  const processingRef = useRef(false);
  const lastCallRef = useRef<number>(0);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const createCheckoutSession = useCallback(async (
    options: StripePaymentOptions,
    retryCount = 0
  ): Promise<{ url?: string; sessionId?: string } | null> => {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 segundo

    try {
      console.log(`[STRIPE-HOOK] Creando sesión de checkout (intento ${retryCount + 1})`);
      
      const { data, error } = await supabase.functions.invoke('crear-sesion-checkout', {
        body: {
          plan_id: options.planId,
          caso_id: options.casoId
        }
      });

      if (error) {
        // Si es error de rate limiting y tenemos intentos disponibles
        if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
          if (retryCount < maxRetries) {
            const delay = baseDelay * Math.pow(2, retryCount); // Backoff exponencial
            console.log(`[STRIPE-HOOK] Rate limit detectado, reintentando en ${delay}ms`);
            
            toast({
              title: "Procesando...",
              description: `Reintentando crear sesión de pago (${retryCount + 1}/${maxRetries + 1})`,
            });

            await sleep(delay);
            return createCheckoutSession(options, retryCount + 1);
          } else {
            throw new Error('Demasiadas solicitudes. Por favor, espera un momento e inténtalo de nuevo.');
          }
        }
        throw new Error(error.message || 'Error al crear sesión de pago');
      }

      if (!data?.url) {
        throw new Error('No se recibió URL de pago de Stripe');
      }

      console.log(`[STRIPE-HOOK] Sesión creada exitosamente: ${data.session_id}`);
      return data;
      
    } catch (error) {
      console.error(`[STRIPE-HOOK] Error en intento ${retryCount + 1}:`, error);
      
      if (retryCount < maxRetries && !(error instanceof Error && error.message.includes('Rate limit'))) {
        const delay = baseDelay * Math.pow(2, retryCount);
        console.log(`[STRIPE-HOOK] Reintentando en ${delay}ms`);
        await sleep(delay);
        return createCheckoutSession(options, retryCount + 1);
      }
      
      throw error;
    }
  }, [toast]);

  // Función principal con debouncing y protección contra llamadas simultáneas
  const initiatePayment = useCallback(async (options: StripePaymentOptions) => {
    // Prevenir múltiples ejecuciones simultáneas
    if (processingRef.current) {
      console.log('[STRIPE-HOOK] Pago ya en proceso, ignorando llamada');
      return;
    }

    // Prevenir llamadas muy rápidas (debouncing manual)
    const now = Date.now();
    if (now - lastCallRef.current < 2000) { // 2 segundos mínimo entre llamadas
      console.log('[STRIPE-HOOK] Llamada muy rápida, ignorando');
      toast({
        title: "Por favor espera",
        description: "Procesando solicitud anterior...",
        variant: "destructive"
      });
      return;
    }
    lastCallRef.current = now;

    // Marcar como procesando
    processingRef.current = true;
    setState(prev => ({
      ...prev,
      isLoading: true,
      isProcessing: true,
      error: null
    }));

    try {
      console.log('[STRIPE-HOOK] Iniciando proceso de pago', options);
      
      toast({
        title: "Procesando pago",
        description: "Creando sesión de pago segura...",
      });

      const result = await createCheckoutSession(options);
      
      if (!result?.url) {
        throw new Error('No se pudo crear la sesión de pago');
      }

      setState(prev => ({
        ...prev,
        sessionId: result.sessionId || null,
        isLoading: false,
        isProcessing: false
      }));

      console.log('[STRIPE-HOOK] Redirigiendo a Stripe:', result.url);
      
      // Pequeña pausa antes de redirigir para asegurar que el estado se actualice
      await sleep(500);
      
      // Redirigir a Stripe Checkout
      window.location.href = result.url;

    } catch (error) {
      console.error('[STRIPE-HOOK] Error completo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado al procesar el pago';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isProcessing: false,
        error: errorMessage
      }));

      toast({
        title: "Error al procesar el pago",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      // Liberar el lock después de un tiempo para permitir nuevos intentos
      setTimeout(() => {
        processingRef.current = false;
      }, 3000);
    }
  }, [createCheckoutSession, toast]);

  // Función para reiniciar el estado
  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      isProcessing: false,
      sessionId: null,
      error: null
    });
    processingRef.current = false;
  }, []);

  return {
    ...state,
    initiatePayment,
    resetState
  };
}
