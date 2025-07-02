
import { Lock, MessageCircle, Shield, Smartphone, BarChart3, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ChatHistoryAnonymousProps {
  onAuthClick: (mode: 'login' | 'signup') => void;
}

const ChatHistoryAnonymous = ({ onAuthClick }: ChatHistoryAnonymousProps) => {
  return (
    <div className="h-full bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <Scale className="h-6 w-6 text-blue-400" />
          <MessageCircle className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-semibold">Mis Consultas</span>
        <Lock className="h-4 w-4 text-blue-400 ml-auto" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
        {/* Icon with overlay */}
        <div className="relative mb-4">
          <div className="w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center">
            <MessageCircle className="h-10 w-10 text-blue-400" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center border-2 border-blue-400">
            <Lock className="h-4 w-4 text-blue-400" />
          </div>
        </div>
        
        {/* Title and Description */}
        <div className="space-y-4 max-w-xs">
          <h3 className="text-xl font-bold text-white">
            Guarda tu Conversación
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Crea una cuenta gratuita para guardar esta conversación y acceder a tu historial completo de consultas legales.
          </p>
        </div>

        {/* Features List */}
        <div className="space-y-3 w-full max-w-xs">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Shield className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <span>Historial seguro y privado</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Smartphone className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <span>Acceso desde cualquier dispositivo</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <BarChart3 className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <span>Seguimiento de tus casos</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 w-full max-w-xs">
          <Button 
            onClick={() => onAuthClick('signup')} 
            className="w-full bg-white text-slate-900 hover:bg-slate-100 font-medium py-3 rounded-xl"
            size="default"
          >
            Crear Cuenta Gratis
          </Button>
          <Button 
            onClick={() => onAuthClick('login')} 
            variant="outline" 
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:text-white font-medium py-3 rounded-xl"
            size="default"
          >
            Iniciar Sesión
          </Button>
        </div>

        {/* Footer Text */}
        <p className="text-xs text-slate-400 mt-6 max-w-xs">
          Tu conversación actual continuará normalmente
        </p>
      </div>
    </div>
  );
};

export default ChatHistoryAnonymous;
