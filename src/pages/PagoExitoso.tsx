
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail } from 'lucide-react';
import AnimatedBackground from '@/components/AnimatedBackground';
import { SecureLogger } from '@/utils/secureLogging';

const PagoExitoso = () => {
  useEffect(() => {
    // Log para confirmar que el usuario ha llegado a esta página
    SecureLogger.info('User landed on success page after payment', 'payment_flow');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800 flex items-center justify-center p-4">
      <AnimatedBackground darkMode={true} />
      <div className="relative z-10 max-w-md w-full text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          ¡Pago Realizado con Éxito!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Hemos recibido tu pago correctamente. El siguiente paso es acceder a tu cuenta para gestionar tu consulta.
        </p>
        
        <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg text-left space-y-4">
            <div className="flex items-start">
                <Mail className="w-6 h-6 text-blue-500 mr-4 mt-1" />
                <div>
                    <h2 className="font-semibold text-gray-800 dark:text-white">Revisa tu correo electrónico</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Te hemos enviado un mensaje con un enlace seguro para que puedas establecer tu contraseña y acceder a tu nueva cuenta.
                    </p>
                </div>
            </div>
        </div>

        <div className="mt-8">
            <Button asChild className="w-full">
                <Link to="/">Volver a la página principal</Link>
            </Button>
            <p className="text-xs text-gray-500 mt-4">
                Si no recibes el correo en unos minutos, por favor, revisa tu carpeta de spam o correo no deseado.
            </p>
        </div>
      </div>
    </div>
  );
};

export default PagoExitoso;
