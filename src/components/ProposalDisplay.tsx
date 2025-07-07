
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Star, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

  const plans = [
    {
      id: 'consulta-estrategica',
      name: 'Consulta Estratégica',
      price: '49€',
      description: 'Análisis completo de tu caso con plan de acción',
      features: [
        'Análisis detallado del caso',
        'Estrategia personalizada',
        'Documento de recomendaciones',
        'Seguimiento de 7 días'
      ],
      popular: false,
      color: 'blue'
    },
    {
      id: 'plan-asesoria',
      name: 'Plan Asesoría Mensual',
      price: '149€/mes',
      description: 'Acompañamiento legal completo durante todo el proceso',
      features: [
        'Todo lo de Consulta Estratégica',
        'Asesoría ilimitada por WhatsApp',
        'Revisión de documentos',
        'Representación en gestiones',
        'Seguimiento continuo'
      ],
      popular: true,
      color: 'green'
    }
  ];

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

  const handleSaveProgress = () => {
    if (!user) {
      setAuthModalMode('signup');
      setShowAuthModal(true);
    } else {
      // Usuario ya autenticado, enviar resumen
      sendProgressSummary();
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

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (selectedPlan) {
      handlePayment(selectedPlan);
    } else {
      sendProgressSummary();
    }
    toast({
      title: "¡Bienvenido!",
      description: "Tu cuenta ha sido creada exitosamente.",
    });
  };

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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
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

        {/* Planes de servicio */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className={`relative p-8 h-full transition-all duration-300 hover:shadow-xl ${
                plan.popular 
                  ? 'border-green-500 shadow-lg transform scale-105' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Más Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {plan.price}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`w-full py-3 text-lg font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Seleccionar Plan
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Opción de guardar progreso */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              ¿Necesitas más tiempo para decidir?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Guarda tu progreso y recibe un resumen completo por email. Podrás revisar toda la información y decidir con calma.
            </p>
            <Button
              onClick={handleSaveProgress}
              variant="outline"
              className="px-8 py-3 text-lg font-medium border-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300"
            >
              Guardar Progreso y Recibir Resumen por Email
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
      />
    </div>
  );
};

export default ProposalDisplay;
