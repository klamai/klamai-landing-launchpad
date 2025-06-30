
export interface Especialidad {
  id: number;
  nombre: string;
}

export interface Caso {
  id: string;
  cliente_id: string;
  especialidad_id: number | null;
  estado: 'borrador' | 'esperando_pago' | 'activo' | 'completado';
  motivo_consulta: string | null;
  resumen_caso: string | null;
  guia_abogado: string | null;
  transcripcion_chat: any;
  storage_path: string | null;
  created_at: string;
}

export interface Pago {
  id: string;
  usuario_id: string;
  caso_id: string;
  stripe_payment_intent_id: string;
  monto: number;
  moneda: string;
  estado: string;
  created_at: string;
}

export interface Profile {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  plan: string | null;
  nombre: string | null;
  apellido: string | null;
  stripe_customer_id: string | null;
}
