
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Star, X, Scale } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

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
  casoId: string;
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

export function PricingModal({ isOpen, onClose, onSelectPlan, casoId }: PricingModalProps) {
  const [isYearly, setIsYearly] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handlePlanSelect = (plan: PricingPlan) => {
    onSelectPlan(plan.planType, plan.planType === 'subscription' ? isYearly : undefined);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scale className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Tu Análisis Está Listo
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Elige cómo quieres proceder con tu consulta legal
                  </p>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Billing Toggle for Subscription */}
            <div className="flex justify-center mb-8">
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

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className={cn(
                    "rounded-2xl border p-6 bg-white dark:bg-gray-800 text-center relative transition-all duration-300 hover:shadow-lg",
                    plan.isPopular 
                      ? "border-blue-500 border-2 ring-2 ring-blue-500/20" 
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                  )}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Recomendado
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                        €{plan.planType === 'subscription' && isYearly ? plan.yearlyPrice : plan.price}
                      </span>
                      {plan.planType === 'subscription' && (
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                          /{isYearly ? 'mes' : plan.period}
                        </span>
                      )}
                    </div>
                    {plan.planType === 'subscription' && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isYearly ? 'facturado anualmente' : 'facturado mensualmente'}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-left">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handlePlanSelect(plan)}
                    className={cn(
                      "w-full text-base font-semibold py-6",
                      plan.isPopular
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                        : "bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600"
                    )}
                  >
                    {plan.buttonText}
                  </Button>

                  <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    {plan.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                💡 Tu análisis legal personalizado está listo. Accede ahora para ver las recomendaciones específicas para tu caso.
              </p>
              <div className="mt-4 flex justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>✅ Pago seguro con Stripe</span>
                <span>✅ Garantía de satisfacción</span>
                <span>✅ Soporte 24/7</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
