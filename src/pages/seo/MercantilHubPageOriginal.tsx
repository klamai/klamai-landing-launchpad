import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const MercantilHubPageOriginal = () => {
  const pageTitle = "Abogado Mercantil | KLAMAI – Área de empresas, pymes y startups";
  const pageDescription = "Área de Derecho Mercantil de KLAMAI. Sociedades, contratos, M&A, Due Diligence y gobierno corporativo. Atención en Valencia, Alicante y Castellón. Consulta gratuita.";
  const canonicalUrl = "https://klamai.com/mercantil/";

  const services = [
    {
      title: "Constitución de sociedades",
      description: "Forma jurídica, estatutos y pactos de socios.",
      url: "/mercantil/constitucion-sociedades/"
    },
    {
      title: "Contratos mercantiles",
      description: "Agencia, distribución, suministro, franquicia, SaaS, NDA.",
      url: "/mercantil/contratos-mercantiles/"
    },
    {
      title: "Fusiones y adquisiciones (M&A)",
      description: "LOI, Due Diligence, SPA y cierre.",
      url: "/mercantil/fusiones-adquisiciones/"
    },
    {
      title: "Due Diligence",
      description: "Revisión legal y contractual previa a inversión.",
      url: "/mercantil/due-diligence/"
    },
    {
      title: "Gobierno corporativo",
      description: "Órganos de administración, protocolos y cumplimiento.",
      url: "/mercantil/gobierno-corporativo/"
    },
    {
      title: "Startups y rondas",
      description: "Cap table, ESOP, SAFE/CLAs y data room.",
      url: "/mercantil/startups/"
    }
  ];

  const locations = [
    {
      name: "Valencia",
      description: "Pymes y startups valencianas.",
      url: "/mercantil/valencia/valencia/"
    },
    {
      name: "Alicante",
      description: "Tech, exportación y EUIPO.",
      url: "/mercantil/alicante/alicante/"
    },
    {
      name: "Castellón",
      description: "Sector cerámico y logística.",
      url: "/mercantil/castellon/castellon/"
    }
  ];

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content="Abogado Mercantil | KLAMAI" />
        <meta property="og:description" content="Contratos, sociedades, fusiones y Due Diligence para empresas y startups. Consulta inicial gratuita." />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>

      {/* Hero Section con gradiente e imagen de fondo */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative container mx-auto px-4 text-center">
          <nav className="inline-flex gap-2 flex-wrap items-center bg-black/45 text-white rounded-lg px-4 py-2 mb-6 text-sm">
            <Link to="/" className="hover:text-blue-200 transition-colors">Inicio</Link>
            <span className="mx-2">›</span>
            <Link to="/areas-de-practica/" className="hover:text-blue-200 transition-colors">Áreas</Link>
            <span className="mx-2">›</span>
            <span>Mercantil</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Abogado Mercantil</h1>
          <p className="text-xl max-w-2xl mx-auto mb-8">
            Sociedades, contratos, fusiones y adquisiciones, Due Diligence y gobierno corporativo. Servicios para empresas, pymes y startups.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contacto/" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg">
              Consulta gratuita
            </Link>
            <a href="#servicios" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg font-semibold transition-colors">
              Ver servicios
            </a>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12">
        {/* Services Section */}
        <section id="servicios" className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Servicios de Derecho Mercantil</h2>
            <p className="text-xl text-gray-600">Cobertura integral para cada fase de tu negocio</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Link
                key={index}
                to={service.url}
                className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold text-blue-600 hover:underline mb-3">{service.title}</h3>
                <p className="text-gray-700">{service.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Locations Section */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Atención por provincias</h2>
            <p className="text-xl text-gray-600">Elige tu sede</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {locations.map((location, index) => (
              <Link
                key={index}
                to={location.url}
                className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-shadow text-center"
              >
                <h3 className="text-xl font-semibold text-blue-600 hover:underline mb-3">{location.name}</h3>
                <p className="text-gray-700">{location.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">¿Necesitas asesoramiento mercantil?</h2>
          <p className="text-lg text-gray-600 mb-6">Contacta con nuestros especialistas en Valencia, Alicante o Castellón y recibe una consulta inicial gratuita.</p>
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

export default MercantilHubPageOriginal;
