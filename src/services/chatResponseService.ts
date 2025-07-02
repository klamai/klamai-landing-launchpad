
export interface ChatResponse {
  text: string;
  delay: number; // milliseconds
}

export class ChatResponseService {
  private static legalResponses = {
    '/laboral': [
      "En materia laboral, es importante conocer que tienes derechos fundamentales como trabajador. Según el Estatuto de los Trabajadores, tienes derecho a:\n\n• Salario mínimo garantizado\n• Jornada máxima de 40 horas semanales\n• Vacaciones anuales retribuidas\n• Protección contra despidos improcedentes\n\n¿Te gustaría que profundice en algún aspecto específico de tu situación laboral?",
      "Para casos laborales, necesitaré conocer más detalles:\n\n• ¿Se trata de un despido, condiciones laborales o salarios?\n• ¿Tienes contrato por escrito?\n• ¿Cuánto tiempo llevas en la empresa?\n\nCon esta información podré darte una orientación más precisa sobre tus opciones legales.",
    ],
    '/civil': [
      "En derecho civil podemos abordar múltiples temas:\n\n📋 **Contratos y obligaciones**\n🏠 **Derecho inmobiliario**\n👨‍👩‍👧‍👦 **Derecho de familia**\n💰 **Responsabilidad civil**\n📜 **Herencias y sucesiones**\n\n¿Cuál de estos temas se relaciona más con tu consulta? Esto me ayudará a darte información más específica.",
      "Para tu consulta de derecho civil, es importante que me proporciones:\n\n• Descripción detallada del problema\n• Documentos relevantes que tengas\n• Si ya has intentado resolver la situación de manera amigable\n\nEl derecho civil abarca muchas áreas, desde contratos hasta responsabilidad civil.",
    ],
    '/penal': [
      "⚖️ En materia penal, es crucial actuar con rapidez y precisión.\n\n**Aspectos importantes:**\n• El derecho penal protege bienes jurídicos fundamentales\n• Los plazos procesales son estrictos\n• La defensa técnica es obligatoria en muchos casos\n\n**¿Tu consulta se refiere a:**\n- Denuncia que quieres interponer\n- Procedimiento en tu contra\n- Asesoramiento preventivo\n\nCada situación requiere un enfoque específico.",
      "En derecho penal, la confidencialidad y precisión son esenciales.\n\n**Recuerda:**\n• Todo lo que me cuentes está protegido por el secreto profesional\n• Es importante no omitir detalles relevantes\n• Los plazos en derecho penal suelen ser muy estrictos\n\n¿Puedes contarme más sobre tu situación específica?",
    ],
    '/general': [
      "¡Hola! Soy tu asistente legal de klamAI. Estoy aquí para ayudarte con tus consultas jurídicas.\n\n**Puedo asistirte con:**\n• Derecho laboral y empleo\n• Derecho civil y contratos\n• Derecho penal y infracciones\n• Derecho de familia\n• Derecho inmobiliario\n• Y muchas otras áreas legales\n\n¿En qué área necesitas orientación legal hoy?",
      "Como tu asistente legal, puedo proporcionarte:\n\n✅ **Orientación jurídica inicial**\n✅ **Explicación de tus derechos**\n✅ **Pasos a seguir en tu caso**\n✅ **Documentación necesaria**\n✅ **Conectarte con abogados especializados**\n\nCuéntame tu situación y veamos cómo puedo ayudarte.",
    ],
    'default': [
      "Gracias por tu consulta. He analizado tu situación y puedo ofrecerte la siguiente orientación legal:\n\nPara darte el mejor asesoramiento, necesitaría conocer algunos detalles adicionales. Mientras tanto, te sugiero:\n\n• Recopilar toda la documentación relevante\n• Anotar fechas importantes y cronología de eventos\n• Preparar una descripción detallada de los hechos\n\n¿Te gustaría que exploremos algún aspecto específico de tu caso?",
      "He revisado tu consulta y puedo proporcionarte información jurídica relevante.\n\n**Pasos recomendados:**\n1. Análisis detallado de tu situación\n2. Revisión de documentación pertinente\n3. Evaluación de opciones legales disponibles\n4. Estrategia de actuación personalizada\n\n¿Hay algún aspecto específico en el que te gustaría que me enfoque?",
      "Entiendo tu preocupación legal. En klamAI trabajamos para ofrecerte el mejor asesoramiento jurídico personalizado.\n\n**Mi recomendación inicial:**\n• Documenta todos los hechos relevantes\n• Conserva cualquier evidencia disponible\n• No tomes decisiones precipitadas\n• Busca asesoramiento especializado cuando sea necesario\n\n¿Te gustaría que profundice en algún aspecto específico de tu consulta?",
    ]
  };

  static async generateResponse(userMessage: string, command?: string): Promise<ChatResponse> {
    // Simulate API delay
    const delay = Math.random() * 2000 + 1000; // 1-3 seconds
    
    let responsePool: string[];
    
    if (command) {
      responsePool = this.legalResponses[command as keyof typeof this.legalResponses] || this.legalResponses.default;
    } else {
      // Analyze message content for better responses
      const message = userMessage.toLowerCase();
      if (message.includes('laboral') || message.includes('trabajo') || message.includes('despido')) {
        responsePool = this.legalResponses['/laboral'];
      } else if (message.includes('civil') || message.includes('contrato') || message.includes('herencia')) {
        responsePool = this.legalResponses['/civil'];
      } else if (message.includes('penal') || message.includes('denuncia') || message.includes('delito')) {
        responsePool = this.legalResponses['/penal'];
      } else {
        responsePool = this.legalResponses.default;
      }
    }
    
    const randomResponse = responsePool[Math.floor(Math.random() * responsePool.length)];
    
    return {
      text: randomResponse,
      delay
    };
  }
}

// Export the function for backward compatibility
export const getChatResponse = async (message: string, command?: string): Promise<string> => {
  const response = await ChatResponseService.generateResponse(message, command);
  return response.text;
};
