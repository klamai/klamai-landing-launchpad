
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Feature {
  name: string;
  description: string;
  included: boolean;
}

interface PricingTier {
  id: string;
  name: string;
  originalPrice?: number;
  price: number;
  description: string;
  features: Feature[];
  highlight?: boolean;
  badge?: string;
  priceId?: string;
  onSelect: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

interface PricingSectionProps {
  tier: PricingTier;
}

export function PricingSection({ tier }: PricingSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
    >
      <div className={cn(
        "relative rounded-3xl p-8 shadow-2xl border-2 transition-all duration-300",
        tier.highlight 
          ? "border-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-800 shadow-blue-200 dark:shadow-blue-900/50"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      )}>
        {/* Badge */}
        {tier.badge && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {tier.badge}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {tier.name}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {tier.description}
          </p>

          {/* Pricing */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {tier.originalPrice && (
              <span className="text-2xl text-gray-400 line-through">
                {tier.originalPrice.toFixed(2)}€
              </span>
            )}
            <span className="text-5xl font-bold text-gray-900 dark:text-white">
              {tier.price.toFixed(2)}€
            </span>
          </div>

          {tier.originalPrice && (
            <div className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full text-green-700 dark:text-green-300 text-sm font-medium mb-6">
              <span>
                Ahorras {(tier.originalPrice - tier.price).toFixed(2)}€ 
                ({Math.round(((tier.originalPrice - tier.price) / tier.originalPrice) * 100)}% descuento)
              </span>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          {tier.features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-start gap-3"
            >
              <div className={cn(
                "rounded-full p-1 mt-0.5",
                feature.included 
                  ? "bg-green-100 dark:bg-green-900/30" 
                  : "bg-gray-100 dark:bg-gray-700"
              )}>
                <Check className={cn(
                  "w-3 h-3",
                  feature.included 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-gray-400"
                )} />
              </div>
              <div className="flex-1">
                <p className={cn(
                  "font-medium",
                  feature.included 
                    ? "text-gray-900 dark:text-white" 
                    : "text-gray-400 dark:text-gray-500"
                )}>
                  {feature.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={tier.onSelect}
          disabled={tier.disabled || tier.isLoading}
          className={cn(
            "w-full py-4 text-lg font-semibold rounded-xl transition-all duration-300",
            tier.highlight
              ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
              : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
          )}
        >
          {tier.isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Procesando...
            </div>
          ) : (
            "Obtener Consulta Estratégica"
          )}
        </Button>

        {/* Security note */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          🔒 Pago 100% seguro procesado por Stripe
        </p>
      </div>
    </motion.div>
  );
}
