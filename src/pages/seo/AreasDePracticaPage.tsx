import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const AreasDePracticaPage = () => {
  const pageTitle = "Áreas de Práctica - Despacho de Abogados";
  const pageDescription = "Nuestro despacho ofrece asesoramiento legal especializado en diversas áreas de práctica, incluyendo Derecho Mercantil, Civil, Penal y Laboral.";
  const canonicalUrl = "https://tu-dominio.com/areas-de-practica";

  const areas = [
    {
      name: 'Derecho Mercantil',
      url: '/mercantil',
      description: 'Contratos, sociedades, M&A y Due Diligence.',
      cities: [
        { name: 'Valencia', url: '/mercantil/valencia/valencia' },
        { name: 'Alicante', url: '/mercantil/alicante/alicante' },
        { name: 'Castellón', url: '/mercantil/castellon/castellon' }
      ]
    },
    {
      name: 'Derecho Laboral',
      url: '/laboral',
      description: 'Contratos, despidos, ERTE/ERE, negociación colectiva.'
    },
    {
      name: 'Derecho del Consumo',
      url: '/consumo',
      description: 'Reclamaciones, garantías, cláusulas abusivas.'
    },
    {
      name: 'Derecho Financiero',
      url: '/financiero',
      description: 'Productos bancarios, financiación, reestructuraciones.'
    },
    {
      name: 'Indemnizaciones',
      url: '/indemnizaciones',
      description: 'Accidentes, responsabilidad civil y seguros.'
    },
  ];

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative container mx-auto px-4 text-center">
          <nav className="inline-flex gap-2 flex-wrap items-center bg-black/45 text-white rounded-lg px-4 py-2 mb-6 text-sm">
            <Link to="/" className="hover:text-blue-200 transition-colors">Inicio</Link>
            <span className="mx-2">›</span>
            <span>Áreas de práctica</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Nuestras Áreas de Práctica</h1>
          <p className="text-xl max-w-2xl mx-auto mb-8">
            Ofrecemos un servicio legal completo, abarcando las principales ramas del derecho para dar una solución global a nuestros clientes.
          </p>
          <Link to="/contacto/" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg">
            Consulta gratuita
          </Link>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12">
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Categorías principales</h2>
            <p className="text-xl text-gray-600">Especialización en cada rama del derecho</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {areas.map((area) => (
              <div key={area.name} className="p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                <Link to={area.url}>
                  <h3 className="text-lg font-semibold text-blue-600 hover:underline mb-3">{area.name}</h3>
                </Link>
                <p className="text-gray-700 mb-4">{area.description}</p>
                {area.cities && (
                  <div className="flex flex-wrap gap-2">
                    {area.cities.map((city) => (
                      <Link
                        key={city.name}
                        to={city.url}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium transition-colors"
                      >
                        {city.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">¿Necesitas asesoramiento legal?</h2>
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

export default AreasDePracticaPage;
