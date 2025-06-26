
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
      title: "Tecnología IA Avanzada",
      description:
        "Utilizamos las últimas herramientas de inteligencia artificial para brindarte el mejor asesoramiento legal.",
      icon: <Zap className="h-6 w-6 md:h-8 md:w-8" />,
    },
    {
      title: "Seguridad Garantizada",
      description:
        "Tus datos y consultas están protegidos con los más altos estándares de seguridad y confidencialidad.",
      icon: <Shield className="h-6 w-6 md:h-8 md:w-8" />,
    },
    {
      title: "Especialistas Expertos",
      description:
        "Nuestro equipo de abogados especialistas está disponible para resolver tus consultas más complejas.",
      icon: <Users className="h-6 w-6 md:h-8 md:w-8" />,
    },
    {
      title: "Asesoramiento Legal",
      description: 
        "Consultas jurídicas precisas y actualizadas según la legislación española vigente.",
      icon: <Scale className="h-6 w-6 md:h-8 md:w-8" />,
    },
    {
      title: "Respuesta Inmediata",
      description: 
        "VitorIA te responde al instante, disponible 24/7 para todas tus consultas legales.",
      icon: <MessageCircle className="h-6 w-6 md:h-8 md:w-8" />,
    },
    {
      title: "Soporte Personalizado",
      description:
        "Atención directa con nuestro equipo en Valencia para casos que requieren intervención humana.",
      icon: <Phone className="h-6 w-6 md:h-8 md:w-8" />,
    },
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative z-10 py-10 max-w-7xl mx-auto gap-6 md:gap-0">
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
        "flex flex-col relative group/feature transition-all duration-300 p-6 md:p-10 rounded-xl md:rounded-none md:border-r md:border-blue-200/30 md:dark:border-blue-500/30 bg-white/50 md:bg-transparent dark:bg-gray-800/50 md:dark:bg-transparent border border-blue-200/30 dark:border-blue-500/30 md:border-0 active:scale-95 md:active:scale-100",
        (index === 0 || index === 3) && "md:border-l md:border-blue-200/30 md:dark:border-blue-500/30",
        index < 3 && "md:border-b md:border-blue-200/30 md:dark:border-blue-500/30"
      )}
    >
      {index < 3 && (
        <div className="opacity-0 md:group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-blue-50/50 dark:from-blue-900/20 to-transparent pointer-events-none" />
      )}
      {index >= 3 && (
        <div className="opacity-0 md:group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-blue-50/50 dark:from-blue-900/20 to-transparent pointer-events-none" />
      )}
      
      <div className="flex items-start gap-4 md:flex-col md:gap-6">
        <div className="flex-shrink-0 relative z-10 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg md:bg-transparent md:dark:bg-transparent md:p-0">
          {icon}
        </div>
        
        <div className="flex-1 md:flex-none">
          <div className="text-lg md:text-xl font-bold mb-2 md:mb-4 relative z-10">
            <div className="absolute left-0 inset-y-0 h-6 md:group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-blue-300/50 dark:bg-blue-700/50 md:group-hover/feature:bg-blue-500 transition-all duration-200 origin-center hidden md:block" />
            <span className="md:group-hover/feature:translate-x-2 transition duration-200 inline-block text-gray-900 dark:text-white">
              {title}
            </span>
          </div>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 relative z-10 font-medium leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};
