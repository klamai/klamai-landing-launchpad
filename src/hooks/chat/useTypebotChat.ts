// Hook personalizado para integrar useChat de Vercel AI SDK con Typebot API
// Placeholder - implementación pendiente

import { useChat } from '@ai-sdk/react';

export interface UseTypebotChatOptions {
  // Opciones del hook
}

export function useTypebotChat(options: UseTypebotChatOptions) {
  // Integrar useChat con TypebotApiService
  const chat = useChat({
    // Configuración básica
  });

  return {
    ...chat,
    // Métodos adicionales para Typebot
  };
}