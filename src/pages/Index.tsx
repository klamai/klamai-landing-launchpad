
import { useState } from "react";
import { Moon, Sun, Scale, Zap, Shield, Users, MessageCircle, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const Index = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [consultation, setConsultation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultation.trim()) return;

    setIsSubmitting(true);
    
    // Encode the consultation text for URL
    const encodedConsultation = encodeURIComponent(consultation.trim());
    const utmUrl = `https://bot.misitio.com/open-ai-assistant-chat-30pe3ns?utm_value=${encodedConsultation}`;
    
    // Simulate a brief loading state for better UX
    setTimeout(() => {
      window.location.href = utmUrl;
    }, 500);
  };

  return (
    <div className={`min-h-screen transition-all duration-300 font-sans ${darkMode ? 'dark' : ''}`}>
      <div className="bg-gradient-to-br from-blue-100 via-sky-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-gray-800 min-h-screen">
        {/* Header */}
        <header className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Scale className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">klamAI</span>
          </div>
          <Button
            onClick={toggleDarkMode}
            variant="outline"
            size="icon"
            className="rounded-full"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-4 py-12">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
              Recibe asesoramiento jurídico
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"> de especialistas</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed font-medium">
              Resuelve tus consultas legales con <span className="font-semibold text-blue-700 dark:text-blue-300">vitorIA</span>, nuestro asistente inteligente, y conecta con abogados especialistas. Rápido, seguro y eficiente.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Valencia, España</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Atención Virtual en toda España</span>
              </div>
            </div>
          </div>

          {/* Consultation Form - Enhanced */}
          <div className="max-w-2xl mx-auto mb-20">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border-2 border-blue-200 dark:border-blue-500/30 relative overflow-hidden">
              {/* Animated background elements */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-900/20 dark:to-cyan-900/20 animate-pulse"></div>
              <div className="relative z-10">
                {/* Call to action header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-4 animate-bounce">
                    <MessageCircle className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    🚀 ¡Cuéntanos tu caso ahora!
                  </h2>
                  <p className="text-lg text-blue-600 dark:text-blue-400 font-semibold">
                    vitorIA te responderá al instante
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <label htmlFor="consultation" className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      ✍️ Describe tu situación legal aquí
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
                      💡 <strong>Tip:</strong> Cuanto más detalles proporciones, mejor podrá ayudarte vitorIA
                    </p>
                    <div className="relative">
                      <Textarea
                        id="consultation"
                        placeholder="Ejemplo: Tuve un accidente de tráfico la semana pasada y el otro conductor no tenía seguro. ¿Qué opciones legales tengo para recuperar los gastos médicos y reparaciones del vehículo?"
                        value={consultation}
                        onChange={(e) => setConsultation(e.target.value)}
                        className="min-h-40 text-base resize-none border-2 border-blue-300 dark:border-blue-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl font-medium bg-white/80 dark:bg-gray-900/80 shadow-inner"
                        required
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                        {consultation.length}/500 caracteres
                      </div>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !consultation.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-6 px-8 rounded-xl text-xl shadow-2xl transform transition-all duration-200 hover:scale-105 hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-3 relative z-10">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        Conectando con vitorIA...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3 relative z-10">
                        <MessageCircle className="h-6 w-6" />
                        💬 Consultar con vitorIA GRATIS
                      </div>
                    )}
                  </Button>
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
                    🔒 Tu consulta es <strong>100% confidencial</strong> y sin compromiso
                  </p>
                </form>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="text-center p-8 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Tecnología IA Avanzada</h3>
              <p className="text-gray-600 dark:text-gray-300 font-medium">Utilizamos las últimas herramientas de inteligencia artificial para brindarte el mejor asesoramiento legal.</p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Seguridad Garantizada</h3>
              <p className="text-gray-600 dark:text-gray-300 font-medium">Tus datos y consultas están protegidos con los más altos estándares de seguridad y confidencialidad.</p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Especialistas Expertos</h3>
              <p className="text-gray-600 dark:text-gray-300 font-medium">Nuestro equipo de abogados especialistas está disponible para resolver tus consultas más complejas.</p>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-8 md:p-12 text-white text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">¿Necesitas contacto directo?</h2>
            <p className="text-xl mb-8 opacity-90 font-medium">Estamos aquí para ayudarte en Valencia y toda España</p>
            <div className="flex flex-wrap justify-center gap-8 text-lg font-medium">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                <span>632 018 899</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <span>contacto@klamai.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>Valencia, España</span>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 font-medium">
          <p>&copy; 2024 klamAI. Todos los derechos reservados. | Asesoramiento jurídico con IA en España</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
