import { Button } from "@/components/ui/button";
import { FooterSection } from "@/components/ui/footer-section";
import { Scale, Menu, X, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";

const LegalNotice = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Navigation */}
      <header className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="klamAI Logo" className="h-8" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">KlamAI</h1>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 font-medium transition-colors">
                Inicio
              </Link>
              <Link to="/chat" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 font-medium transition-colors">
                Chat con VitorIA
              </Link>
              <a href="#features" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 font-medium transition-colors">
                Características
              </a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 font-medium transition-colors">
                Testimonios
              </a>
              
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* Auth Buttons */}
              <Button variant="ghost" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                Login
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
                Sign Up
              </Button>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 border-t pt-4">
              <div className="flex flex-col space-y-2">
                <Link to="/" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 font-medium transition-colors py-2">
                  Inicio
                </Link>
                <Link to="/chat" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 font-medium transition-colors py-2">
                  Chat con VitorIA
                </Link>
                <a href="#features" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 font-medium transition-colors py-2">
                  Características
                </a>
                <a href="#testimonials" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 font-medium transition-colors py-2">
                  Testimonios
                </a>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="h-9 w-9"
                  >
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </Button>
                  <Button variant="ghost" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                    Login
                  </Button>
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
                    Sign Up
                  </Button>
                </div>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Aviso Legal de Klamai.com</h1>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 mb-8">
            <p className="text-blue-800 dark:text-blue-200 font-medium">
              Última actualización: 27 de junio de 2025
            </p>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-8">
            Este Aviso Legal regula el uso del sitio web https://klamai.com (en adelante, "el Sitio Web"), propiedad de Klamai, y establece las condiciones de acceso y utilización de los servicios ofrecidos. Al acceder y utilizar el Sitio Web, aceptas cumplir con los términos y condiciones aquí descritos. Si no estás de acuerdo, te recomendamos que no utilices el Sitio Web.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Identificación del Responsable</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              El Sitio Web es operado por:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Klamai (RW ALIVALCA S.L.)</strong></p>
              <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Dirección:</strong> Plaza Portal de Elche nº 6 -1º, Alicante 03003, España</p>
              <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Correo electrónico:</strong> gestiones@klamai.com</p>
              <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>CIF/NIF:</strong> B42704593</p>
              <p className="text-gray-700 dark:text-gray-300"><strong>Inscrita en:</strong> [Registro Mercantil de Alicante, datos específicos a completar si están disponibles]</p>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              Para cualquier consulta, puedes contactarnos en la dirección de correo electrónico indicada.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Objeto del Sitio Web</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Klamai es una plataforma tecnológica que proporciona servicios de captación de leads para el análisis de consultas legales por parte de abogados y asesores expertos previamente validados. Los servicios ofrecidos incluyen:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Conexión entre usuarios y profesionales legales cualificados.</li>
              <li>Uso de tecnologías de inteligencia artificial para optimizar la gestión de consultas y la asignación de leads a abogados.</li>
              <li>Facilitación de herramientas tecnológicas para el desarrollo de servicios legales por parte de los profesionales.</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300">
              Klamai actúa únicamente como intermediario tecnológico y no realiza actividades de asesoramiento legal, emisión de opiniones, consultas o dictámenes legales, los cuales son realizados exclusivamente por los abogados y asesores expertos registrados en la plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. Condiciones de Uso</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              El acceso y uso del Sitio Web están sujetos a las siguientes condiciones:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Uso permitido:</strong> El Sitio Web debe utilizarse únicamente para fines legales y de acuerdo con este Aviso Legal.</li>
              <li><strong>Prohibiciones:</strong> Está prohibido utilizar el Sitio Web para actividades contrarias a la ley, la moral o el orden público, o para fines que puedan dañar los derechos de terceros o el funcionamiento del Sitio Web.</li>
              <li><strong>Edad mínima:</strong> El Sitio Web está destinado a mayores de 16 años. No recopilamos intencionadamente datos de menores sin el consentimiento de sus tutores legales.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Facturación de Servicios</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Klamai facturará exclusivamente los servicios que presta por el uso de la plataforma, tanto a los usuarios que buscan abogados como a los abogados que utilizan la plataforma para la gestión de leads y asuntos. Los cargos aplicables serán comunicados de forma transparente a los usuarios y profesionales antes de la contratación de dichos servicios. Klamai no facturará ni asumirá responsabilidad por los servicios legales prestados directamente por los abogados o asesores expertos, ya que estos son responsables de sus propias tarifas y condiciones.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Responsabilidad</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">5.1. Responsabilidad de Klamai</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Klamai se compromete a ofrecer una plataforma tecnológica fiable y segura, pero no se responsabiliza por:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Las acciones, opiniones, consultas o dictámenes emitidos por los abogados o asesores expertos, ya que estos actúan de manera independiente y bajo su propia responsabilidad profesional.</li>
                <li>Errores, omisiones o decisiones tomadas por los usuarios o profesionales basadas en la información proporcionada a través del Sitio Web.</li>
                <li>Daños derivados del mal uso del Sitio Web o de interrupciones técnicas ajenas a nuestro control (como fallos en servidores o conexiones a internet).</li>
                <li>Acciones de terceros, incluidos los profesionales registrados, proveedores externos o usuarios del Sitio Web.</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                Klamai verifica y valida previamente a los abogados y asesores expertos registrados en la plataforma, pero no garantiza la calidad, precisión o idoneidad de los servicios prestados por estos profesionales.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">5.2. Responsabilidad del Usuario</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">El usuario se compromete a:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Proporcionar información veraz y actualizada al utilizar el Sitio Web.</li>
                <li>No realizar actividades que puedan dañar, sobrecargar o comprometer la seguridad del Sitio Web.</li>
                <li>Respetar los derechos de propiedad intelectual de Klamai y de terceros.</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Propiedad Intelectual e Industrial</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Todos los contenidos del Sitio Web, incluyendo textos, imágenes, logotipos, diseños, software, código fuente y tecnologías de inteligencia artificial, son propiedad de Klamai (RW ALIVALCA S.L.) o de terceros que han otorgado los derechos correspondientes. Estos contenidos están protegidos por las leyes de propiedad intelectual e industrial.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Queda prohibida la reproducción, distribución, modificación o uso comercial de cualquier contenido del Sitio Web sin autorización expresa de Klamai.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Uso de Inteligencia Artificial</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Klamai utiliza tecnologías de inteligencia artificial para optimizar la captación de leads, la asignación de consultas a profesionales y la mejora de la experiencia del usuario. Estas tecnologías son herramientas de soporte y no sustituyen el criterio profesional de los abogados o asesores. Klamai no se responsabiliza por decisiones tomadas con base en los resultados generados por estas tecnologías.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Enlaces a Terceros</h2>
            <p className="text-gray-700 dark:text-gray-300">
              El Sitio Web puede incluir enlaces a sitios web de terceros, como páginas de abogados o servicios externos. Klamai no controla ni se responsabiliza por el contenido, políticas de privacidad o prácticas de estos sitios. Te recomendamos revisar los avisos legales y políticas de privacidad de cualquier sitio web al que accedas desde nuestro Sitio Web.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Protección de Datos</h2>
            <p className="text-gray-700 dark:text-gray-300">
              La recopilación y tratamiento de datos personales se rigen por nuestra Política de Privacidad, disponible en el Sitio Web. Klamai cumple con el Reglamento General de Protección de Datos (RGPD) y otras normativas aplicables, garantizando la confidencialidad y seguridad de los datos proporcionados por los usuarios.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. Modificaciones del Aviso Legal</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Klamai se reserva el derecho de modificar este Aviso Legal para adaptarlo a cambios legislativos, técnicos o en los servicios ofrecidos. Las modificaciones serán publicadas en esta página, y te recomendamos revisarla periódicamente. El uso continuado del Sitio Web tras la publicación de cambios implica la aceptación de los mismos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">11. Legislación y Jurisdicción</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Este Aviso Legal se rige por la legislación española. Cualquier controversia derivada del uso del Sitio Web será sometida a los juzgados y tribunales de Alicante, España, salvo que la normativa aplicable disponga lo contrario.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">12. Contacto</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Para cualquier duda, consulta o reclamación relacionada con este Aviso Legal, puedes contactarnos en:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Correo electrónico:</strong> gestiones@klamai.com</p>
              <p className="text-gray-700 dark:text-gray-300"><strong>Dirección:</strong> Plaza Portal de Elche nº 6 -1º, Alicante 03003, España.</p>
            </div>
          </section>
        </div>
      </main>

      <FooterSection />
    </div>
  );
};

export default LegalNotice;
