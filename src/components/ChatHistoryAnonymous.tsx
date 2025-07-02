
import { Lock, MessageCircle, FileText, ArrowRight, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ChatHistoryAnonymousProps {
  onAuthClick: (mode: 'login' | 'signup') => void;
}

const ChatHistoryAnonymous = ({ onAuthClick }: ChatHistoryAnonymousProps) => {
  return (
    <Card className="h-full border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <MessageCircle className="h-5 w-5 text-foreground" />
          </div>
          <span className="text-foreground">Mis Consultas</span>
          <Lock className="h-4 w-4 text-primary ml-auto" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center h-[400px] text-center space-y-6">
        <div className="relative">
          <FileText className="h-16 w-16 text-primary opacity-20" />
          <Lock className="h-8 w-8 text-primary absolute -top-1 -right-1 bg-background rounded-full p-1 border border-primary/20" />
        </div>
        
        <div className="space-y-3 max-w-xs">
          <h3 className="text-lg font-semibold text-foreground">
            Guarda tu Conversación
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Crea una cuenta gratuita para guardar esta conversación y acceder a tu historial completo de consultas legales.
          </p>
        </div>

        <div className="space-y-4 w-full">
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3 text-primary" />
              <span>Historial seguro y privado</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3 text-primary" />
              <span>Acceso desde cualquier dispositivo</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3 text-primary" />
              <span>Seguimiento de tus casos</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={() => onAuthClick('signup')} 
              className="w-full"
              size="sm"
            >
              Crear Cuenta Gratis
            </Button>
            <Button 
              onClick={() => onAuthClick('login')} 
              variant="outline" 
              className="w-full"
              size="sm"
            >
              Iniciar Sesión
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Tu conversación actual continuará normalmente
        </p>
      </CardContent>
    </Card>
  );
};

export default ChatHistoryAnonymous;
