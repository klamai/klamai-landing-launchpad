
import { BentoGrid, type BentoItem } from "@/components/ui/bento-grid";
import {
    CheckCircle,
    Clock,
    Star,
    TrendingUp,
} from "lucide-react";

const klamAIFeatures: BentoItem[] = [
    {
        title: "Consulta con VitorIA",
        meta: "Paso 1",
        description:
            "Describe tu situación legal de manera detallada. Nuestro asistente IA analiza tu caso y proporciona asesoramiento inicial inmediato.",
        icon: <Star className="w-5 h-5 text-white" />,
        status: "24/7",
        tags: ["IA Avanzada", "Inmediato"],
        colSpan: 2,
        hasPersistentHover: true,
        cta: "Consultar ahora →"
    },
    {
        title: "Análisis Inteligente",
        meta: "Paso 2",
        description: "VitorIA procesa tu consulta usando algoritmos avanzados y bases de datos jurídicas actualizadas.",
        icon: <TrendingUp className="w-5 h-5 text-white" />,
        status: "IA",
        tags: ["Análisis", "Precisión"],
        cta: "Ver proceso →"
    },
    {
        title: "Respuesta Personalizada",
        meta: "Paso 3",
        description: "Recibe una respuesta detallada con opciones legales, próximos pasos y recomendaciones específicas para tu caso.",
        icon: <CheckCircle className="w-5 h-5 text-white" />,
        tags: ["Personalizado", "Detallado"],
        colSpan: 2,
        cta: "Ver ejemplo →"
    },
    {
        title: "Conexión con Expertos",
        meta: "Paso 4",
        description: "Si necesitas representación legal, te conectamos con abogados especialistas en tu área específica.",
        icon: <Clock className="w-5 h-5 text-white" />,
        status: "Opcional",
        tags: ["Especialistas", "Valencia"],
        cta: "Conocer abogados →"
    },
];

function BentoDemo() {
    return (
        <section className="py-16 md:py-32 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Cómo funciona <span className="text-blue-600 dark:text-blue-400">klamAI</span>
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 font-medium max-w-2xl mx-auto">
                        Proceso simple y eficiente para resolver tus consultas legales en minutos
                    </p>
                </div>
                <BentoGrid items={klamAIFeatures} />
            </div>
        </section>
    );
}

export { BentoDemo }
