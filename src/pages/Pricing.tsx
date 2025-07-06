
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Star, Scale, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AnimatedBackground from "@/components/AnimatedBackground";

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  isPopular: boolean;
  planType: 'one-time' | 'subscription';
}

const plans: PricingPlan[] = [
  {
    name: "CONSULTA INDIVIDUAL",
    price: "49",
    yearlyPrice: "49",
    period: "pago único",
    features: [
      "Análisis completo de tu caso legal",
      "Propuesta personalizada",
      "Recomendaciones específicas",
      "Documentación del análisis",
      "Acceso durante 30 días"
    ],
    description: "Perfecto para consultas puntuales",
    buttonText: "Obtener Análisis",
    isPopular: false,
    planType: 'one-time'
  },
  {
    name: "ASESORÍA PREMIUM",
    price: "99",
    yearlyPrice: "79",
    period: "mes",
    features: [
      "Todo lo de Consulta Individual",
      "Consultas legales ilimitadas",
      "Seguimiento de casos activos",
      "Soporte prioritario 24/7",
      "Actualizaciones legales",
      "Acceso a biblioteca jurídica",
      "Consultas telefónicas incluidas"
    ],
    description: "Ideal para empresas y casos complejos",
    buttonText: "Comenzar Premium",
    isPopular: true,
    planType: 'subscription'
  }
];

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePlanSelect = async (plan: PricingPlan) => {
    try {
      console.log('Procesando selección de plan:', { planType: plan.planType, isYearly });
      
      const functionName = plan.planType === 'one-time' ? 'create-one-time-payment' : 'create-subscription';
      const payload = plan.planType === 'subscription' 
        ? { isYearly } 
        : {};

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });

      if (error) {
        console.error('Error al crear sesión de pago:', error);
        toast({
          title: "Error",
          description: "No se pudo procesar el pago. Inténtalo de nuevo.",
          variant: "destructive"
        });
        return;
      }

      if (data?.checkout_url) {
        console.log('Redirigiendo a Stripe Checkout:', data.checkout_url);
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No se recibió URL de checkout');
      }

    } catch (error) {
      console.error('Error procesando pago:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar tu solicitud.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-300 font-sans ${darkMode ? 'dark' : ''}`}>
      <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800">
        {/* Animated Background */}
        <AnimatedBackground darkMode={darkMode} />
        
        {/* Header */}
        <header className="relative z-10 p-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate(-1)}
                variant="ghost"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
              <div className="flex items-center space-x-3">
                <Scale className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">klamAI</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 py-12 px-6">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
              >
                Elige tu Plan Legal
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto"
              >
                Obtén la asesoría legal que necesitas con nuestros planes diseñados para cada situación
              </motion.p>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center mb-12">
              <div className="flex items-center gap-3 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Label className={cn(
                  "px-3 py-1 text-sm font-medium transition-colors cursor-pointer",
                  isYearly ? "text-gray-600 dark:text-gray-400" : "text-blue-600 dark:text-blue-400"
                )}>
                  Mensual
                </Label>
                <Switch
                  checked={isYearly}
                  onCheckedChange={setIsYearly}
                />
                <Label className={cn(
                  "px-3 py-1 text-sm font-medium transition-colors cursor-pointer",
                  isYearly ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                )}>
                  Anual <span className="text-green-600 font-bold">(Ahorra 20%)</span>
                </Label>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {plans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className={cn(
                    "rounded-2xl border p-8 bg-white dark:bg-gray-800 text-center relative transition-all duration-300 hover:shadow-xl hover:scale-105",
                    plan.isPopular 
                      ? "border-blue-500 border-2 ring-2 ring-blue-500/20" 
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                  )}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                        <Star className="h-4 w-4 fill-current" />
                        Más Popular
                      </div>
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      {plan.name}
                    </h3>
                    <div className="flex items-center justify-center gap-1 mb-3">
                      <span className="text-5xl font-bold text-blue-600 dark:text-blue-400">
                        €{plan.planType === 'subscription' && isYearly ? plan.yearlyPrice : plan.price}
                      </span>
                      {plan.planType === 'subscription' && (
                        <span className="text-gray-600 dark:text-gray-400 text-lg">
                          /{isYearly ? 'mes' : plan.period}
                        </span>
                      )}
                    </div>
                    {plan.planType === 'subscription' && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isYearly ? 'facturado anualmente' : 'facturado mensualmente'}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-left">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handlePlanSelect(plan)}
                    className={cn(
                      "w-full text-lg font-semibold py-6 mb-4",
                      plan.isPopular
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                        : "bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600"
                    )}
                  >
                    {plan.buttonText}
                  </Button>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {plan.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Footer Info */}
            <div className="mt-16 text-center">
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                💡 Asesoría legal profesional con tecnología de IA avanzada
              </p>
              <div className="flex justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Pago seguro con Stripe
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Garantía de satisfacción
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Soporte 24/7
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Pricing;
