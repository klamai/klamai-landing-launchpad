
import {
  Zap,
  Shield,
  Users,
  Scale,
  MessageCircle,
  Phone,
} from "lucide-react";

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";

const features = [
  {
    Icon: Zap,
    name: "Tecnología IA Avanzada",
    description: "VitorIA utiliza las últimas herramientas de inteligencia artificial para brindarte el mejor asesoramiento legal.",
    href: "#",
    cta: "Conocer más",
    background: <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20" />,
    className: "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
  },
  {
    Icon: Shield,
    name: "Seguridad Garantizada",
    description: "Tus datos y consultas están protegidos con los más altos estándares de seguridad y confidencialidad.",
    href: "#",
    cta: "Ver detalles",
    background: <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20" />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
  },
  {
    Icon: Scale,
    name: "Asesoramiento Legal",
    description: "Consultas jurídicas precisas y actualizadas según la legislación española vigente.",
    href: "#",
    cta: "Consultar",
    background: <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20" />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4",
  },
  {
    Icon: MessageCircle,
    name: "Respuesta Inmediata",
    description: "VitorIA te responde al instante, disponible 24/7 para todas tus consultas legales.",
    href: "#",
    cta: "Probar ahora",
    background: <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20" />,
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2",
  },
  {
    Icon: Phone,
    name: "Soporte Personalizado",
    description: "Atención directa con nuestro equipo en Valencia para casos que requieren intervención humana.",
    href: "#",
    cta: "Contactar",
    background: <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20" />,
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4",
  },
];

function BentoDemo() {
  return (
    <BentoGrid className="lg:grid-rows-3">
      {features.map((feature) => (
        <BentoCard key={feature.name} {...feature} />
      ))}
    </BentoGrid>
  );
}

export { BentoDemo };
