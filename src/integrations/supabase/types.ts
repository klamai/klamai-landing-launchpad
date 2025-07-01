export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
          email_borrador: string | null
          especialidad_id: number | null
          estado: Database["public"]["Enums"]["caso_estado_enum"]
          guia_abogado: string | null
          id: string
          limite_compras: number
          motivo_consulta: string | null
          nif_cif_borrador: string | null
          nombre_borrador: string | null
          nombre_gerente_borrador: string | null
          preferencia_horaria_contacto: string | null
          razon_social_borrador: string | null
          resumen_caso: string | null
          telefono_borrador: string | null
          tipo_lead: Database["public"]["Enums"]["caso_tipo_lead_enum"] | null
          tipo_perfil_borrador:
            | Database["public"]["Enums"]["profile_type_enum"]
            | null
          transcripcion_chat: Json | null
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
          email_borrador?: string | null
          especialidad_id?: number | null
          estado?: Database["public"]["Enums"]["caso_estado_enum"]
          guia_abogado?: string | null
          id?: string
          limite_compras?: number
          motivo_consulta?: string | null
          nif_cif_borrador?: string | null
          nombre_borrador?: string | null
          nombre_gerente_borrador?: string | null
          preferencia_horaria_contacto?: string | null
          razon_social_borrador?: string | null
          resumen_caso?: string | null
          telefono_borrador?: string | null
          tipo_lead?: Database["public"]["Enums"]["caso_tipo_lead_enum"] | null
          tipo_perfil_borrador?:
            | Database["public"]["Enums"]["profile_type_enum"]
            | null
          transcripcion_chat?: Json | null
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
          email_borrador?: string | null
          especialidad_id?: number | null
          estado?: Database["public"]["Enums"]["caso_estado_enum"]
          guia_abogado?: string | null
          id?: string
          limite_compras?: number
          motivo_consulta?: string | null
          nif_cif_borrador?: string | null
          nombre_borrador?: string | null
          nombre_gerente_borrador?: string | null
          preferencia_horaria_contacto?: string | null
          razon_social_borrador?: string | null
          resumen_caso?: string | null
          telefono_borrador?: string | null
          tipo_lead?: Database["public"]["Enums"]["caso_tipo_lead_enum"] | null
          tipo_perfil_borrador?:
            | Database["public"]["Enums"]["profile_type_enum"]
            | null
          transcripcion_chat?: Json | null
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
          created_at: string | null
          creditos_disponibles: number
          email: string
          especialidades: number[] | null
          id: string
          nif_cif: string | null
          nombre: string
          razon_social: string | null
          role: Database["public"]["Enums"]["profile_role_enum"]
          stripe_customer_id: string | null
          telefono: string | null
          tipo_perfil: Database["public"]["Enums"]["profile_type_enum"]
        }
        Insert: {
          acepta_comunicacion?: boolean
          acepta_politicas?: boolean
          apellido: string
          avatar_url?: string | null
          created_at?: string | null
          creditos_disponibles?: number
          email: string
          especialidades?: number[] | null
          id: string
          nif_cif?: string | null
          nombre: string
          razon_social?: string | null
          role: Database["public"]["Enums"]["profile_role_enum"]
          stripe_customer_id?: string | null
          telefono?: string | null
          tipo_perfil?: Database["public"]["Enums"]["profile_type_enum"]
        }
        Update: {
          acepta_comunicacion?: boolean
          acepta_politicas?: boolean
          apellido?: string
          avatar_url?: string | null
          created_at?: string | null
          creditos_disponibles?: number
          email?: string
          especialidades?: number[] | null
          id?: string
          nif_cif?: string | null
          nombre?: string
          razon_social?: string | null
          role?: Database["public"]["Enums"]["profile_role_enum"]
          stripe_customer_id?: string | null
          telefono?: string | null
          tipo_perfil?: Database["public"]["Enums"]["profile_type_enum"]
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
      [_ in never]: never
    }
    Enums: {
      caso_estado_enum:
        | "borrador"
        | "esperando_pago"
        | "disponible"
        | "agotado"
        | "cerrado"
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      caso_estado_enum: [
        "borrador",
        "esperando_pago",
        "disponible",
        "agotado",
        "cerrado",
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
