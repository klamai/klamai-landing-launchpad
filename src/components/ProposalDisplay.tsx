import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, X, Sparkles, Clock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PricingSection } from '@/components/ui/pricing-section';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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
  const { user } = useAuth();
  const { toast } = useToast();

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    if (!user) {
      setAuthModalMode('signup');
      setShowAuthModal(true);
    } else {
      // Proceder al pago
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
        title: "¡Progreso guardado!",
        description: "Tu caso ha sido vinculado y quedará como 'Listo para propuesta'.",
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
    try {
      toast({
        title: "Procesando pago",
        description: "Creando sesión de pago...",
      });

      const { data, error } = await supabase.functions.invoke('crear-sesion-checkout', {
        body: {
          plan_id: planId,
          caso_id: casoId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        // Redirigir a Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (error) {
      console.error('Error al crear sesión de pago:', error);
      toast({
        title: "Error en el pago",
        description: error instanceof Error ? error.message : "Error al procesar el pago. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const sendProgressSummary = async () => {
    // TODO: Implementar envío de resumen por email
    console.log('Enviando resumen de progreso para caso:', casoId);
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
            title: "¡Bienvenido!",
            description: "Tu cuenta ha sido creada, tu caso vinculado y está 'Listo para propuesta'.",
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
      console.log('Linking case to user:', { userId, caseId });
      
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

      console.log('Case linked to user successfully');

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
    onSelect: () => handlePlanSelect('consulta-estrategica')
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
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
          <PricingSection tier={singlePlan} />
        </motion.div>

        {/* Sección de guardar progreso */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <Mail className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              ¿Necesitas más tiempo para decidir?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Recibe un resumen completo de tu caso por email. Podrás revisar toda la información y decidir con calma.
            </p>
            <Button
              onClick={handleSaveProgress}
              variant="outline"
              className="px-8 py-3 text-lg font-medium border-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300"
            >
              Enviarme la propuesta por email
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Modal de Autenticación */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authModalMode}
        planId={selectedPlan}
        casoId={casoId}
      />
    </div>
  );
};

export default ProposalDisplay;