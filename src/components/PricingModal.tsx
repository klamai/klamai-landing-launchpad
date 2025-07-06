
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Star, X, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planType: 'one-time' | 'subscription', isYearly?: boolean) => void;
  caseId?: string;
}

const plans: PricingPlan[] = [
  {
    name: "CONSULTA INDIVIDUAL",
    price: "49",
    yearlyPrice: "49",
    period: "pago único",
    features: [
      "Análisis completo de tu caso",
      "Propuesta legal detallada",
      "Recomendaciones específicas",
      "Documento PDF descargable",
      "Soporte por email",
    ],
    description: "Perfecto para consultas específicas",
    buttonText: "Obtener Análisis",
    isPopular: false,
    planType: 'one-time',
  },
  {
    name: "ASESORÍA PREMIUM",
    price: "99",
    yearlyPrice: "79",
    period: "por mes",
    features: [
      "Consultas ilimitadas",
      "Seguimiento de casos",
      "Soporte prioritario 24/7",
      "Actualizaciones legales",
      "Consultas telefónicas",
      "Análisis de documentos",
      "Asesoría preventiva",
    ],
    description: "Ideal para empresas y casos complejos",
    buttonText: "Comenzar Suscripción",
    isPopular: true,
    planType: 'subscription',
  },
];

export function PricingModal({ isOpen, onClose, onSelectPlan, caseId }: PricingModalProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const formatPrice = (price: string) => {
    return `€${price}`;
  };

  const handleSelectPlan = (plan: PricingPlan) => {
    if (plan.planType === 'subscription') {
      onSelectPlan('subscription', !isMonthly);
    } else {
      onSelectPlan('one-time');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <DialogHeader className="space-y-4 pb-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
              <Scale className="h-7 w-7 text-blue-600" />
              klamAI - Planes de Asesoría
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Elige el plan que mejor se adapte a tus necesidades legales
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tu caso ha sido analizado y está listo para continuar
            </p>
          </div>
        </DialogHeader>

        {/* Toggle para suscripción anual/mensual */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <span className={cn("text-sm font-medium", isMonthly ? "text-gray-900 dark:text-white" : "text-gray-500")}>
            Mensual
          </span>
          <Switch
            checked={!isMonthly}
            onCheckedChange={(checked) => setIsMonthly(!checked)}
            className="data-[state=checked]:bg-blue-600"
          />
          <span className={cn("text-sm font-medium", !isMonthly ? "text-gray-900 dark:text-white" : "text-gray-500")}>
            Anual
          </span>
          {!isMonthly && (
            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
              Ahorra 20%
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
              }}
              className={cn(
                "rounded-2xl border-2 p-6 bg-gradient-to-br relative",
                plan.isPopular 
                  ? "border-blue-500 from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950" 
                  : "border-gray-200 dark:border-gray-700 from-gray-50 to-white dark:from-gray-800 dark:to-gray-900"
              )}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-600 text-white px-4 py-1 rounded-full flex items-center gap-1 text-sm font-semibold">
                    <Star className="h-4 w-4 fill-current" />
                    Más Popular
                  </div>
                </div>
              )}

              <div className="text-center space-y-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {plan.name}
                </h3>
                
                <div className="space-y-2">
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(isMonthly || plan.planType === 'one-time' ? plan.price : plan.yearlyPrice)}
                    </span>
                    {plan.planType === 'subscription' && (
                      <span className="text-gray-500 dark:text-gray-400 mb-1">
                        /{isMonthly ? 'mes' : 'año'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {plan.planType === 'subscription' && !isMonthly 
                      ? 'facturado anualmente' 
                      : plan.period}
                  </p>
                </div>

                <ul className="space-y-3 text-left">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan)}
                  className={cn(
                    "w-full py-3 font-semibold text-base transition-all duration-200",
                    plan.isPopular
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                  )}
                >
                  {plan.buttonText}
                </Button>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {plan.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>Todos los planes incluyen garantía de satisfacción y soporte profesional</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
