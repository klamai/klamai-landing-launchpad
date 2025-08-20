"use client";

import { PricingCard } from "@/components/ui/pricing-card";

export function PricingCardBasic() {
  return (
    <PricingCard
      title="Ultimate Plan"
      description="Access everything you need to grow your business."
      price={99}
      originalPrice={199}
      features={[
        {
          title: "Features",
          items: [
            "Unlimited Projects",
            "Advanced Analytics",
            "Team Collaboration",
            "Custom Branding",
          ],
        },
        {
          title: "Perks",
          items: [
            "24/7 Support",
            "Priority Assistance",
            "Exclusive Webinars",
            "Early Feature Access",
          ],
        },
      ]}
      buttonText="Get Started"
      onButtonClick={() => console.log("Button clicked")}
    />
  );
}

export function PricingCardLegal() {
  return (
    <PricingCard
      title="Consulta Estratégica con Abogado"
      description="Primera consulta bonificada"
      price={37.50}
      originalPrice={127.00}
      features={[
        {
          title: "¿Qué incluye?",
          items: [
            "30 min con abogado especialista",
            "Revisión inicial de documentos",
            "Recomendación de estrategia",
            "Plan de acción personalizado"
          ]
        },
        {
          title: "Beneficios",
          items: [
            "Abogados verificados y especializados",
            "Consulta inmediata sin esperas",
            "Confidencialidad garantizada",
            "Seguimiento post-consulta"
          ]
        }
      ]}
      buttonText="Pagar Consulta"
      onButtonClick={() => console.log("Pagar consulta")}
    />
  );
}

