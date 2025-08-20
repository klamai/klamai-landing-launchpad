"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PricingFeature {
  title: string;
  items: string[];
}

interface PricingCardProps {
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  features: PricingFeature[];
  buttonText?: string;
  onButtonClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function PricingCard({
  title,
  description,
  price,
  originalPrice,
  features,
  buttonText = "Get Started",
  onButtonClick,
  disabled = false,
  loading = false,
}: PricingCardProps) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isInView, hasAnimated]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  // @ts-ignore
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 260,
        damping: 20,
      },
    },
  };

  // @ts-ignore
  const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 10,
      },
    },
  };

  return (
    <motion.section
      ref={containerRef}
      className="w-full"
      initial="hidden"
      animate={hasAnimated ? "visible" : "hidden"}
      variants={containerVariants}
    >
      <Card className="relative mx-auto w-full max-w-6xl overflow-hidden bg-white dark:bg-gray-950 shadow-2xl dark:shadow-blue-900/50 border border-blue-200/80 dark:border-blue-700/60">
        <div className="flex flex-col lg:flex-row">
          <motion.div
            className="flex flex-col justify-between p-6 lg:w-2/5 lg:p-10 bg-gradient-to-br from-blue-200/50 to-blue-50/50 dark:from-blue-950/70 dark:to-blue-900/60 border-r border-blue-300/50 dark:border-blue-800/50"
            variants={itemVariants}
          >
              <div>
                <CardHeader className="p-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-3xl font-bold">{title}</CardTitle>
                      <CardDescription className="mt-2">{description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <motion.div className="mt-6 space-y-4" variants={itemVariants}>
                  <div className="flex items-baseline">
                    <span className="text-5xl font-extrabold">€{price}</span>
                    {originalPrice && (
                      <span className="ml-3 text-2xl font-semibold text-red-500 dark:text-red-400 line-through">
                        €{originalPrice}
                      </span>
                    )}
                  </div>
                  <span className="block text-sm text-muted-foreground">
                    IVA incluido
                  </span>
                </motion.div>
              </div>
              <motion.div className="mt-8" variants={itemVariants}>
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={onButtonClick}
                  disabled={disabled || loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    buttonText
                  )}
                </Button>
              </motion.div>
          </motion.div>
          <Separator className="lg:my-6 lg:hidden dark:bg-gray-700" />
          <motion.div
            className="bg-muted/50 p-6 lg:w-3/5 lg:p-10 dark:bg-gray-925"
            variants={itemVariants}
          >
            <div className="space-y-6">
              {features.map((feature, featureIndex) => (
                <Collapsible key={featureIndex} defaultOpen={false} className="w-full">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between rounded-lg bg-muted/70 p-3 hover:bg-muted transition-colors cursor-pointer dark:bg-gray-850/70 dark:hover:bg-gray-850">
                      <h3 className="text-lg font-semibold m-0 dark:text-white">{feature.title}:</h3>
                      <ChevronDown className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {feature.items.map((item, index) => (
                        <motion.li
                          key={index}
                          className="flex items-center"
                          variants={listItemVariants}
                          custom={index + featureIndex * feature.items.length}
                        >
                          <Check className="mr-2 h-4 w-4 text-primary dark:text-blue-400" />
                          <span className="text-sm dark:text-gray-300">{item}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                  {featureIndex < features.length - 1 && <Separator className="my-6 dark:bg-gray-700" />}
                </Collapsible>
              ))}
            </div>
          </motion.div>
        </div>
      </Card>
    </motion.section>
  );
}

