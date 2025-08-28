import { useState, useEffect, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { Star, X, Sparkles, Clock, Mail, CheckCircle, FileText, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { SecureLogger } from '@/utils/secureLogging';
import { ConsentCheckbox } from '@/components/shared/ConsentCheckbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const PricingSection = lazy(() => import('@/components/ui/pricing-section').then(m => ({ default: m.PricingSection })));
const AuthModal = lazy(() => import('@/components/AuthModal'));

// Esquema de validación para el formulario de presupuesto
const budgetRequestSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce un email válido." }),
  acepta_politicas: z.boolean().refine(val => val === true, {
    message: "Debes aceptar los términos y la política de privacidad.",
  }),
});

type BudgetRequestFormData = z.infer<typeof budgetRequestSchema>;

interface ProposalData {
  etiqueta_caso: string;
  subtitulo_refuerzo: string;
  titulo_personalizado: string;
}

interface ProposalDisplayProps {
  proposalData: ProposalData;
  casoId: string;
  isModal?: boolean;
  onClose?: () => void;
}

const ProposalDisplay = ({ proposalData, casoId, isModal = false, onClose }: ProposalDisplayProps) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('signup');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false); // Estado de carga
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSuccessView, setShowSuccessView] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [budgetRequestSent, setBudgetRequestSent] = useState(false); // Prevenir re-apertura
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Formulario para solicitud de presupuesto
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<BudgetRequestFormData>({
    resolver: zodResolver(budgetRequestSchema),
    defaultValues: {
      email: "",
      acepta_politicas: false,
    },
  });
  const fetchCaso = async () => {
    try {
      const { data, error } = await supabase
        .from('casos')
        .select('id, estado')
        .eq('id', casoId as any)
        .single();
      if (error) return null;
      return data;
    } catch {
      return null;
    }
  };
  const prefetchCaso = () => {
    queryClient.prefetchQuery({
      queryKey: ['caso', casoId],
      queryFn: fetchCaso,
      staleTime: 120000
    });
  };
  const preloadAuthModal = () => {
    import('@/components/AuthModal');
  };

  const handleRequestBudget = async () => {
    // Prevenir re-apertura si ya se envió la solicitud
    if (budgetRequestSent) {
      toast({
        title: "Solicitud ya enviada",
        description: "Ya has solicitado un presupuesto para este caso. Te enviaremos la respuesta por email.",
      });
      return;
    }
    
    // Siempre mostrar modal de email, sin verificar autenticación
    setShowEmailModal(true);
  };

  const handleBudgetRequest = async (data: BudgetRequestFormData) => {
    try {
      setIsSubmitting(true);
      
      // 1. Actualizar email_borrador en la BD
      const { error: updateError } = await supabase
        .from('casos')
        .update({ email_borrador: data.email } as any)
        .eq('id', casoId as any);
      
      if (updateError) {
        throw new Error('Error al actualizar email');
      }

      // 2. Registrar consentimiento legalmente
      await supabase.functions.invoke('record-consent', {
        body: {
          user_id: null, // Usuario anónimo
          caso_id: casoId,
          consent_type: 'budget_request',
          accepted_terms: data.acepta_politicas,
          accepted_privacy: data.acepta_politicas,
          policy_terms_version: 1,
          policy_privacy_version: 1,
        },
      });

      // 3. Marcar caso como listo para propuesta
      await supabase.rpc('set_caso_listo_para_propuesta', { p_caso_id: casoId });
      
      // 3.1. Disparar WhatsApp inmediatamente (sin delay para evitar timeout)
      supabase.functions.invoke('enviar-mensaje-presupuesto-whatsapp', {
        body: { caso_id: casoId, delaySecs: 0 }
      }).catch(() => {});

      // 4. Marcar solicitud como enviada para prevenir re-apertura
      setBudgetRequestSent(true);
      
      // 5. Cerrar modal de email y mostrar éxito
      setShowEmailModal(false);
      setShowSuccessView(true);
      
      // 6. Mostrar toast de confirmación
      toast({
        title: "¡Solicitud recibida!",
        description: "Te enviaremos un presupuesto personalizado por email en 24-48 horas.",
      });
      
      // 7. Resetear formulario
      reset();
      
    } catch (error) {
      console.error('Error al solicitar presupuesto:', error);
      toast({
        title: "Error al procesar solicitud",
        description: "No se pudo procesar tu solicitud. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para redirigir al inicio cuando se cierre el modal de éxito
  const handleCloseSuccessModal = () => {
    setShowSuccessView(false);
    navigate('/'); // Redirigir al inicio
  };

  const handleGoToDashboard = async () => {
    if (!user) {
      setAuthModalMode('signup');
      setShowAuthModal(true);
      return;
    }
    
    // Intentar vincular caso si hay token de sesión
    try {
      await linkCaseToUser(user.id, casoId);
    } catch (error) {
      // No bloquear la redirección si falla la vinculación
      console.error('Error al vincular caso:', error);
    }
    
    window.location.href = '/dashboard';
  };

  const handleAttachDocuments = async () => {
    if (!user) {
      setAuthModalMode('signup');
      setShowAuthModal(true);
      return;
    }
    
    // Intentar vincular caso si hay token de sesión
    try {
      await linkCaseToUser(user.id, casoId);
    } catch (error) {
      console.error('Error al vincular caso:', error);
    }
    
    // Aquí se abriría el modal de documentos (no implementado aún)
    toast({
      title: "Funcionalidad en desarrollo",
      description: "La subida de documentos estará disponible próximamente.",
    });
  };
  useEffect(() => {
    if (isModal) {
      prefetchCaso();
    }
  }, [isModal, prefetchCaso]);

  const handlePlanSelect = async (planId: string) => {
    setSelectedPlan(planId);
    setIsLoadingPayment(true); // Inicia el estado de carga

    if (!user) {
      // --- NUEVO FLUJO DE PAGO ANÓNIMO ---
      try {
        toast({
          title: "Redirigiendo a la pasarela de pago...",
          description: "Estás a punto de asegurar tu consulta.",
        });

        const { data, error } = await supabase.functions.invoke('crear-sesion-checkout-anonima', {
          body: {
            caso_id: casoId,
            flujo_origen: 'chat_anonimo' // Etiqueta clave para el webhook
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data?.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          throw new Error('No se recibió una URL de pago válida.');
        }

      } catch (error) {
        toast({
          title: "Error al iniciar el pago",
          description: error instanceof Error ? error.message : "No pudimos conectar con la pasarela de pago. Por favor, inténtalo de nuevo.",
          variant: "destructive"
        });
        setIsLoadingPayment(false); // Detiene la carga en caso de error
      }
      // No se detiene la carga en caso de éxito porque hay redirección

    } else {
      // --- FLUJO EXISTENTE PARA USUARIOS REGISTRADOS (ahora usa handlePayment) ---
      handlePayment(planId);
    }
  };

  const handleSaveProgress = async () => {
    if (!user) {
      setAuthModalMode('signup');
      setShowAuthModal(true);
      return;
    }

    try {
      // Vincular caso al usuario primero (si existe token de sesión)
      await linkCaseToUser(user.id, casoId);

      // Mantener el caso en 'listo_para_propuesta' sin iniciar pago ni enviar email automático
      await supabase.rpc('set_caso_listo_para_propuesta', { p_caso_id: casoId });
      
      toast({
        title: "¡Solicitud registrada!",
        description: "Tu caso ha sido vinculado y quedará 'Listo para propuesta'. Un abogado especialista analizará tu situación y te enviaremos un presupuesto personalizado por email.",
      });
      
      // Redirigir al dashboard
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('Error al guardar progreso:', error);
      toast({
        title: "Error al guardar progreso",
        description: "No se pudo vincular tu caso. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const handlePayment = async (planId: string) => {
    // Aseguramos que el estado de carga esté activo
    if (!isLoadingPayment) setIsLoadingPayment(true);

    try {
      toast({
        title: "Procesando...",
        description: "Creando tu sesión de pago segura.",
      });

      const { data, error } = await supabase.functions.invoke('crear-sesion-checkout', {
        body: {
          plan_id: planId,
          caso_id: casoId,
          flujo_origen: 'dashboard_registrado' // Etiqueta para el webhook
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (error) {
      toast({
        title: "Error en el pago",
        description: error instanceof Error ? error.message : "Error al procesar el pago. Inténtalo de nuevo.",
        variant: "destructive"
      });
      setIsLoadingPayment(false); // Detiene la carga en caso de error
    }
  };

  const sendProgressSummary = async () => {
    // TODO: Implementar envío de resumen por email
    SecureLogger.info('Enviando resumen de progreso para caso', 'proposal_display');
    toast({
      title: "Resumen enviado",
      description: "Te hemos enviado un resumen completo a tu email.",
    });
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    
    try {
      if (selectedPlan) {
        // Si hay plan seleccionado, proceder al pago
        handlePayment(selectedPlan);
      } else {
        // Si no hay plan, vincular caso y mantener 'listo_para_propuesta'
        if (user) {
          await linkCaseToUser(user.id, casoId);
          await supabase.rpc('set_caso_listo_para_propuesta', { p_caso_id: casoId });
          
          toast({
            title: "¡Solicitud registrada!",
            description: "Tu cuenta ha sido creada, tu caso vinculado y está 'Listo para propuesta'. Un abogado especialista te enviará un presupuesto personalizado por email.",
          });
          
          // Redirigir al dashboard
          window.location.href = '/dashboard';
        }
      }
    } catch (error) {
      console.error('Error en handleAuthSuccess:', error);
      toast({
        title: "Error",
        description: "No se pudo completar la operación. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const linkCaseToUser = async (userId: string, caseId: string) => {
    try {
      SecureLogger.info('Linking case to user', 'proposal_display');
      
      const sessionToken = localStorage.getItem('current_session_token');
      
      if (!sessionToken) return; // si no hay token, puede estar ya vinculado

      const { data, error } = await supabase.rpc('assign_anonymous_case_to_user', {
        p_caso_id: caseId,
        p_session_token: sessionToken,
        p_user_id: userId
      });

      if (error) {
        console.error('Error in assign_anonymous_case_to_user function:', error);
        throw new Error(`Error al asignar caso: ${error.message}`);
      }

      if (!data) {
        console.error('Case assignment returned false');
        throw new Error('No se pudo asignar el caso. El caso podría haber expirado o ya estar asignado.');
      }

      SecureLogger.info('Case linked to user successfully', 'proposal_display');

      // Clean up tokens after successful assignment
      localStorage.removeItem('current_caso_id');
      localStorage.removeItem('current_session_token');
      
    } catch (error) {
      console.error('Error in linkCaseToUser:', error);
      throw error;
    }
  };

  // Plan único de pago con Price ID real de Stripe
  const singlePlan = {
    id: 'consulta-estrategica',
    name: 'Consulta Estratégica con Abogado Especialista',
    originalPrice: 97.00,
    price: 37.50,
    description: 'Análisis completo de tu caso con plan de acción personalizado',
    features: [
      {
        name: 'Sesión personalizada de 30 minutos',
        description: 'Vía Zoom/WhatsApp con un abogado especialista en tu área.',
        included: true
      },
      {
        name: 'Revisión detallada de documentos',
        description: 'Análisis completo de tu caso y documentación legal.',
        included: true
      },
      {
        name: 'Plan de acción específico',
        description: 'Estrategia clara con los pasos clave para tu situación.',
        included: true
      },
      {
        name: 'Asesoramiento directo',
        description: 'Sin esperas, acceso inmediato a orientación legal experta.',
        included: true
      }
    ],
    highlight: true,
    badge: 'Oferta Especial',
    priceId: 'price_1Rc0kkI0mIGG72Op6Rk4GulG', // Price ID real de Stripe
    onSelect: () => handlePlanSelect('consulta-estrategica'),
    isLoading: isLoadingPayment // Pasamos el estado de carga
  };

  // Planes ocultos para uso futuro
  // const hiddenPlans = [
  //   {
  //     id: 'plan-asesoria',
  //     name: 'Plan Asesoría Mensual',
  //     price: '19,90€/mes',
  //     description: 'Acompañamiento legal completo durante todo el proceso',
  //     features: [
  //       'Todo lo de Consulta Estratégica',
  //       'Asesoría ilimitada por WhatsApp',
  //       'Revisión de documentos',
  //       'Representación en gestiones',
  //       'Seguimiento continuo'
  //     ],
  //     popular: true,
  //     color: 'green'
  //   }
  // ];

  return (
    <div className={cn(
      isModal 
        ? "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" 
        : "min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800 p-4"
    )}>
      <div className={cn(
        "max-w-4xl mx-auto",
        isModal && "bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto p-6 w-full max-w-6xl"
      )}>
        {/* Botón de cerrar para modal */}
        {isModal && onClose && (
          <div className="flex justify-end mb-4">
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full shadow-sm hover:shadow-md transition-all"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Header personalizado */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-4">
            <Star className="w-4 h-4 mr-2" />
            {proposalData.etiqueta_caso}
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {proposalData.titulo_personalizado}
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {proposalData.subtitulo_refuerzo}
          </p>
        </motion.div>

        {/* Plan de servicio único */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Suspense fallback={<div className="animate-pulse bg-white/60 dark:bg-gray-800/60 rounded-xl h-64 sm:h-72 w-full" />}> 
          <PricingSection tier={singlePlan} />
          </Suspense>
        </motion.div>

        {/* Sección de guardar progreso */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              ¿Prefieres recibir un presupuesto personalizado?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Un abogado especialista analizará tu caso y te enviaremos por email un <strong>presupuesto a medida</strong> con el plan de acción recomendado. Sin pago ahora, sin compromiso.
            </p>
            <Button
              onClick={handleRequestBudget}
              variant="outline"
              disabled={budgetRequestSent}
              onMouseEnter={() => { preloadAuthModal(); prefetchCaso(); }}
              onFocus={() => { preloadAuthModal(); prefetchCaso(); }}
              className="w-full sm:w-auto px-4 sm:px-6 py-3 text-sm sm:text-base font-medium border-2 border-blue-500 text-blue-600 bg-white dark:bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 break-words whitespace-normal text-center leading-snug hyphens-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {budgetRequestSent ? 'Presupuesto solicitado ✓' : 'Enviarme un presupuesto personalizado'}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Modal de confirmación de email */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <Mail className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Confirmar tu email
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Te enviaremos el presupuesto personalizado a este email
              </p>
            </div>
            
            <form onSubmit={handleSubmit(handleBudgetRequest)} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  className="mt-1"
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
              
              <ConsentCheckbox 
                control={control} 
                name="acepta_politicas"
                error={errors.acepta_politicas?.message}
              />
              
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEmailModal(false);
                    reset(); // Resetear formulario al cerrar
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Procesando...' : 'Confirmar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vista de éxito */}
      {showSuccessView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                ¡Solicitud recibida!
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Un abogado especialista analizará tu caso y te enviaremos un presupuesto personalizado por email en 24-48 horas.
              </p>
            </div>
            
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={handleCloseSuccessModal}
                className="w-full py-2 text-gray-500 hover:text-gray-700"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Autenticación */}
      <Suspense fallback={null}>
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authModalMode}
        planId={selectedPlan}
        casoId={casoId}
      />
      </Suspense>
    </div>
  );
};

export default ProposalDisplay;