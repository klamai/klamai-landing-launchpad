
import { Standard } from "@typebot.io/react";

const Chat = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      {/* Navbar */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Vitoria AI
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Inicio
              </a>
              <a href="/chat" className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                Chat
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Chat Container */}
      <div className="h-[calc(100vh-4rem)] p-4">
        <div className="h-full max-w-6xl mx-auto">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 h-full overflow-hidden">
            <div className="h-full">
              <Standard
                typebot="open-ai-assistant-chat-30pe3ns"
                apiHost="https://bot.autoiax.com"
                style={{ 
                  width: "100%", 
                  height: "100%",
                  border: "none",
                  borderRadius: "1rem"
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
