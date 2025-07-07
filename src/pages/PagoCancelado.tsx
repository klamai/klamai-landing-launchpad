import { useSearchParams, Link } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const PagoCancelado = () => {
  const [searchParams] = useSearchParams();
  const casoId = searchParams.get('caso_id');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-red-950 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 text-center">
        <div className="flex justify-center mb-6">
          <XCircle className="h-20 w-20 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Pago Cancelado
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          No se ha procesado ningún cargo. Tu caso sigue disponible y puedes intentar 
          el pago nuevamente cuando lo desees.
        </p>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 mb-6">
          <p className="text-orange-700 dark:text-orange-300">
            💡 <strong>Tip:</strong> Si tuviste problemas con el pago, verifica que tu tarjeta 
            tenga fondos suficientes o intenta con otro método de pago.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            ¿Qué puedes hacer ahora?
          </h3>
          <ul className="text-left space-y-2 text-gray-600 dark:text-gray-300">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Intentar el pago nuevamente con el mismo plan
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Revisar otros planes disponibles
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Contactar con nuestro soporte si necesitas ayuda
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button asChild className="flex-1">
            <Link to={`/chat${casoId ? `?caso_id=${casoId}` : ''}`}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar Pago
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Inicio
            </Link>
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ¿Necesitas ayuda? Contáctanos en{' '}
            <a href="mailto:soporte@klamai.es" className="text-blue-600 hover:text-blue-500">
              soporte@klamai.es
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default PagoCancelado;