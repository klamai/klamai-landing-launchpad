
import { Lock, MessageCircle, FileText, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ChatHistoryAnonymousProps {
  onAuthClick: () => void;
}

const ChatHistoryAnonymous = ({ onAuthClick }: ChatHistoryAnonymousProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <span>Mis Consultas</span>
          <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400 ml-auto" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center h-[400px] text-center space-y-6">
        <div className="relative">
          <FileText className="h-16 w-16 text-blue-600 dark:text-blue-400 opacity-20" />
          <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400 absolute -top-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-1" />
        </div>
        
        <div className="space-y-3 max-w-xs">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Guarda tu Conversación
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Crea una cuenta gratuita para guardar esta conversación y acceder a tu historial completo de consultas legales.
          </p>
        </div>

        <div className="space-y-4 w-full">
          <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              <span>Historial seguro y privado</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              <span>Acceso desde cualquier dispositivo</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              <span>Seguimiento de tus casos</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={onAuthClick} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              Crear Cuenta Gratis
            </Button>
            <Button 
              onClick={onAuthClick} 
              variant="outline" 
              className="w-full"
              size="sm"
            >
              Iniciar Sesión
            </Button>
          </div>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
          Tu conversación actual continuará normalmente
        </p>
      </CardContent>
    </Card>
  );
};

export default ChatHistoryAnonymous;
