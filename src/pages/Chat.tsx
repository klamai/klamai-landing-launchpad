
import { Standard } from "@typebot.io/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Scale, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";

const Chat = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-20 left-1/4 w-32 h-32 bg-purple-300/10 rounded-full blur-2xl"></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600/10 dark:bg-blue-400/10 rounded-xl">
                <Scale className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                klam<span className="text-blue-600 dark:text-blue-400">AI</span>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Cambiar tema</span>
              </Button>
              
              <Link to="/">
                <Button variant="outline" className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700">
                  <ArrowLeft className="h-4 w-4" />
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Section */}
      <main className="relative container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              En línea
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
              Chat con{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                VitorIA
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Tu asistente legal inteligente está listo para resolver todas tus consultas jurídicas
            </p>
          </div>

          <div className="bg-white/70 dark:bg-gray-800/70 rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl">
            {/* Chat header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Scale className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">VitorIA</h3>
                  <p className="text-blue-100 text-sm">Asistente Legal IA</p>
                </div>
              </div>
            </div>
            
            {/* Typebot Chat */}
            <div className="relative">
              <Standard
                typebot="open-ai-assistant-chat-30pe3ns"
                apiHost="https://bot.autoiax.com"
                style={{ width: "100%", height: "600px" }}
              />
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Respuestas instantáneas
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              100% confidencial
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              Disponible 24/7
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;
