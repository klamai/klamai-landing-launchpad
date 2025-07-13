
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Upload, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Importar Typebot correctamente
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'typebot-standard': any;
    }
  }
}

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [chatStarted, setChatStarted] = useState(false);
  const [casoId, setCasoId] = useState<string | null>(null);
  const [userConsultation, setUserConsultation] = useState<string>("");
  const typebotRef = useRef<any>(null);

  useEffect(() => {
    const initializeChat = async () => {
      // Obtener datos del localStorage
      const savedCasoId = localStorage.getItem('casoId');
      const savedConsultation = localStorage.getItem('userConsultation');
      const savedSessionToken = localStorage.getItem('current_session_token');
      
      if (!savedCasoId || !savedConsultation) {
        toast({
          title: "Error",
          description: "No se encontró información de consulta. Redirigiendo...",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      setCasoId(savedCasoId);
      setUserConsultation(savedConsultation);
      
      // Precargar el chat inmediatamente
      setIsLoading(false);
      
      // Iniciar el chat automáticamente después de un breve delay
      setTimeout(() => {
        setChatStarted(true);
      }, 500);
    };

    initializeChat();
  }, [navigate, toast]);

  const handleStartChat = () => {
    setChatStarted(true);
  };

  const handleBackToHome = () => {
    // Limpiar localStorage al volver
    localStorage.removeItem('casoId');
    localStorage.removeItem('userConsultation');
    localStorage.removeItem('current_session_token');
    navigate('/');
  };

  useEffect(() => {
    if (chatStarted && casoId && userConsultation) {
      // Cargar el script de Typebot
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0.3/dist/web.js';
      document.head.appendChild(script);

      script.onload = () => {
        // Inicializar Typebot una vez que el script se haya cargado
        const typebotElement = document.getElementById('typebot-container');
        if (typebotElement && (window as any).Typebot) {
          (window as any).Typebot.initStandard({
            typebot: "vitoria-asesor-juridico-ia",
            prefilledVariables: {
              caso_id: casoId,
              motivo_consulta: userConsultation
            }
          });
        }
      };

      return () => {
        document.head.removeChild(script);
      };
    }
  }, [chatStarted, casoId, userConsultation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Iniciando tu consulta legal...</p>
        </div>
      </div>
    );
  }

  if (!chatStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button
              onClick={handleBackToHome}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <Card>
              <CardContent className="p-8">
                <div className="mb-6">
                  <MessageCircle className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    ¡Perfecto! Tu consulta está lista
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Consulta: "{userConsultation}"
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    VitorIA, nuestro asistente legal inteligente, está listo para ayudarte con tu consulta.
                  </p>
                  
                  <Button
                    onClick={handleStartChat}
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    Iniciar Conversación con VitorIA
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4">
        <div className="mb-4">
          <Button
            onClick={handleBackToHome}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Tu consulta:</strong> {userConsultation}
            </p>
            {casoId && (
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                ID del caso: {casoId.substring(0, 8)}...
              </p>
            )}
          </div>

          <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
            <div 
              id="typebot-container"
              style={{
                height: "70vh",
                minHeight: "500px"
              }}
            >
              <typebot-standard 
                style="width: 100%; height: 100%;"
                config={JSON.stringify({
                  typebot: "vitoria-asesor-juridico-ia",
                  prefilledVariables: {
                    caso_id: casoId || "",
                    motivo_consulta: userConsultation
                  }
                })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
