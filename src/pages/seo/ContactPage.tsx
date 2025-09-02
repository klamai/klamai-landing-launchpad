import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    area: '',
    mensaje: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar el formulario
    console.log('Formulario enviado:', formData);
    // Por ahora solo mostramos un mensaje
    alert('Mensaje enviado correctamente. Nos pondremos en contacto contigo pronto.');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchInput = (document.getElementById('search-query') as HTMLInputElement).value.trim();
    if (searchInput) {
      // Aquí iría la lógica de búsqueda
      console.log('Búsqueda:', searchInput);
      // Por ahora redirigimos a una búsqueda en Google
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchInput)}+derecho+abogado`, '_blank');
    }
  };

  return (
    <>
      <Helmet>
        <title>Contacto | KLAMAI – Habla con nosotros</title>
        <meta name="description" content="Contacta con KLAMAI: formulario, email, chat de soporte, chat con abogados y chat para clientes/particulares. Envía tu consulta jurídica desde el buscador." />
        <meta property="og:title" content="Contacto | KLAMAI" />
        <meta property="og:description" content="Formulario, email, chat de soporte, chat con abogados y chat para clientes/particulares. Escribe tu consulta jurídica." />
        <link rel="canonical" href="https://tu-dominio.com/contacto/" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative container mx-auto px-4 text-center">
          <nav className="inline-flex gap-2 flex-wrap items-center bg-black/45 text-white rounded-lg px-4 py-2 mb-6 text-sm">
            <Link to="/" className="hover:text-blue-200 transition-colors">Inicio</Link>
            <span className="mx-2">›</span>
            <span>Contacto</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contacto</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Elige la vía que prefieras: formulario, email, chat de soporte, chat con abogados o chat para clientes.
            También puedes escribir tu consulta jurídica directamente.
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        {/* CTA Navigation Bar */}
        <section className="mb-8">
          <div className="bg-gray-100 rounded-lg p-4 flex flex-wrap gap-3 justify-center">
            <Link to="/mercantil/" className="bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50">Ir a Mercantil</Link>
            <Link to="/areas-de-practica/" className="bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50">Áreas de práctica</Link>
            <Link to="/mercantil/valencia/valencia/" className="bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50">Valencia</Link>
            <Link to="/mercantil/alicante/alicante/" className="bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50">Alicante</Link>
            <Link to="/mercantil/castellon/castellon/" className="bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50">Castellón</Link>
          </div>
        </section>

        {/* Search Section */}
        <section className="mb-12">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Escribe aquí tu consulta jurídica</h2>
            <p className="text-gray-600 mb-6">
              Describe tu caso en una línea y te guiamos al recurso adecuado
            </p>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <form onSubmit={handleSearchSubmit} className="flex gap-4">
                <input
                  type="text"
                  id="search-query"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Escribe aquí tu consulta jurídica..."
                  required
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Buscar solución
                </button>
              </form>
              <p className="text-sm text-gray-500 mt-3">
                Ejemplos: "Contrato de distribución internacional", "Pacto de socios para startup", "Due Diligence compra SL".
              </p>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="mb-12">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Formulario de contacto</h2>
            <p className="text-gray-600 mb-6">
              Cuéntanos tu situación. Te respondemos normalmente en &lt; 24 h laborables
            </p>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tu nombre"
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tu email"
                    required
                  />
                </div>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Teléfono (opcional)"
                />
                <select
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona un área</option>
                  <option value="mercantil">Mercantil</option>
                  <option value="laboral">Laboral</option>
                  <option value="consumo">Consumo</option>
                  <option value="financiero">Financiero</option>
                  <option value="indemnizaciones">Indemnizaciones</option>
                </select>
                <textarea
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Cuéntanos tu caso"
                ></textarea>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Enviar
                </button>
                <p className="text-sm text-gray-500">
                  Al enviar aceptas nuestra política de privacidad.
                </p>
              </form>
            </div>
          </div>
        </section>

        {/* Email Section */}
        <section className="mb-12">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Enviar un email</h2>
            <p className="text-gray-600 mb-6">Si prefieres correo electrónico</p>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2">gestion@klamai.es</h3>
              <p className="text-gray-600 mb-4">Para consultas generales o envío de documentación</p>
              <a
                href="mailto:gestion@klamai.es?subject=Consulta%20jur%C3%ADdica%20KLAMAI"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
              >
                Abrir email
              </a>
            </div>
          </div>
        </section>

        {/* Chat Section */}
        <section className="mb-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Chats disponibles</h2>
            <p className="text-gray-600 mb-6">Elige el canal adecuado para acelerar tu gestión</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Chat Soporte */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Chat de soporte</h3>
                <p className="text-gray-600 mb-4">Incidencias técnicas del sitio, problemas de acceso o documentación</p>
                <Link
                  to="/chat/soporte/"
                  className="inline-block bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 font-semibold text-sm"
                >
                  Abrir chat de soporte
                </Link>
              </div>

              {/* Chat Abogados */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Chat con abogados (Mercantil)</h3>
                <p className="text-gray-600 mb-4">Dudas sobre contratos, sociedades, M&A o Due Diligence</p>
                <Link
                  to="/chat/abogados/"
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold text-sm"
                >
                  Hablar con un abogado
                </Link>
              </div>

              {/* Chat Clientes */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Chat clientes / particulares</h3>
                <p className="text-gray-600 mb-4">Atención a clientes, seguimiento de expedientes y citas</p>
                <Link
                  to="/chat/clientes/"
                  className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-semibold text-sm"
                >
                  Abrir chat de clientes
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Enlaces rápidos</h2>
            <p className="text-gray-600 mb-6">Accede directamente a las áreas y provincias</p>
            <div className="bg-gray-100 rounded-lg p-4 flex flex-wrap gap-3 justify-center">
              <Link to="/areas-de-practica/" className="bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50">Áreas de práctica</Link>
              <Link to="/mercantil/" className="bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50">Mercantil</Link>
              <Link to="/mercantil/valencia/valencia/" className="bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50">Valencia</Link>
              <Link to="/mercantil/alicante/alicante/" className="bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50">Alicante</Link>
              <Link to="/mercantil/castellon/castellon/" className="bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50">Castellón</Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default ContactPage;
