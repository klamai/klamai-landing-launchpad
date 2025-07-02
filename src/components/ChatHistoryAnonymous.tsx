
import { Lock, MessageCircle, Shield, Smartphone, BarChart3, Scale, Sparkles, Users, FileText, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ChatHistoryAnonymousProps {
  onAuthClick: (mode: 'login' | 'signup') => void;
}

const ChatHistoryAnonymous = ({ onAuthClick }: ChatHistoryAnonymousProps) => {
  return (
    <div className="h-full bg-gradient-to-b from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 text-slate-900 dark:text-white p-6 flex flex-col border-r border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <Scale className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <MessageCircle className="h-5 w-5 text-slate-700 dark:text-white" />
        </div>
        <span className="text-lg font-semibold text-slate-900 dark:text-white">Mis Consultas</span>
        <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400 ml-auto" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
        {/* Icon with overlay and animation */}
        <div className="relative mb-4">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-200 dark:border-blue-500/30 animate-pulse">
            <MessageCircle className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </div>
        
        {/* Title and Description */}
        <div className="space-y-4 max-w-xs">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Desbloquea Todo el Potencial
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Crea una cuenta gratuita para acceder a funcionalidades exclusivas y llevar tu experiencia legal al siguiente nivel.
          </p>
        </div>

        {/* Enhanced Features List */}
        <div className="space-y-3 w-full max-w-xs">
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span>Historial completo y seguro</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <span>IA personalizada según tu historial</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <FileText className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span>Documentos legales generados</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <Users className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <span>Conexión directa con abogados</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span>Acceso desde cualquier dispositivo</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span>Dashboard personalizado</span>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="space-y-3 w-full max-w-xs">
          <Button 
            onClick={() => onAuthClick('signup')} 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 relative overflow-hidden"
            size="default"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
            <span className="relative flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Crear Cuenta Gratis
            </span>
          </Button>
          <Button 
            onClick={() => onAuthClick('login')} 
            variant="outline" 
            className="w-full border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white font-medium py-3 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200"
            size="default"
          >
            Iniciar Sesión
          </Button>
        </div>

        {/* Enhanced Footer Text */}
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-6 max-w-xs space-y-2">
          <p className="font-medium text-blue-600 dark:text-blue-400">
            ¡Es completamente gratis!
          </p>
          <p>
            Tu conversación actual continuará normalmente
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatHistoryAnonymous;
