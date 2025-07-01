
import React from 'react';
import { motion } from 'framer-motion';
import { Scale, User, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'audio' | 'command';
  command?: string;
}

interface ChatMessageProps {
  message: Message;
  isLatest?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLatest = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'} mb-6`}
    >
      {!message.isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Scale className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
      
      <div className={`max-w-[70%] ${message.isUser ? 'order-first' : ''}`}>
        <div
          className={`relative p-4 rounded-2xl ${
            message.isUser
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white ml-auto'
              : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
          }`}
        >
          {message.type === 'command' && message.command && (
            <div className={`text-xs mb-2 ${message.isUser ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}>
              <span className="font-mono bg-black/10 dark:bg-white/10 px-2 py-1 rounded">
                {message.command}
              </span>
            </div>
          )}
          
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.text}
          </p>
          
          {!message.isUser && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3 text-gray-400" />
              )}
            </button>
          )}
        </div>
        
        <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400 ${
          message.isUser ? 'justify-end' : 'justify-start'
        }`}>
          <span>{formatTime(message.timestamp)}</span>
          {message.type === 'audio' && (
            <span className="text-blue-500">🎤 Audio</span>
          )}
        </div>
      </div>
      
      {message.isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </motion.div>
  );
};
