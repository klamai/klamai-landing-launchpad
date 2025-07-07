
import { Caso } from "@/types/database";

// Estados que el cliente puede ver con sus versiones amigables
export const CLIENT_VISIBLE_STATES = {
  'borrador': 'En preparación',
  'esperando_pago': 'Pendiente de pago',
  'disponible': 'En revisión por abogados',
  'agotado': 'Atendido',
  'cerrado': 'Finalizado'
} as const;

// Estados internos que solo ven los abogados
export const LAWYER_ONLY_STATES = {
  'listo_para_propuesta': 'Listo para propuesta'
} as const;

// Campos que solo pueden ver los abogados
export const LAWYER_ONLY_FIELDS = [
  'guia_abogado',
  'propuesta_estructurada',
  'resumen_caso',
  'transcripcion_chat',
  'propuesta_cliente',
  'valor_estimado'
] as const;

// Función para obtener el estado visible para el cliente
export const getClientFriendlyStatus = (estado: string): string => {
  if (estado in CLIENT_VISIBLE_STATES) {
    return CLIENT_VISIBLE_STATES[estado as keyof typeof CLIENT_VISIBLE_STATES];
  }
  // Si es un estado interno, mostrar genérico
  return 'En proceso';
};

// Función para obtener el estado completo para abogados
export const getLawyerStatus = (estado: string): string => {
  if (estado in CLIENT_VISIBLE_STATES) {
    return CLIENT_VISIBLE_STATES[estado as keyof typeof CLIENT_VISIBLE_STATES];
  }
  if (estado in LAWYER_ONLY_STATES) {
    return LAWYER_ONLY_STATES[estado as keyof typeof LAWYER_ONLY_STATES];
  }
  return estado;
};

// Función para filtrar campos según el rol - devuelve un Caso completo pero sin campos sensibles
export const filterCaseForClient = (caso: Caso): Caso => {
  const filteredCase: Caso = {
    ...caso,
    // Remover campos sensibles para clientes
    guia_abogado: undefined,
    propuesta_estructurada: undefined,
    resumen_caso: undefined,
    transcripcion_chat: undefined,
    propuesta_cliente: undefined,
    valor_estimado: undefined
  };

  return filteredCase;
};

// Función para verificar si un campo es visible para el cliente
export const isFieldVisibleToClient = (fieldName: string): boolean => {
  return !LAWYER_ONLY_FIELDS.includes(fieldName as any);
};
