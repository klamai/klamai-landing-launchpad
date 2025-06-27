
import { FooterSection } from "@/components/ui/footer-section";

const LegalNotice = () => {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Aviso Legal</h1>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
            <p className="text-blue-800 font-medium">
              Última actualización: 27 de junio de 2025
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Datos identificativos</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>Denominación social:</strong> klamAI</p>
              <p className="text-gray-700 mb-2"><strong>Domicilio:</strong> Valencia, España</p>
              <p className="text-gray-700 mb-2"><strong>Correo electrónico:</strong> gestiones@klamai.com</p>
              <p className="text-gray-700 mb-2"><strong>Teléfono:</strong> 684 74 33 32</p>
              <p className="text-gray-700"><strong>Sitio web:</strong> www.klamai.com</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Objeto</h2>
            <p className="text-gray-700 mb-4">
              klamAI es una plataforma de asesoramiento jurídico que utiliza inteligencia artificial para proporcionar orientación legal inicial. Nuestro objetivo es conectar a los usuarios con información jurídica relevante y, cuando sea necesario, con abogados especialistas.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Condiciones de uso</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3.1. Acceso y uso del servicio</h3>
                <p className="text-gray-700">
                  El acceso y uso de este sitio web atribuye la condición de usuario del mismo e implica la aceptación plena de todas las cláusulas y condiciones de uso incluidas en este Aviso Legal.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3.2. Responsabilidad del usuario</h3>
                <p className="text-gray-700 mb-2">El usuario se compromete a:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Hacer un uso adecuado y lícito del sitio web</li>
                  <li>No utilizar el servicio para fines fraudulentos o ilegales</li>
                  <li>Proporcionar información veraz y actualizada</li>
                  <li>Respetar los derechos de propiedad intelectual</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Limitaciones del servicio</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6">
              <p className="text-yellow-800 font-medium mb-2">Importante:</p>
              <ul className="list-disc pl-6 text-yellow-700 space-y-2">
                <li>VitorIA proporciona orientación jurídica inicial, no asesoramiento legal definitivo</li>
                <li>Para casos complejos, siempre recomendamos consultar con un abogado especialista</li>
                <li>La información proporcionada no sustituye el asesoramiento legal profesional</li>
                <li>No nos hacemos responsables de las decisiones tomadas basándose únicamente en nuestra orientación inicial</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Propiedad intelectual</h2>
            <p className="text-gray-700 mb-4">
              Todos los contenidos de este sitio web, incluyendo textos, imágenes, diseños, logotipos, iconos, software y demás elementos, son propiedad de klamAI o de terceros que han autorizado su uso, y están protegidos por las leyes de propiedad intelectual.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Exclusión de responsabilidad</h2>
            <p className="text-gray-700 mb-4">
              klamAI no se hace responsable de:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Interrupciones, errores o fallos en el funcionamiento del sitio web</li>
              <li>Contenidos o servicios de terceros enlazados desde nuestro sitio</li>
              <li>Daños derivados del uso inadecuado del servicio</li>
              <li>Decisiones legales tomadas basándose únicamente en la información proporcionada</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Modificaciones</h2>
            <p className="text-gray-700 mb-4">
              klamAI se reserva el derecho de modificar cualquier tipo de información que pudiera aparecer en el sitio web, sin que exista obligación de preavisar o poner en conocimiento de los usuarios dichas obligaciones.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Legislación aplicable y jurisdicción</h2>
            <p className="text-gray-700 mb-4">
              Este Aviso Legal se rige por la legislación española. Para la resolución de cualquier controversia, las partes se someterán a los juzgados y tribunales de Valencia, España.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contacto</h2>
            <p className="text-gray-700 mb-4">
              Para cualquier consulta sobre este aviso legal, puede contactarnos:
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

export default LegalNotice;
