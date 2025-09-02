import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import landingsData from '@/data/mercantil-landings.json';

const MercantilHubPage = () => {
  const pageTitle = "Derecho Mercantil - Asesoramiento en Valencia, Alicante y Castellón";
  const pageDescription = "Especialistas en Derecho Mercantil. Ofrecemos cobertura en las principales provincias de la Comunidad Valenciana. Contacte con nuestros abogados en Valencia, Alicante o Castellón.";
  const canonicalUrl = "https://tu-dominio.com/derecho-mercantil";

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

      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Derecho Mercantil</h1>
          <p className="mt-2 text-lg text-gray-600">
            Ofrecemos un asesoramiento jurídico integral para empresas, autónomos y emprendedores en el complejo ámbito del derecho mercantil. Nuestro objetivo es proporcionar la seguridad jurídica que su negocio necesita para crecer.
          </p>
        </header>

        <main>
          <section>
            <h2 className="text-2xl font-semibold mb-4">Nuestras Sedes</h2>
            <p className="mb-6">
              Contamos con un equipo de abogados mercantilistas listos para atenderle en las principales provincias de la Comunidad Valenciana. Seleccione su ubicación para obtener información más detallada:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {landingsData.map((landing) => (
                <Link
                  key={landing.city}
                  to={`/mercantil/${landing.city}/${landing.city}`}
                  className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 transition-colors"
                >
                  <h3 className="text-xl font-bold text-blue-600">
                    Abogados en {landing.province}
                  </h3>
                  <p className="mt-2 text-gray-700">
                    Asesoramiento especializado para empresas en {landing.province}.
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default MercantilHubPage;
