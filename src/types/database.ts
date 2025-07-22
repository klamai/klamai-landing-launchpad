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
  tipo_abogado?: 'super_admin' | 'regular';
  created_at: string;
}

export interface SolicitudAbogado {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  colegio_profesional?: string;
  numero_colegiado?: string;
  especialidades?: number[];
  experiencia_anos?: number;
  cv_url?: string;
  carta_motivacion?: string;
  documentos_verificacion?: any;
  estado: 'pendiente' | 'en_revision' | 'aprobada' | 'rechazada';
  motivo_rechazo?: string;
  revisado_por?: string;
  fecha_revision?: string;
  notas_admin?: string;
  acepta_politicas: boolean;
  acepta_comunicacion: boolean;
  created_at: string;
  updated_at: string;
}

export interface Caso {
  id: string;
  cliente_id: string | null;
  especialidad_id: number | null;
  estado: 'borrador' | 'esperando_pago' | 'disponible' | 'agotado' | 'cerrado' | 'listo_para_propuesta';
  tipo_lead: 'estandar' | 'premium' | 'urgente' | null;
  motivo_consulta: string | null;
  resumen_caso: string | null;
  guia_abogado: string | null;
  transcripcion_chat: any;
  propuesta_estructurada: any;
  propuesta_cliente: string | null;
  valor_estimado: string | null;
  canal_atencion: string;
  costo_en_creditos: number;
  compras_realizadas: number;
  limite_compras: number;
  fecha_ultimo_contacto: string | null;
  tiene_notificaciones_nuevas: boolean | null;
  acepto_politicas_inicial: boolean | null;
  tipo_perfil_borrador: 'individual' | 'empresa' | null;
  nombre_borrador: string | null;
  apellido_borrador: string | null;
  email_borrador: string | null;
  telefono_borrador: string | null;
  ciudad_borrador: string | null;
  razon_social_borrador: string | null;
  nif_cif_borrador: string | null;
  direccion_fiscal_borrador: string | null;
  nombre_gerente_borrador: string | null;
  preferencia_horaria_contacto: string | null;
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

export interface AsignacionCaso {
  id: string;
  caso_id: string;
  abogado_id: string;
  asignado_por?: string;
  fecha_asignacion: string;
  estado_asignacion: 'activa' | 'completada' | 'cancelada';
  notas_asignacion?: string;
  created_at: string;
}

export interface DocumentoResolucion {
  id: string;
  caso_id: string;
  abogado_id: string;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_documento: string;
  tamaño_archivo?: number;
  descripcion?: string;
  fecha_subida: string;
  version: number;
  es_version_final: boolean;
  created_at: string;
}

export interface DocumentoCliente {
  id: string;
  caso_id: string;
  cliente_id: string;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_documento: string;
  tamaño_archivo?: number;
  descripcion?: string;
  fecha_subida: string;
  created_at: string;
}
