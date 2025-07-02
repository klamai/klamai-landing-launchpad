
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Mic, MicOff, Moon, Sun, Scale } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { ChatMessage } from "@/components/ChatMessage";
import ChatHistory from "@/components/ChatHistory";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { ChatResponseService } from "@/services/chatResponseService";

interface Message {
  id: string;
  content: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isRecording, startRecording, stopRecording } = useAudioRecording();

  // Check for dark mode preference from localStorage and system
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === "") return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await ChatResponseService.generateResponse(input);
      const aiMessage: Message = {
        id: Date.now().toString() + "-ai",
        content: response.text || "No se pudo obtener una respuesta.",
        text: response.text || "No se pudo obtener una respuesta.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error("Error al obtener la respuesta del chat:", error);
      const errorAiMessage: Message = {
        id: Date.now().toString() + "-ai-error",
        content: "Error al obtener la respuesta. Por favor, inténtalo de nuevo.",
        text: "Error al obtener la respuesta. Por favor, inténtalo de nuevo.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, errorAiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      const audio = await stopRecording();
      if (audio) {
        // Aquí puedes enviar el audio a tu backend para la transcripción
        console.log("Audio grabado:", audio);
        // Simulación de respuesta del backend
        setTimeout(() => {
          const aiMessage: Message = {
            id: Date.now().toString() + "-ai",
            content: "Respuesta simulada a partir del audio grabado.",
            text: "Respuesta simulada a partir del audio grabado.",
            isUser: false,
            timestamp: new Date(),
          };
          setMessages((prevMessages) => [...prevMessages, aiMessage]);
        }, 1500);
      }
    } else {
      startRecording();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="flex h-screen">
        {/* Chat History Sidebar - Only show for authenticated users */}
        {user && <ChatHistory />}
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/')}
                className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900 dark:text-white">klamAI</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Asistente Legal IA</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              
              {user ? (
                <Button onClick={() => navigate('/dashboard')} size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Dashboard
                </Button>
              ) : (
                <Button onClick={() => navigate('/auth')} size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950">
                  Iniciar Sesión
                </Button>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500 animate-pulse"></div>
                    <div className="w-3 h-3 rounded-full bg-gray-500 animate-pulse delay-100"></div>
                    <div className="w-3 h-3 rounded-full bg-gray-500 animate-pulse delay-200"></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <Input
                type="text"
                placeholder="Escribe tu mensaje..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="pr-16 rounded-full"
                disabled={isLoading}
              />
              <div className="absolute right-2 flex items-center space-x-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleMicClick}
                  disabled={isLoading}
                >
                  {isRecording ? <MicOff className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
                </Button>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  disabled={isLoading}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
