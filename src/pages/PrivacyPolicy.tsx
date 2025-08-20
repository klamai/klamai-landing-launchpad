import { Button } from "@/components/ui/button";
import { FooterSection } from "@/components/ui/footer-section";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BackgroundGradient } from "@/components/ui/background-gradient";

const PrivacyPolicy = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? saved === 'true' : false;
  });

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header con navbar como en PublicProposal */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/20 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <img src="/logo.svg" alt="klamAI Logo" className="h-8" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">KlamAI</span>
            </Link>
            <div className="flex items-center gap-3">
              <Button onClick={() => {
                const next = !darkMode; setDarkMode(next); localStorage.setItem('darkMode', String(next));
              }} variant="outline" size="icon" className="rounded-full">
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Card de aceptación de políticas */}
        <div className="mb-8">
          <BackgroundGradient className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-gray-900">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Antes de continuar</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Para ver el análisis de tu caso y continuar, por favor acepta nuestras{' '} 
                <Link to="/aviso-legal" className="text-blue-600 hover:text-blue-700 underline font-medium">Políticas</Link>{' '}y{' '}
                <Link to="/politicas-privacidad" className="text-blue-600 hover:text-blue-700 underline font-medium">Política de Privacidad</Link>.
              </p>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-gray-700 dark:text-gray-300">Confirmo que he leído y acepto las políticas para continuar</span>
              </label>
            </div>
          </BackgroundGradient>
        </div>
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Política de Privacidad de Klamai.com</h1>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 mb-8">
            <p className="text-blue-800 dark:text-blue-200 font-medium">
              Última actualización: 27 de junio de 2025
            </p>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-8">
            En Klamai.com, nos comprometemos a proteger la privacidad y los datos personales de nuestros usuarios. Esta Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos y protegemos la información personal que nos proporcionas al utilizar nuestro sitio web https://klamai.com. Por favor, lee atentamente esta política para entender nuestras prácticas en relación con tus datos personales.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Responsable del Tratamiento de Datos</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              El responsable del tratamiento de los datos personales recopilados a través de este sitio web es:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Klamai: RW ALIVALCA S.L.</strong></p>
              <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Dirección:</strong> Plaza Portal de Elche nº 6 -1º ALICANTE 03003, España</p>
              <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Correo electrónico:</strong> gestiones@klamai.com</p>
              <p className="text-gray-700 dark:text-gray-300"><strong>CIF/NIF:</strong> B42704593</p>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              Si tienes alguna pregunta sobre esta política o sobre el tratamiento de tus datos, puedes contactarnos en la dirección de correo electrónico indicada.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Información que Recopilamos</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Podemos recopilar los siguientes tipos de datos personales cuando visitas nuestro sitio web o utilizas nuestros servicios:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Datos de identificación:</strong> Nombre, apellidos, dirección de correo electrónico, número de teléfono.</li>
              <li><strong>Datos de navegación:</strong> Dirección IP, tipo de navegador, dispositivo utilizado, páginas visitadas, tiempo de visita y otras estadísticas de uso.</li>
              <li><strong>Datos proporcionados voluntariamente:</strong> Información enviada a través de formularios de contacto, registros en boletines, o cualquier interacción directa con el sitio.</li>
              <li><strong>Cookies y tecnologías similares:</strong> Utilizamos cookies para mejorar la experiencia del usuario, analizar el tráfico y personalizar contenido. Consulta nuestra Política de Cookies para más detalles.</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              No recopilamos datos sensibles (como datos de salud, opiniones políticas, creencias religiosas, etc.) salvo que sea estrictamente necesario y con tu consentimiento explícito.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. Finalidad del Tratamiento de Datos</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Los datos personales que recopilamos se utilizan para los siguientes fines:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Gestión de servicios:</strong> Procesar solicitudes, gestionar cuentas de usuario, responder a consultas o proporcionar los servicios ofrecidos en el sitio.</li>
              <li><strong>Mejora de la experiencia del usuario:</strong> Personalizar el contenido y las funcionalidades del sitio web según tus preferencias.</li>
              <li><strong>Comunicaciones:</strong> Enviar boletines informativos, promociones u otra información relevante, siempre que hayas dado tu consentimiento.</li>
              <li><strong>Análisis y estadísticas:</strong> Analizar el uso del sitio web para mejorar nuestros servicios y optimizar el rendimiento.</li>
              <li><strong>Cumplimiento legal:</strong> Cumplir con las obligaciones legales aplicables, como la gestión fiscal o la respuesta a requerimientos judiciales.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Base Legal para el Tratamiento</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              El tratamiento de tus datos personales se basa en las siguientes bases legales, según corresponda:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Consentimiento:</strong> Cuando aceptas explícitamente esta política o das tu consentimiento para recibir comunicaciones comerciales.</li>
              <li><strong>Ejecución de un contrato:</strong> Cuando los datos son necesarios para proporcionarte un servicio solicitado.</li>
              <li><strong>Obligación legal:</strong> Cuando el tratamiento es necesario para cumplir con normativas aplicables.</li>
              <li><strong>Interés legítimo:</strong> Para mejorar nuestros servicios, prevenir fraudes o garantizar la seguridad del sitio web, siempre que no prevalezcan tus derechos y libertades.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Almacenamiento y Seguridad de los Datos</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Tus datos personales se almacenan en servidores seguros ubicados en la Unión Europea, cumpliendo con los estándares de seguridad establecidos por el RGPD. Implementamos medidas técnicas y organizativas para proteger tus datos contra accesos no autorizados, pérdidas o alteraciones, incluyendo:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Encriptación de datos sensibles.</li>
              <li>Acceso restringido a la información personal.</li>
              <li>Auditorías periódicas de seguridad.</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              Conservaremos tus datos solo durante el tiempo necesario para cumplir con las finalidades descritas o según lo exija la legislación aplicable. Una vez que los datos ya no sean necesarios, serán eliminados de forma segura.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Compartir Datos con Terceros</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              No vendemos ni alquilamos tus datos personales a terceros. Sin embargo, podemos compartir tus datos con:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Proveedores de servicios:</strong> Empresas que nos ayudan a operar el sitio web (por ejemplo, proveedores de alojamiento, herramientas de análisis o servicios de marketing), siempre bajo acuerdos que garanticen la protección de tus datos.</li>
              <li><strong>Autoridades legales:</strong> Cuando sea necesario para cumplir con obligaciones legales o responder a requerimientos judiciales.</li>
              <li><strong>Socios comerciales:</strong> Solo con tu consentimiento explícito, por ejemplo, para ofrecerte servicios conjuntos.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Transferencias Internacionales de Datos</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Si tus datos se transfieren fuera del Espacio Económico Europeo (EEE), nos aseguraremos de que el destinatario cumpla con las normativas de protección de datos aplicables, utilizando cláusulas contractuales estándar o mecanismos equivalentes aprobados por la Comisión Europea.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Tus Derechos</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              De acuerdo con el RGPD y otras normativas aplicables, tienes los siguientes derechos sobre tus datos personales:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Acceso:</strong> Solicitar una copia de los datos que tenemos sobre ti.</li>
              <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos.</li>
              <li><strong>Supresión:</strong> Solicitar la eliminación de tus datos cuando ya no sean necesarios.</li>
              <li><strong>Limitación:</strong> Restringir el uso de tus datos en ciertas circunstancias.</li>
              <li><strong>Portabilidad:</strong> Recibir tus datos en un formato estructurado y transferirlos a otro responsable.</li>
              <li><strong>Oposición:</strong> Oponerte al tratamiento de tus datos para ciertos fines, como el marketing directo.</li>
              <li><strong>Retirar el consentimiento:</strong> En cualquier momento, sin que ello afecte a la licitud del tratamiento previo.</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              Para ejercer estos derechos, contáctanos en gestiones@klamai.com. Responderemos a tu solicitud en un plazo máximo de un mes, salvo en casos excepcionales.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Cookies y Tecnologías de Seguimiento</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Utilizamos cookies y tecnologías similares para mejorar la funcionalidad del sitio, analizar el tráfico y personalizar contenido. Puedes gestionar tus preferencias de cookies a través de la configuración de tu navegador o del panel de control de cookies en nuestro sitio web. Consulta nuestra Política de Cookies para más información.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. Enlaces a Sitios de Terceros</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Nuestro sitio web puede contener enlaces a sitios de terceros. No nos hacemos responsables de las prácticas de privacidad de estos sitios. Te recomendamos revisar las políticas de privacidad de cualquier sitio web que visites.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">11. Menores de Edad</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Nuestro sitio web no está dirigido a menores de 16 años. No recopilamos intencionadamente datos personales de menores. Si descubrimos que hemos recopilado datos de un menor sin el consentimiento de sus padres o tutores, los eliminaremos de inmediato.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">12. Cambios en la Política de Privacidad</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Nos reservamos el derecho de actualizar esta Política de Privacidad para reflejar cambios en nuestras prácticas o en la legislación aplicable. Publicaremos cualquier cambio en esta página y, si los cambios son significativos, te notificaremos por correo electrónico o mediante un aviso en el sitio web.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">13. Contacto</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Si tienes preguntas, inquietudes o deseas ejercer tus derechos, contáctanos en:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Correo electrónico:</strong> gestiones@klamai.com</p>
              <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Klamai: RW ALIVALCA S.L.</strong></p>
              <p className="text-gray-700 dark:text-gray-300 mb-2"><strong>Dirección:</strong> Plaza Portal de Elche nº 6 -1º ALICANTE 03003, España</p>
              <p className="text-gray-700 dark:text-gray-300"><strong>CIF/NIF:</strong> B42704593</p>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              También puedes presentar una reclamación ante la autoridad de protección de datos competente en tu país, como la Agencia Española de Protección de Datos (www.aepd.es) en el caso de España.
            </p>
          </section>
        </div>
      </main>

      <FooterSection />
    </div>
  );
};

export default PrivacyPolicy;
