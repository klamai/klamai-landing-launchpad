export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      asignaciones_casos: {
        Row: {
          abogado_id: string
          asignado_por: string | null
          caso_id: string
          created_at: string
          estado_asignacion: string | null
          fecha_asignacion: string
          id: string
          notas_asignacion: string | null
        }
        Insert: {
          abogado_id: string
          asignado_por?: string | null
          caso_id: string
          created_at?: string
          estado_asignacion?: string | null
          fecha_asignacion?: string
          id?: string
          notas_asignacion?: string | null
        }
        Update: {
          abogado_id?: string
          asignado_por?: string | null
          caso_id?: string
          created_at?: string
          estado_asignacion?: string | null
          fecha_asignacion?: string
          id?: string
          notas_asignacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_casos_abogado_id_fkey"
            columns: ["abogado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_casos_asignado_por_fkey"
            columns: ["asignado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_casos_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria_seguridad: {
        Row: {
          accion: string
          created_at: string
          datos_anteriores: Json | null
          datos_nuevos: Json | null
          id: string
          ip_address: unknown | null
          registro_id: string | null
          tabla_afectada: string
          user_agent: string | null
          usuario_id: string | null
        }
        Insert: {
          accion: string
          created_at?: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          id?: string
          ip_address?: unknown | null
          registro_id?: string | null
          tabla_afectada: string
          user_agent?: string | null
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          created_at?: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          id?: string
          ip_address?: unknown | null
          registro_id?: string | null
          tabla_afectada?: string
          user_agent?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      casos: {
        Row: {
          acepto_politicas_inicial: boolean | null
          apellido_borrador: string | null
          canal_atencion: string | null
          ciudad_borrador: string | null
          cliente_id: string | null
          compras_realizadas: number
          costo_en_creditos: number
          created_at: string | null
          direccion_fiscal_borrador: string | null
          documentos_adjuntos: Json | null
          email_borrador: string | null
          especialidad_id: number | null
          estado: Database["public"]["Enums"]["caso_estado_enum"]
          fecha_ultimo_contacto: string | null
          guia_abogado: string | null
          id: string
          limite_compras: number
          motivo_consulta: string | null
          nif_cif_borrador: string | null
          nombre_borrador: string | null
          nombre_gerente_borrador: string | null
          preferencia_horaria_contacto: string | null
          propuesta_cliente: string | null
          propuesta_estructurada: Json | null
          razon_social_borrador: string | null
          resumen_caso: string | null
          session_token: string | null
          telefono_borrador: string | null
          tiene_notificaciones_nuevas: boolean | null
          tipo_lead: Database["public"]["Enums"]["caso_tipo_lead_enum"] | null
          tipo_perfil_borrador:
            | Database["public"]["Enums"]["profile_type_enum"]
            | null
          transcripcion_chat: Json | null
          valor_estimado: string | null
        }
        Insert: {
          acepto_politicas_inicial?: boolean | null
          apellido_borrador?: string | null
          canal_atencion?: string | null
          ciudad_borrador?: string | null
          cliente_id?: string | null
          compras_realizadas?: number
          costo_en_creditos?: number
          created_at?: string | null
          direccion_fiscal_borrador?: string | null
          documentos_adjuntos?: Json | null
          email_borrador?: string | null
          especialidad_id?: number | null
          estado?: Database["public"]["Enums"]["caso_estado_enum"]
          fecha_ultimo_contacto?: string | null
          guia_abogado?: string | null
          id?: string
          limite_compras?: number
          motivo_consulta?: string | null
          nif_cif_borrador?: string | null
          nombre_borrador?: string | null
          nombre_gerente_borrador?: string | null
          preferencia_horaria_contacto?: string | null
          propuesta_cliente?: string | null
          propuesta_estructurada?: Json | null
          razon_social_borrador?: string | null
          resumen_caso?: string | null
          session_token?: string | null
          telefono_borrador?: string | null
          tiene_notificaciones_nuevas?: boolean | null
          tipo_lead?: Database["public"]["Enums"]["caso_tipo_lead_enum"] | null
          tipo_perfil_borrador?:
            | Database["public"]["Enums"]["profile_type_enum"]
            | null
          transcripcion_chat?: Json | null
          valor_estimado?: string | null
        }
        Update: {
          acepto_politicas_inicial?: boolean | null
          apellido_borrador?: string | null
          canal_atencion?: string | null
          ciudad_borrador?: string | null
          cliente_id?: string | null
          compras_realizadas?: number
          costo_en_creditos?: number
          created_at?: string | null
          direccion_fiscal_borrador?: string | null
          documentos_adjuntos?: Json | null
          email_borrador?: string | null
          especialidad_id?: number | null
          estado?: Database["public"]["Enums"]["caso_estado_enum"]
          fecha_ultimo_contacto?: string | null
          guia_abogado?: string | null
          id?: string
          limite_compras?: number
          motivo_consulta?: string | null
          nif_cif_borrador?: string | null
          nombre_borrador?: string | null
          nombre_gerente_borrador?: string | null
          preferencia_horaria_contacto?: string | null
          propuesta_cliente?: string | null
          propuesta_estructurada?: Json | null
          razon_social_borrador?: string | null
          resumen_caso?: string | null
          session_token?: string | null
          telefono_borrador?: string | null
          tiene_notificaciones_nuevas?: boolean | null
          tipo_lead?: Database["public"]["Enums"]["caso_tipo_lead_enum"] | null
          tipo_perfil_borrador?:
            | Database["public"]["Enums"]["profile_type_enum"]
            | null
          transcripcion_chat?: Json | null
          valor_estimado?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "casos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_especialidad_id_fkey"
            columns: ["especialidad_id"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["id"]
          },
        ]
      }
      casos_comprados: {
        Row: {
          abogado_id: string
          caso_id: string
          fecha_compra: string | null
          id: string
          precio_compra_creditos: number
        }
        Insert: {
          abogado_id: string
          caso_id: string
          fecha_compra?: string | null
          id?: string
          precio_compra_creditos: number
        }
        Update: {
          abogado_id?: string
          caso_id?: string
          fecha_compra?: string | null
          id?: string
          precio_compra_creditos?: number
        }
        Relationships: [
          {
            foreignKeyName: "casos_comprados_abogado_id_fkey"
            columns: ["abogado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_comprados_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_cliente: {
        Row: {
          caso_id: string
          cliente_id: string
          created_at: string
          descripcion: string | null
          fecha_subida: string
          id: string
          nombre_archivo: string
          ruta_archivo: string
          tamaño_archivo: number | null
          tipo_documento: string
        }
        Insert: {
          caso_id: string
          cliente_id: string
          created_at?: string
          descripcion?: string | null
          fecha_subida?: string
          id?: string
          nombre_archivo: string
          ruta_archivo: string
          tamaño_archivo?: number | null
          tipo_documento?: string
        }
        Update: {
          caso_id?: string
          cliente_id?: string
          created_at?: string
          descripcion?: string | null
          fecha_subida?: string
          id?: string
          nombre_archivo?: string
          ruta_archivo?: string
          tamaño_archivo?: number | null
          tipo_documento?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_cliente_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_resolucion: {
        Row: {
          abogado_id: string
          caso_id: string
          created_at: string
          descripcion: string | null
          es_version_final: boolean | null
          fecha_subida: string
          id: string
          nombre_archivo: string
          ruta_archivo: string
          tamaño_archivo: number | null
          tipo_documento: string
          version: number | null
        }
        Insert: {
          abogado_id: string
          caso_id: string
          created_at?: string
          descripcion?: string | null
          es_version_final?: boolean | null
          fecha_subida?: string
          id?: string
          nombre_archivo: string
          ruta_archivo: string
          tamaño_archivo?: number | null
          tipo_documento: string
          version?: number | null
        }
        Update: {
          abogado_id?: string
          caso_id?: string
          created_at?: string
          descripcion?: string | null
          es_version_final?: boolean | null
          fecha_subida?: string
          id?: string
          nombre_archivo?: string
          ruta_archivo?: string
          tamaño_archivo?: number | null
          tipo_documento?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_resolucion_abogado_id_fkey"
            columns: ["abogado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_resolucion_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
        ]
      }
      especialidades: {
        Row: {
          id: number
          nombre: string
        }
        Insert: {
          id?: number
          nombre: string
        }
        Update: {
          id?: number
          nombre?: string
        }
        Relationships: []
      }
      notificaciones: {
        Row: {
          created_at: string
          id: string
          leida: boolean
          mensaje: string
          url_destino: string | null
          usuario_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          leida?: boolean
          mensaje: string
          url_destino?: string | null
          usuario_id: string
        }
        Update: {
          created_at?: string
          id?: string
          leida?: boolean
          mensaje?: string
          url_destino?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          created_at: string | null
          descripcion: string
          estado: Database["public"]["Enums"]["pago_estado_enum"]
          id: string
          metadata_pago: Json | null
          moneda: string
          monto: number
          stripe_payment_intent_id: string
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          descripcion: string
          estado: Database["public"]["Enums"]["pago_estado_enum"]
          id?: string
          metadata_pago?: Json | null
          moneda?: string
          monto: number
          stripe_payment_intent_id: string
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          descripcion?: string
          estado?: Database["public"]["Enums"]["pago_estado_enum"]
          id?: string
          metadata_pago?: Json | null
          moneda?: string
          monto?: number
          stripe_payment_intent_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          acepta_comunicacion: boolean
          acepta_politicas: boolean
          apellido: string
          avatar_url: string | null
          ciudad: string | null
          created_at: string | null
          creditos_disponibles: number
          direccion_fiscal: string | null
          email: string
          especialidades: number[] | null
          id: string
          nif_cif: string | null
          nombre: string
          nombre_gerente: string | null
          razon_social: string | null
          role: Database["public"]["Enums"]["profile_role_enum"]
          stripe_customer_id: string | null
          telefono: string | null
          tipo_abogado: Database["public"]["Enums"]["abogado_tipo_enum"] | null
          tipo_perfil: Database["public"]["Enums"]["profile_type_enum"]
        }
        Insert: {
          acepta_comunicacion?: boolean
          acepta_politicas?: boolean
          apellido: string
          avatar_url?: string | null
          ciudad?: string | null
          created_at?: string | null
          creditos_disponibles?: number
          direccion_fiscal?: string | null
          email: string
          especialidades?: number[] | null
          id: string
          nif_cif?: string | null
          nombre: string
          nombre_gerente?: string | null
          razon_social?: string | null
          role: Database["public"]["Enums"]["profile_role_enum"]
          stripe_customer_id?: string | null
          telefono?: string | null
          tipo_abogado?: Database["public"]["Enums"]["abogado_tipo_enum"] | null
          tipo_perfil?: Database["public"]["Enums"]["profile_type_enum"]
        }
        Update: {
          acepta_comunicacion?: boolean
          acepta_politicas?: boolean
          apellido?: string
          avatar_url?: string | null
          ciudad?: string | null
          created_at?: string | null
          creditos_disponibles?: number
          direccion_fiscal?: string | null
          email?: string
          especialidades?: number[] | null
          id?: string
          nif_cif?: string | null
          nombre?: string
          nombre_gerente?: string | null
          razon_social?: string | null
          role?: Database["public"]["Enums"]["profile_role_enum"]
          stripe_customer_id?: string | null
          telefono?: string | null
          tipo_abogado?: Database["public"]["Enums"]["abogado_tipo_enum"] | null
          tipo_perfil?: Database["public"]["Enums"]["profile_type_enum"]
        }
        Relationships: []
      }
      solicitudes_abogado: {
        Row: {
          acepta_comunicacion: boolean
          acepta_politicas: boolean
          apellido: string
          carta_motivacion: string | null
          colegio_profesional: string | null
          created_at: string
          cv_url: string | null
          documentos_verificacion: Json | null
          email: string
          especialidades: number[] | null
          estado: string
          experiencia_anos: number | null
          fecha_revision: string | null
          id: string
          motivo_rechazo: string | null
          nombre: string
          notas_admin: string | null
          numero_colegiado: string | null
          revisado_por: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          acepta_comunicacion?: boolean
          acepta_politicas?: boolean
          apellido: string
          carta_motivacion?: string | null
          colegio_profesional?: string | null
          created_at?: string
          cv_url?: string | null
          documentos_verificacion?: Json | null
          email: string
          especialidades?: number[] | null
          estado?: string
          experiencia_anos?: number | null
          fecha_revision?: string | null
          id?: string
          motivo_rechazo?: string | null
          nombre: string
          notas_admin?: string | null
          numero_colegiado?: string | null
          revisado_por?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          acepta_comunicacion?: boolean
          acepta_politicas?: boolean
          apellido?: string
          carta_motivacion?: string | null
          colegio_profesional?: string | null
          created_at?: string
          cv_url?: string | null
          documentos_verificacion?: Json | null
          email?: string
          especialidades?: number[] | null
          estado?: string
          experiencia_anos?: number | null
          fecha_revision?: string | null
          id?: string
          motivo_rechazo?: string | null
          nombre?: string
          notas_admin?: string | null
          numero_colegiado?: string | null
          revisado_por?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_abogado_revisado_por_fkey"
            columns: ["revisado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          created_at: string | null
          data: Json
          error_message: string | null
          event_type: string
          id: string
          processed: boolean | null
          processed_at: string | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          error_message?: string | null
          event_type: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          error_message?: string | null
          event_type?: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id?: string
        }
        Relationships: []
      }
      suscripciones_abogados: {
        Row: {
          abogado_id: string
          created_at: string | null
          creditos_otorgados_ciclo: number
          estado: Database["public"]["Enums"]["suscripcion_estado_enum"]
          fecha_cancelacion: string | null
          fecha_fin_ciclo: string
          fecha_inicio_ciclo: string
          id: string
          stripe_subscription_id: string
        }
        Insert: {
          abogado_id: string
          created_at?: string | null
          creditos_otorgados_ciclo: number
          estado: Database["public"]["Enums"]["suscripcion_estado_enum"]
          fecha_cancelacion?: string | null
          fecha_fin_ciclo: string
          fecha_inicio_ciclo: string
          id?: string
          stripe_subscription_id: string
        }
        Update: {
          abogado_id?: string
          created_at?: string | null
          creditos_otorgados_ciclo?: number
          estado?: Database["public"]["Enums"]["suscripcion_estado_enum"]
          fecha_cancelacion?: string | null
          fecha_fin_ciclo?: string
          fecha_inicio_ciclo?: string
          id?: string
          stripe_subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_abogados_abogado_id_fkey"
            columns: ["abogado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suscripciones_clientes: {
        Row: {
          cliente_id: string
          consultas_usadas_ciclo: number
          created_at: string | null
          estado: Database["public"]["Enums"]["suscripcion_estado_enum"]
          fecha_cancelacion: string | null
          fecha_fin_ciclo: string
          fecha_inicio_ciclo: string
          id: string
          limite_consultas_ciclo: number
          stripe_subscription_id: string
        }
        Insert: {
          cliente_id: string
          consultas_usadas_ciclo?: number
          created_at?: string | null
          estado: Database["public"]["Enums"]["suscripcion_estado_enum"]
          fecha_cancelacion?: string | null
          fecha_fin_ciclo: string
          fecha_inicio_ciclo: string
          id?: string
          limite_consultas_ciclo: number
          stripe_subscription_id: string
        }
        Update: {
          cliente_id?: string
          consultas_usadas_ciclo?: number
          created_at?: string | null
          estado?: Database["public"]["Enums"]["suscripcion_estado_enum"]
          fecha_cancelacion?: string | null
          fecha_fin_ciclo?: string
          fecha_inicio_ciclo?: string
          id?: string
          limite_consultas_ciclo?: number
          stripe_subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_clientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transacciones_creditos: {
        Row: {
          abogado_id: string
          cantidad: number
          created_at: string | null
          descripcion: string | null
          id: string
          referencia_id: string | null
          saldo_anterior: number
          saldo_posterior: number
          tipo_transaccion: Database["public"]["Enums"]["transaccion_credito_tipo_enum"]
        }
        Insert: {
          abogado_id: string
          cantidad: number
          created_at?: string | null
          descripcion?: string | null
          id?: string
          referencia_id?: string | null
          saldo_anterior: number
          saldo_posterior: number
          tipo_transaccion: Database["public"]["Enums"]["transaccion_credito_tipo_enum"]
        }
        Update: {
          abogado_id?: string
          cantidad?: number
          created_at?: string | null
          descripcion?: string | null
          id?: string
          referencia_id?: string | null
          saldo_anterior?: number
          saldo_posterior?: number
          tipo_transaccion?: Database["public"]["Enums"]["transaccion_credito_tipo_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "transacciones_creditos_abogado_id_fkey"
            columns: ["abogado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aprobar_solicitud_abogado: {
        Args: { p_solicitud_id: string; p_notas_admin?: string }
        Returns: boolean
      }
      assign_anonymous_case_to_user: {
        Args: { p_caso_id: string; p_session_token: string; p_user_id: string }
        Returns: boolean
      }
      assign_case_to_lawyer: {
        Args: { p_caso_id: string; p_abogado_id: string; p_notas?: string }
        Returns: boolean
      }
      can_access_case: {
        Args: { p_caso_id: string }
        Returns: boolean
      }
      cleanup_expired_anonymous_cases: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      crear_abogado_desde_solicitud: {
        Args: {
          p_solicitud_id: string
          p_password: string
          p_tipo_abogado?: Database["public"]["Enums"]["abogado_tipo_enum"]
        }
        Returns: string
      }
      get_current_user_lawyer_type: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      rechazar_solicitud_abogado: {
        Args: {
          p_solicitud_id: string
          p_motivo_rechazo: string
          p_notas_admin?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      abogado_tipo_enum: "super_admin" | "regular"
      caso_estado_enum:
        | "borrador"
        | "esperando_pago"
        | "disponible"
        | "agotado"
        | "cerrado"
        | "listo_para_propuesta"
      caso_tipo_lead_enum: "estandar" | "premium" | "urgente"
      pago_estado_enum: "succeeded" | "processing" | "failed"
      profile_role_enum: "cliente" | "abogado"
      profile_type_enum: "individual" | "empresa"
      suscripcion_estado_enum: "active" | "canceled" | "past_due" | "unpaid"
      transaccion_credito_tipo_enum:
        | "compra_paquete"
        | "asignacion_suscripcion"
        | "gasto_lead"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      abogado_tipo_enum: ["super_admin", "regular"],
      caso_estado_enum: [
        "borrador",
        "esperando_pago",
        "disponible",
        "agotado",
        "cerrado",
        "listo_para_propuesta",
      ],
      caso_tipo_lead_enum: ["estandar", "premium", "urgente"],
      pago_estado_enum: ["succeeded", "processing", "failed"],
      profile_role_enum: ["cliente", "abogado"],
      profile_type_enum: ["individual", "empresa"],
      suscripcion_estado_enum: ["active", "canceled", "past_due", "unpaid"],
      transaccion_credito_tipo_enum: [
        "compra_paquete",
        "asignacion_suscripcion",
        "gasto_lead",
      ],
    },
  },
} as const
