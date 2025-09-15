
import { cn } from "@/lib/utils";
import {
  Zap,
  Shield,
  Users,
  Scale,
  MessageCircle,
  Phone,
} from "lucide-react";

export function FeaturesSectionWithHoverEffects() {
  const features = [
    {
      title: "VitorIA: Asistente Legal IA",
      description:
        "Nuestro asistente de IA estructura tu caso, proporciona un resumen detallado y prepara la documentación necesaria antes de la consulta con el abogado.",
      icon: <Zap className="h-8 w-8" />,
    },
    {
      title: "Cumplimiento RGPD",
      description:
        "Garantizamos la protección de tus datos según el Reglamento General de Protección de Datos, asegurando máxima confidencialidad en todas tus consultas.",
      icon: <Shield className="h-8 w-8" />,
    },
    {
      title: "Abogados Especialistas",
      description:
        "Nuestro equipo de abogados expertos recibe tu caso ya estructurado por VitorIA, permitiendo resolver tus problemas legales con mayor eficiencia.",
      icon: <Users className="h-8 w-8" />,
    },
    {
      title: "Herramientas Propias de IA",
      description:
        "Desarrollamos tecnología propia para análisis de casos, investigación jurídica y generación de documentación legal personalizada.",
      icon: <Scale className="h-8 w-8" />,
    },
    {
      title: "Resolución Rápida de Casos",
      description:
        "Gracias a nuestra tecnología, resolvemos los casos de manera más rápida y efectiva, optimizando el tiempo tanto para clientes como para abogados.",
      icon: <MessageCircle className="h-8 w-8" />,
    },
    {
      title: "Gestión Integral",
      description:
        "Desde la primera consulta con VitorIA hasta la resolución final del caso, ofrecemos un servicio completo que revoluciona el asesoramiento legal.",
      icon: <Phone className="h-8 w-8" />,
    },
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative z-10 py-10 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature border-blue-200/30 dark:border-blue-500/30",
        (index === 0 || index === 3) && "lg:border-l border-blue-200/30 dark:border-blue-500/30",
        index < 3 && "lg:border-b border-blue-200/30 dark:border-blue-500/30"
      )}
    >
      {index < 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-blue-50/50 dark:from-blue-900/20 to-transparent pointer-events-none" />
      )}
      {index >= 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-blue-50/50 dark:from-blue-900/20 to-transparent pointer-events-none" />
      )}
      <div className="mb-6 relative z-10 px-10 text-blue-600 dark:text-blue-400">
        {icon}
      </div>
      <div className="text-2xl font-bold mb-6 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-blue-300/50 dark:bg-blue-700/50 group-hover/feature:bg-blue-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-gray-900 dark:text-white">
          {title}
        </span>
      </div>
      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xs relative z-10 px-10 font-medium leading-relaxed">
        {description}
      </p>
    </div>
  );
};
