"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Feature {
  name: string
  description: string
  included: boolean
}

interface PricingTier {
  id: string
  name: string
  originalPrice: number
  price: number
  description: string
  features: Feature[]
  highlight?: boolean
  badge?: string
  icon: React.ReactNode
  onSelect: () => void
}

interface PricingSectionProps {
  tier: PricingTier
  className?: string
}

function PricingSection({ tier, className }: PricingSectionProps) {
  const discount = tier.originalPrice - tier.price
  const discountPercentage = Math.round((discount / tier.originalPrice) * 100)

  const buttonStyles = cn(
    "h-12 bg-primary text-primary-foreground hover:bg-primary/90",
    "shadow-[0_1px_15px_rgba(0,0,0,0.1)]",
    "hover:shadow-[0_1px_20px_rgba(0,0,0,0.15)]",
    "font-semibold text-base",
  )

  const badgeStyles = cn(
    "px-4 py-1.5 text-sm font-medium",
    "bg-destructive text-destructive-foreground",
    "border-none shadow-lg",
  )

  return (
    <section
      className={cn(
        "relative bg-background text-foreground",
        "py-12 px-4",
        "overflow-hidden",
        className,
      )}
    >
      <div className="w-full max-w-md mx-auto">
        <div className="relative group backdrop-blur-sm rounded-3xl transition-all duration-300 flex flex-col bg-card border border-border shadow-xl hover:translate-y-0 hover:shadow-2xl">
          {tier.badge && tier.highlight && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className={badgeStyles}>{tier.badge}</Badge>
            </div>
          )}

          <div className="p-8 flex-1">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                {tier.icon}
              </div>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                {tier.name}
              </h3>
              
              <div className="mb-4">
                {/* Precio anterior tachado */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-lg text-muted-foreground line-through">
                    {tier.originalPrice.toFixed(2)}€
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    -{discountPercentage}%
                  </Badge>
                </div>
                
                {/* Precio actual */}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl font-bold text-foreground">
                    {tier.price.toFixed(2)}€
                  </span>
                </div>
                
                {/* Ahorro */}
                <div className="mt-2 text-sm text-muted-foreground">
                  Ahorras {discount.toFixed(2)}€
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {tier.description}
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {tier.features.map((feature) => (
                <div key={feature.name} className="flex gap-3">
                  <div className="mt-1 p-0.5 rounded-full transition-colors duration-200 text-green-600 dark:text-green-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {feature.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {feature.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 pt-0 mt-auto">
            <Button
              onClick={tier.onSelect}
              className={cn(
                "w-full relative transition-all duration-300",
                buttonStyles,
              )}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Seleccionar Plan
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export { PricingSection }