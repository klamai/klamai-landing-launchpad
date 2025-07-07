
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PagoExitoso = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const casoId = searchParams.get('caso_id');
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [casoActualizado, setCasoActualizado] = useState(false);

  useEffect(() => {
    verificarEstadoCaso();
  }, []);

  const verificarEstadoCaso = async () => {
    if (!casoId) {
      setLoading(false);
      return;
    }

    try {
      // Verificar el estado del caso
      const { data: caso, error } = await supabase
        .from('casos')
        .select('estado')
        .eq('id', casoId)
        .single();

      if (error) {
        console.error('Error verificando caso:', error);
        toast({
          title: "Error",
          description: "No se pudo verificar el estado del caso",
          variant: "destructive"
        });
      } else if (caso) {
        setCasoActualizado(caso.estado === 'disponible');
        if (caso.estado === 'disponible') {
          toast({
            title: "¡Caso activado!",
            description: "Tu caso ha sido procesado y está disponible para los abogados.",
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-green-950 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Verificando tu pago y actualizando el caso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-green-950 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-20 w-20 text-green-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          ¡Pago Exitoso!
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          Tu pago ha sido procesado correctamente. 
          {casoActualizado 
            ? " Tu caso ha sido activado y está disponible para los abogados especializados."
            : " En breve tu caso será activado y procesado por nuestro sistema."
          }
        </p>

        {sessionId && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ID de transacción: <span className="font-mono">{sessionId.slice(0, 20)}...</span>
            </p>
            {casoId && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                ID del caso: <span className="font-mono">{casoId.slice(0, 8)}...</span>
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Próximos pasos:
          </h3>
          <ul className="text-left space-y-2 text-gray-600 dark:text-gray-300">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">•</span>
              {casoActualizado 
                ? "Tu caso ya está disponible en el marketplace de abogados"
                : "Recibirás un email de confirmación en los próximos minutos"
              }
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">•</span>
              Los abogados especializados pueden revisar tu caso
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">•</span>
              Te contactaremos en un plazo máximo de 24 horas
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">•</span>
              Puedes seguir el progreso desde tu dashboard
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          {user && (
            <Button asChild className="flex-1">
              <Link to="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Ir al Dashboard
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" className="flex-1">
            <Link to="/">
              <ArrowRight className="w-4 h-4 mr-2" />
              Volver al Inicio
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PagoExitoso;
