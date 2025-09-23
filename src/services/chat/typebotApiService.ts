// Servicio para interactuar con la API de Typebot
// Placeholder - implementación pendiente

export interface TypebotStartChatRequest {
  // Definir interfaz según la API de Typebot
}

export interface TypebotContinueChatRequest {
  // Definir interfaz según la API de Typebot
}

export class TypebotApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async startChat(request: TypebotStartChatRequest) {
    // Implementar llamada a /startChat
    throw new Error('Not implemented');
  }

  async continueChat(request: TypebotContinueChatRequest) {
    // Implementar llamada a /continueChat
    throw new Error('Not implemented');
  }
}