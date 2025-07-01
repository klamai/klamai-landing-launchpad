"use client";

import { useEffect, useRef, useCallback, useTransition } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  FileUp,
  ArrowUpIcon,
  Paperclip,
  SendIcon,
  XIcon,
  Sparkles,
  Command,
  Scale,
  FileText,
  MessageCircle,
  Users,
  Mic,
  MicOff,
  Trash2,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";
import { ChatMessage, Message } from "@/components/ChatMessage";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { ChatResponseService } from "@/services/chatResponseService";

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
    icon: React.ReactNode;
    label: string;
    description: string;
    prefix: string;
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    
    return (
      <div className={cn(
        "relative",
        containerClassName
      )}>
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0" : "",
            className
          )}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {showRing && isFocused && (
          <motion.span 
            className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-offset-0 ring-blue-500/30 dark:ring-blue-400/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export function AnimatedAIChat() {
    const [value, setValue] = useState("");
    const [attachments, setAttachments] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [recentCommand, setRecentCommand] = useState<string | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [inputFocused, setInputFocused] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [hasMessages, setHasMessages] = useState(false);
    
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });
    const { isRecording, startRecording, stopRecording, audioLevel } = useAudioRecording();
    const commandPaletteRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const commandSuggestions: CommandSuggestion[] = [
        { 
            icon: <FileText className="w-4 h-4" />, 
            label: "Consulta Laboral", 
            description: "Generar consulta sobre derecho laboral", 
            prefix: "/laboral" 
        },
        { 
            icon: <Users className="w-4 h-4" />, 
            label: "Derecho Civil", 
            description: "Consulta sobre derecho civil", 
            prefix: "/civil" 
        },
        { 
            icon: <Scale className="w-4 h-4" />, 
            label: "Derecho Penal", 
            description: "Generar consulta penal", 
            prefix: "/penal" 
        },
        { 
            icon: <MessageCircle className="w-4 h-4" />, 
            label: "Consulta General", 
            description: "Iniciar consulta legal general", 
            prefix: "/general" 
        },
    ];

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (value.startsWith('/') && !value.includes(' ')) {
            setShowCommandPalette(true);
            
            const matchingSuggestionIndex = commandSuggestions.findIndex(
                (cmd) => cmd.prefix.startsWith(value)
            );
            
            if (matchingSuggestionIndex >= 0) {
                setActiveSuggestion(matchingSuggestionIndex);
            } else {
                setActiveSuggestion(-1);
            }
        } else {
            setShowCommandPalette(false);
        }
    }, [value]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const commandButton = document.querySelector('[data-command-button]');
            
            if (commandPaletteRef.current && 
                !commandPaletteRef.current.contains(target) && 
                !commandButton?.contains(target)) {
                setShowCommandPalette(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showCommandPalette) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev < commandSuggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev > 0 ? prev - 1 : commandSuggestions.length - 1
                );
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                if (activeSuggestion >= 0) {
                    const selectedCommand = commandSuggestions[activeSuggestion];
                    setValue(selectedCommand.prefix + ' ');
                    setShowCommandPalette(false);
                    
                    setRecentCommand(selectedCommand.label);
                    setTimeout(() => setRecentCommand(null), 3500);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowCommandPalette(false);
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
                handleSendMessage();
            }
        }
    };

    const addMessage = async (text: string, isUser: boolean, type: 'text' | 'audio' | 'command' = 'text', command?: string) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            text,
            isUser,
            timestamp: new Date(),
            type,
            command
        };
        
        setMessages(prev => [...prev, newMessage]);
        setHasMessages(true);
        
        if (isUser) {
            // Generate AI response
            setIsTyping(true);
            try {
                const response = await ChatResponseService.generateResponse(text, command);
                
                setTimeout(() => {
                    const aiMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        text: response.text,
                        isUser: false,
                        timestamp: new Date(),
                        type: 'text'
                    };
                    setMessages(prev => [...prev, aiMessage]);
                    setIsTyping(false);
                }, response.delay);
            } catch (error) {
                setIsTyping(false);
                console.error('Error generating response:', error);
            }
        }
    };

    const handleSendMessage = async () => {
        if (value.trim()) {
            const messageText = value;
            const command = messageText.startsWith('/') ? messageText.split(' ')[0] : undefined;
            
            await addMessage(messageText, true, command ? 'command' : 'text', command);
            setValue("");
            adjustHeight(true);
        }
    };

    const handleAudioRecord = async () => {
        if (isRecording) {
            const transcription = await stopRecording();
            if (transcription) {
                await addMessage(transcription, true, 'audio');
            }
        } else {
            await startRecording();
        }
    };

    const handleAttachFile = () => {
        const mockFileName = `documento-${Math.floor(Math.random() * 1000)}.pdf`;
        setAttachments(prev => [...prev, mockFileName]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };
    
    const selectCommandSuggestion = async (index: number) => {
        const selectedCommand = commandSuggestions[index];
        await addMessage(selectedCommand.prefix, true, 'command', selectedCommand.prefix);
        setShowCommandPalette(false);
        
        setRecentCommand(selectedCommand.label);
        setTimeout(() => setRecentCommand(null), 2000);
    };

    const clearConversation = () => {
        setMessages([]);
        setHasMessages(false);
    };

    const exportConversation = () => {
        const conversationText = messages.map(msg => 
            `[${msg.timestamp.toLocaleString()}] ${msg.isUser ? 'Usuario' : 'klamAI'}: ${msg.text}`
        ).join('\n\n');
        
        const blob = new Blob([conversationText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `consulta-legal-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full w-full flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white relative overflow-hidden">
            {/* Background animations with lower z-index */}
            <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
                <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-blue-600/5 dark:bg-blue-600/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
            </div>

            {!hasMessages ? (
                // Welcome Screen
                <div className="flex-1 flex items-center justify-center p-6 relative z-10">
                    <div className="w-full max-w-2xl mx-auto">
                        <motion.div 
                            className="space-y-12"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            <div className="text-center space-y-3">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                    className="inline-block"
                                >
                                    <div className="flex items-center justify-center mb-4">
                                        <Scale className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
                                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">klamAI</span>
                                    </div>
                                    <h1 className="text-3xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-600 to-indigo-600 dark:from-white dark:via-blue-400 dark:to-indigo-400 pb-1">
                                        ¿Cómo puedo ayudarte hoy?
                                    </h1>
                                    <motion.div 
                                        className="h-px bg-gradient-to-r from-transparent via-blue-500/30 dark:via-blue-400/30 to-transparent"
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: "100%", opacity: 1 }}
                                        transition={{ delay: 0.5, duration: 0.8 }}
                                    />
                                </motion.div>
                                <motion.p 
                                    className="text-sm text-gray-600 dark:text-gray-400"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    Escribe un comando o haz una pregunta legal
                                </motion.p>
                            </div>

                            {/* Command suggestion buttons with higher z-index and better positioning */}
                            <div className="relative z-30 flex flex-wrap items-center justify-center gap-3">
                                {commandSuggestions.map((suggestion, index) => (
                                    <motion.button
                                        key={suggestion.prefix}
                                        onClick={() => selectCommandSuggestion(index)}
                                        className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all relative group border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md backdrop-blur-sm"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{ zIndex: 40 }}
                                    >
                                        <div className="text-blue-600 dark:text-blue-400">
                                            {suggestion.icon}
                                        </div>
                                        <span className="font-medium">{suggestion.label}</span>
                                        <motion.div
                                            className="absolute inset-0 border-2 border-blue-200 dark:border-blue-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                            initial={false}
                                        />
                                        {/* Subtle glow effect */}
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                            initial={false}
                                        />
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            ) : (
                // Chat Messages Area
                <div className="flex-1 flex flex-col relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <Scale className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            <div>
                                <h2 className="font-semibold text-gray-900 dark:text-white">Consulta Legal</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {messages.length} mensajes
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={exportConversation}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg transition-colors"
                                title="Exportar conversación"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                            <button
                                onClick={clearConversation}
                                className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg transition-colors"
                                title="Limpiar conversación"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => (
                            <ChatMessage key={message.id} message={message} />
                        ))}
                        
                        {isTyping && (
                            <motion.div 
                                className="flex gap-3 justify-start"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                        <Scale className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 p-4 rounded-2xl">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <span>klamAI está escribiendo</span>
                                        <TypingDots />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}

            {/* Input Area with highest z-index */}
            <div className="relative z-50 p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
                <motion.div 
                    className="relative backdrop-blur-2xl bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl"
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                    style={{ zIndex: 60 }}
                >
                    <AnimatePresence>
                        {showCommandPalette && (
                            <motion.div 
                                ref={commandPaletteRef}
                                className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                transition={{ duration: 0.15 }}
                                style={{ zIndex: 70 }}
                            >
                                <div className="py-1">
                                    {commandSuggestions.map((suggestion, index) => (
                                        <motion.div
                                            key={suggestion.prefix}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
                                                activeSuggestion === index 
                                                    ? "bg-blue-500 text-white" 
                                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            )}
                                            onClick={() => selectCommandSuggestion(index)}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.03 }}
                                        >
                                            <div className="w-5 h-5 flex items-center justify-center text-gray-600 dark:text-gray-400">
                                                {suggestion.icon}
                                            </div>
                                            <div className="font-medium">{suggestion.label}</div>
                                            <div className="text-gray-500 dark:text-gray-400 text-xs ml-1">
                                                {suggestion.prefix}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="p-4">
                        <Textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value);
                                adjustHeight();
                            }}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setInputFocused(true)}
                            onBlur={() => setInputFocused(false)}
                            placeholder="Escribe tu consulta legal aquí..."
                            containerClassName="w-full"
                            className={cn(
                                "w-full px-4 py-3",
                                "resize-none",
                                "bg-transparent",
                                "border-none",
                                "text-gray-900 dark:text-white text-sm",
                                "focus:outline-none",
                                "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                                "min-h-[60px]"
                            )}
                            style={{
                                overflow: "hidden",
                            }}
                            showRing={false}
                        />
                    </div>

                    <AnimatePresence>
                        {attachments.length > 0 && (
                            <motion.div 
                                className="px-4 pb-3 flex gap-2 flex-wrap"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                {attachments.map((file, index) => (
                                    <motion.div
                                        key={index}
                                        className="flex items-center gap-2 text-xs bg-gray-100 dark:bg-gray-700 py-1.5 px-3 rounded-lg text-gray-700 dark:text-gray-300"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                    >
                                        <span>{file}</span>
                                        <button 
                                            onClick={() => removeAttachment(index)}
                                            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                        >
                                            <XIcon className="w-3 h-3" />
                                        </button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <motion.button
                                type="button"
                                onClick={handleAttachFile}
                                whileTap={{ scale: 0.94 }}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition-colors relative group"
                            >
                                <Paperclip className="w-4 h-4" />
                                <motion.span
                                    className="absolute inset-0 bg-gray-100 dark:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    layoutId="button-highlight"
                                />
                            </motion.button>
                            
                            <motion.button
                                type="button"
                                onClick={handleAudioRecord}
                                whileTap={{ scale: 0.94 }}
                                className={cn(
                                    "p-2 rounded-lg transition-colors relative group",
                                    isRecording 
                                        ? "text-red-500 bg-red-50 dark:bg-red-900/20" 
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                )}
                            >
                                {isRecording ? (
                                    <div className="relative">
                                        <MicOff className="w-4 h-4" />
                                        <motion.div
                                            className="absolute inset-0 rounded-full border-2 border-red-500"
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                            style={{ opacity: audioLevel }}
                                        />
                                    </div>
                                ) : (
                                    <Mic className="w-4 h-4" />
                                )}
                                {!isRecording && (
                                    <motion.span
                                        className="absolute inset-0 bg-gray-100 dark:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        layoutId="button-highlight"
                                    />
                                )}
                            </motion.button>
                            
                            <motion.button
                                type="button"
                                data-command-button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowCommandPalette(prev => !prev);
                                }}
                                whileTap={{ scale: 0.94 }}
                                className={cn(
                                    "p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition-colors relative group",
                                    showCommandPalette && "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                                )}
                            >
                                <Command className="w-4 h-4" />
                                <motion.span
                                    className="absolute inset-0 bg-gray-100 dark:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    layoutId="button-highlight"
                                />
                            </motion.button>
                        </div>
                        
                        <motion.button
                            type="button"
                            onClick={handleSendMessage}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isTyping || !value.trim()}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                "flex items-center gap-2",
                                value.trim()
                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                            )}
                        >
                            {isTyping ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <SendIcon className="w-4 h-4" />
                            )}
                            <span>Enviar</span>
                        </motion.button>
                    </div>
                </motion.div>
            </div>

            {/* Mouse follower with lower z-index */}
            {inputFocused && (
                <motion.div 
                    className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-[0.02] bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 blur-[96px]"
                    animate={{
                        x: mousePosition.x - 400,
                        y: mousePosition.y - 400,
                    }}
                    transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 150,
                        mass: 0.5,
                    }}
                />
            )}
        </div>
    );
}

function TypingDots() {
    return (
        <div className="flex items-center ml-1">
            {[1, 2, 3].map((dot) => (
                <motion.div
                    key={dot}
                    className="w-1.5 h-1.5 bg-blue-500 rounded-full mx-0.5"
                    initial={{ opacity: 0.3 }}
                    animate={{ 
                        opacity: [0.3, 0.9, 0.3],
                        scale: [0.85, 1.1, 0.85]
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: dot * 0.15,
                        ease: "easeInOut",
                    }}
                    style={{
                        boxShadow: "0 0 4px rgba(59, 130, 246, 0.3)"
                    }}
                />
            ))}
        </div>
    );
}
