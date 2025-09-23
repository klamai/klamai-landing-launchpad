import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, User, Bot, Send, ArrowLeft, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: File[];
}

interface CustomChatProps {
  caseId: string;
  onBack: () => void;
  className?: string;
}

export const CustomChat: React.FC<CustomChatProps> = ({
  caseId,
  onBack,
  className
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '¡Hola! Soy VitorIA, tu asistente legal inteligente. Estoy aquí para ayudarte con tu consulta. ¿En qué puedo asistirte hoy?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // TODO: Integrate with useTypebotChat hook when ready
  // const { messages: chatMessages, input: chatInput, handleInputChange, handleSubmit, isLoading } = useTypebotChat({
  //   caseId,
  //   onMessage: (message) => {
  //     setMessages(prev => [...prev, {
  //       id: message.id,
  //       role: message.role,
  //       content: message.content,
  //       timestamp: new Date(),
  //     }]);
  //   }
  // });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
      attachments: attachedFiles.length > 0 ? attachedFiles : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedFiles([]);
    setIsTyping(true);

    // TODO: Send to Typebot API
    // Simulate AI response for now
    setTimeout(() => {
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: 'Gracias por tu mensaje. Estoy procesando tu consulta y te responderé en breve con información relevante.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const removeAttachment = (fileToRemove: File) => {
    setAttachedFiles(prev => prev.filter(file => file !== fileToRemove));
  };

  return (
    <div className={cn('h-full flex flex-col bg-gray-50 dark:bg-gray-900', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Caso #{caseId}
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Chat con IA Jurídica
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              )}

              <div className={cn(
                'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 border shadow-sm'
              )}>
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {message.attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs opacity-75">
                        <Paperclip className="w-3 h-3" />
                        <span>{file.name}</span>
                        <span>({Math.round(file.size / 1024)} KB)</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className="text-xs opacity-60 mt-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 border shadow-sm rounded-lg px-4 py-2">
                <div className="flex items-center gap-1">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">VitorIA está escribiendo...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-white dark:bg-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          {/* File Attachments Preview */}
          {attachedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1 text-sm"
                >
                  <Paperclip className="w-3 h-3" />
                  <span className="truncate max-w-32">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(file)}
                    className="text-red-500 hover:text-red-700 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Controls */}
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje aquí..."
                className="w-full min-h-[44px] max-h-32 px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                rows={1}
                style={{ height: 'auto', minHeight: '44px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                }}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setAttachedFiles(prev => [...prev, ...files].slice(0, 5));
                    e.target.value = '';
                  }}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                </label>
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={(!input.trim() && attachedFiles.length === 0) || isTyping}
              size="lg"
              className="h-11 px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Presiona Enter para enviar • Shift+Enter para nueva línea
          </p>
        </div>
      </div>
    </div>
  );
};