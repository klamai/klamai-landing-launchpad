
import { Standard } from "@typebot.io/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Scale } from "lucide-react";
import { Link } from "react-router-dom";

const Chat = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Scale className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">klamAI</span>
            </div>
            <Link to="/">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Chat Section */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Chat con <span className="text-blue-600 dark:text-blue-400">VitorIA</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Tu asistente legal inteligente está listo para ayudarte
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <Standard
              typebot="open-ai-assistant-chat-30pe3ns"
              apiHost="https://bot.autoiax.com"
              style={{ width: "100%", height: "600px" }}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;
