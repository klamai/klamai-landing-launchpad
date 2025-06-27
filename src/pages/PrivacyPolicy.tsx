
import { FooterSection } from "@/components/ui/footer-section";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">klamAI</h1>
            </div>
            <a 
              href="/" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Volver al inicio
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
            <p className="text-blue-800 font-medium">
              Última actualización: 27 de junio de 2025
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Información que recopilamos</h2>
            <p className="text-gray-700 mb-4">
              En klamAI, recopilamos la siguiente información cuando utiliza nuestros servicios:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Información de consulta:</strong> Las preguntas legales que nos envía a través de nuestro chat con VitorIA</li>
              <li><strong>Información de contacto:</strong> Su dirección de correo electrónico cuando se suscribe a nuestro boletín</li>
              <li><strong>Información técnica:</strong> Dirección IP, tipo de navegador, y datos de uso del sitio web</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Cómo utilizamos su información</h2>
            <p className="text-gray-700 mb-4">
              Utilizamos la información recopilada para:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Proporcionar respuestas y asesoramiento jurídico personalizado</li>
              <li>Mejorar nuestros servicios de IA legal</li>
              <li>Enviar actualizaciones y contenido relevante (solo si se ha suscrito)</li>
              <li>Cumplir con obligaciones legales y regulatorias</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Protección de datos</h2>
            <p className="text-gray-700 mb-4">
              Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger su información personal contra:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Acceso no autorizado</li>
              <li>Alteración, divulgación o destrucción</li>
              <li>Pérdida accidental</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Sus derechos (RGPD)</h2>
            <p className="text-gray-700 mb-4">
              Bajo el Reglamento General de Protección de Datos, usted tiene derecho a:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Acceso:</strong> Solicitar una copia de sus datos personales</li>
              <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
              <li><strong>Supresión:</strong> Solicitar la eliminación de sus datos</li>
              <li><strong>Portabilidad:</strong> Recibir sus datos en un formato estructurado</li>
              <li><strong>Oposición:</strong> Oponerse al procesamiento de sus datos</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cookies y tecnologías similares</h2>
            <p className="text-gray-700 mb-4">
              Utilizamos cookies esenciales para el funcionamiento del sitio web y cookies analíticas para mejorar nuestros servicios. Puede gestionar sus preferencias de cookies en la configuración de su navegador.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Contacto</h2>
            <p className="text-gray-700 mb-4">
              Para cualquier consulta sobre esta política de privacidad o para ejercer sus derechos, puede contactarnos en:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> gestiones@klamai.com<br/>
                <strong>Teléfono:</strong> 684 74 33 32<br/>
                <strong>Dirección:</strong> Valencia, España
              </p>
            </div>
          </section>
        </div>
      </main>

      <FooterSection />
    </div>
  );
};

export default PrivacyPolicy;
