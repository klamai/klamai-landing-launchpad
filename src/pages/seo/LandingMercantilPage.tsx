import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import landingsData from '@/data/mercantil-landings.json';
import NotFound from '@/pages/NotFound';

const LandingMercantilPage = () => {
  const { provincia, ciudad } = useParams<{ provincia: string, ciudad: string }>();
  const landing = landingsData.find(l => l.city === ciudad);

  if (!landing) {
    return <NotFound />;
  }

  // --- JSON-LD Schema Generation ---
  const generateBreadcrumbSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: landing.breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `https://tu-dominio.com${crumb.url}`,
    })),
  });

  const generateFaqSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: landing.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  });

  const generateLegalServiceSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: `Abogados de Derecho Mercantil en ${landing.province}`,
    description: landing.description,
    url: `https://tu-dominio.com/derecho-mercantil/${landing.city}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: landing.city,
      addressRegion: landing.province,
      addressCountry: 'ES',
    },
    provider: {
      '@type': 'Organization',
      name: 'KlamAI - Tu Despacho de Abogados',
      url: 'https://tu-dominio.com',
    },
    areaServed: {
      '@type': 'City',
      name: landing.province,
    },
  });
  // --- End JSON-LD Schema Generation ---

  const canonicalUrl = `https://tu-dominio.com/mercantil/${landing.city}/${landing.city}`;

  return (
    <>
      <Helmet>
        <title>{landing.title}</title>
        <meta name="description" content={landing.description} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={landing.title} />
        <meta property="og:description" content={landing.description} />
        {/* <meta property="og:image" content="URL_A_TU_IMAGEN_DESTACADA" /> */}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={landing.title} />
        <meta name="twitter:description" content={landing.description} />
        {/* <meta name="twitter:image" content="URL_A_TU_IMAGEN_DESTACADA" /> */}

        {/* JSON-LD Schemas */}
        <script type="application/ld+json">{JSON.stringify(generateBreadcrumbSchema())}</script>
        <script type="application/ld+json">{JSON.stringify(generateFaqSchema())}</script>
        <script type="application/ld+json">{JSON.stringify(generateLegalServiceSchema())}</script>
      </Helmet>

      {/* Hero Section con gradiente e imagen de fondo */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative container mx-auto px-4 text-center">
          {/* Breadcrumbs */}
          <nav className="inline-flex gap-2 flex-wrap items-center bg-black/45 text-white rounded-lg px-4 py-2 mb-6 text-sm">
            {landing.breadcrumbs.map((crumb, index) => (
              <span key={index} className="flex items-center">
                <Link to={crumb.url} className="hover:text-blue-200 transition-colors">{crumb.name}</Link>
                {index < landing.breadcrumbs.length - 1 && <span className="mx-2">›</span>}
              </span>
            ))}
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">{landing.h1}</h1>
          <p className="text-xl max-w-2xl mx-auto mb-8">{landing.intro}</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contacto/" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg">
              Solicita tu consulta gratuita
            </Link>
            <a href="#servicios" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg font-semibold transition-colors">
              Ver servicios
            </a>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12">
        {/* Servicios Section */}
        <section id="servicios" className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Servicios mercantiles en {landing.city}</h2>
            <p className="text-xl text-gray-600">Asesoramiento integral con enfoque local</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {landing.services.map((service, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-blue-600 mb-3">{service}</h3>
                <p className="text-gray-700">
                  {service === 'Constitución de sociedades' && 'SL/SA, estatutos y pactos de socios. Tramitación en el Registro Mercantil.'}
                  {service === 'Contratación Mercantil' && 'Agencia, distribución, franquicia, SaaS, NDA y joint ventures.'}
                  {service === 'Derecho Concursal' && 'Insolvencia, preconcurso y procedimientos concursales.'}
                  {service === 'Propiedad Industrial e Intelectual' && 'Marcas, patentes y protección de activos intangibles.'}
                  {service === 'Competencia Desleal' && 'Defensa contra prácticas desleales y competencia ilícita.'}
                  {service === 'Fusiones y Adquisiciones (M&A)' && 'LOI, Due Diligence, SPA y cierre con seguridad jurídica.'}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Valor Section */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">¿Por qué KLAMAI en {landing.city}?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-md text-center">
              <h3 className="text-lg font-semibold text-blue-600 mb-3">Conocimiento local</h3>
              <p className="text-gray-700">Experiencia en juzgados y Registro Mercantil de {landing.city}.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-md text-center">
              <h3 className="text-lg font-semibold text-blue-600 mb-3">Trato directo</h3>
              <p className="text-gray-700">Comunicación clara y respuesta en &lt;24h, sin intermediarios.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-md text-center">
              <h3 className="text-lg font-semibold text-blue-600 mb-3">Especialización</h3>
              <p className="text-gray-700">Equipo dedicado a Derecho Mercantil con casos en empresas {landing.city.toLowerCase()}.</p>
            </div>
          </div>
        </section>

        {/* Otras Localidades */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Otras localidades</h2>
            <p className="text-xl text-gray-600">Explora oficinas cercanas</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {landingsData
              .filter(l => l.city !== landing.city)
              .map((otherLanding) => (
                <Link
                  key={otherLanding.city}
                  to={`/mercantil/${otherLanding.city}/${otherLanding.city}`}
                  className="block bg-white border border-gray-200 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow text-center"
                >
                  <h3 className="text-lg font-semibold text-blue-600 hover:underline mb-3">{otherLanding.city}</h3>
                  <p className="text-gray-700">
                    {otherLanding.city === 'alicante' && 'Tech, exportación y EUIPO.'}
                    {otherLanding.city === 'castellon' && 'Sector cerámico y logística portuaria.'}
                  </p>
                </Link>
              ))}
            <Link
              to="/areas-de-practica/"
              className="block bg-white border border-gray-200 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow text-center"
            >
              <h3 className="text-lg font-semibold text-blue-600 hover:underline mb-3">Áreas de práctica</h3>
              <p className="text-gray-700">Accede a todas las áreas legales.</p>
            </Link>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Preguntas frecuentes</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {landing.faqs.map((faq, index) => (
              <details key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <summary className="font-semibold cursor-pointer text-lg hover:text-blue-600 transition-colors">
                  {faq.question}
                </summary>
                <p className="mt-4 text-gray-700">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">¿Necesitas asesoramiento mercantil en {landing.city}?</h2>
          <p className="text-lg text-gray-600 mb-6">Contacta con nuestros especialistas y recibe una consulta inicial gratuita.</p>
          <Link
            to="/contacto/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg"
          >
            Solicitar Consulta Gratuita
          </Link>
        </section>
      </main>
    </>
  );
};

export default LandingMercantilPage;
