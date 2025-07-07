
export interface Especialidad {
  id: number;
  nombre: string;
}

export interface Profile {
  id: string;
  role: 'cliente' | 'abogado';
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  avatar_url?: string;
  stripe_customer_id?: string;
  acepta_politicas: boolean;
  acepta_comunicacion: boolean;
  tipo_perfil: 'individual' | 'empresa';
  razon_social?: string;
  nif_cif?: string;
  especialidades?: number[];
  creditos_disponibles: number;
  created_at: string;
}

export interface Caso {
  id: string;
  cliente_id: string;
  especialidad_id?: number;
  estado: 'borrador' | 'esperando_pago' | 'disponible' | 'agotado' | 'cerrado' | 'listo_para_propuesta';
  tipo_lead?: 'estandar' | 'premium' | 'urgente';
  motivo_consulta?: string;
  resumen_caso?: string;
  guia_abogado?: string;
  transcripcion_chat?: any;
  propuesta_estructurada?: any;
  canal_atencion: string;
  costo_en_creditos: number;
  compras_realizadas: number;
  limite_compras: number;
  fecha_ultimo_contacto?: string;
  tiene_notificaciones_nuevas?: boolean;
  created_at: string;
  especialidades?: {
    nombre: string;
  };
}

export interface CasoComprado {
  id: string;
  caso_id: string;
  abogado_id: string;
  fecha_compra: string;
  precio_compra_creditos: number;
}

export interface Pago {
  id: string;
  usuario_id: string;
  stripe_payment_intent_id: string;
  monto: number;
  moneda: string;
  estado: 'succeeded' | 'processing' | 'failed';
  descripcion: string;
  metadata_pago?: any;
  created_at: string;
}

export interface SuscripcionCliente {
  id: string;
  cliente_id: string;
  stripe_subscription_id: string;
  estado: 'active' | 'canceled' | 'past_due' | 'unpaid';
  limite_consultas_ciclo: number;
  consultas_usadas_ciclo: number;
  fecha_inicio_ciclo: string;
  fecha_fin_ciclo: string;
  fecha_cancelacion?: string;
  created_at: string;
}

export interface SuscripcionAbogado {
  id: string;
  abogado_id: string;
  stripe_subscription_id: string;
  estado: 'active' | 'canceled' | 'past_due' | 'unpaid';
  creditos_otorgados_ciclo: number;
  fecha_inicio_ciclo: string;
  fecha_fin_ciclo: string;
  fecha_cancelacion?: string;
  created_at: string;
}

export interface TransaccionCredito {
  id: string;
  abogado_id: string;
  tipo_transaccion: 'compra_paquete' | 'asignacion_suscripcion' | 'gasto_lead';
  cantidad: number;
  descripcion?: string;
  referencia_id?: string;
  saldo_anterior: number;
  saldo_posterior: number;
  created_at: string;
}

export interface Notificacion {
  id: string;
  usuario_id: string;
  mensaje: string;
  leida: boolean;
  url_destino?: string;
  created_at: string;
}
