
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
    <div className={`min-h-screen transition-all duration-300 ${darkMode ? 'dark' : ''}`}>
      <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-blue-900 dark:to-gray-800 min-h-screen">
        {/* Header */}
        <header className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Scale className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">klamAI</span>
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
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Recibe asesoramiento jurídico
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"> de especialistas</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Resuelve tus consultas legales y conecta con abogados especialistas. Rápido, seguro y eficiente.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
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

          {/* Consultation Form */}
          <div className="max-w-2xl mx-auto mb-20">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/20">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="consultation" className="text-lg font-semibold text-gray-900 dark:text-white">
                    Describe tu caso legal aquí
                  </label>
                  <Textarea
                    id="consultation"
                    placeholder="Ejemplo: Necesito asesoramiento sobre un accidente de tráfico que tuve la semana pasada..."
                    value={consultation}
                    onChange={(e) => setConsultation(e.target.value)}
                    className="min-h-32 text-base resize-none border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting || !consultation.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Conectando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Habla con un abogado especialista
                    </div>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="text-center p-8 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Tecnología IA Avanzada</h3>
              <p className="text-gray-600 dark:text-gray-300">Utilizamos las últimas herramientas de inteligencia artificial para brindarte el mejor asesoramiento legal.</p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Seguridad Garantizada</h3>
              <p className="text-gray-600 dark:text-gray-300">Tus datos y consultas están protegidos con los más altos estándares de seguridad y confidencialidad.</p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Especialistas Expertos</h3>
              <p className="text-gray-600 dark:text-gray-300">Nuestro equipo de abogados especialistas está disponible para resolver tus consultas más complejas.</p>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-8 md:p-12 text-white text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">¿Necesitas contacto directo?</h2>
            <p className="text-xl mb-8 opacity-90">Estamos aquí para ayudarte en Valencia y toda España</p>
            <div className="flex flex-wrap justify-center gap-8 text-lg">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                <span>+34 XXX XXX XXX</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <span>contacto@klamai.es</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>Valencia, España</span>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
          <p>&copy; 2024 klamAI. Todos los derechos reservados. | Asesoramiento jurídico con IA en España</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
