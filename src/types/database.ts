export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
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
          canal_atencion: Database["public"]["Enums"]["canal_atencion_enum"] | null
          cerrado_por: string | null
          chat_finalizado_at: string | null
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
          etapa: Database["public"]["Enums"]["etapa_kanban_enum"]
          fecha_cierre: string | null
          fecha_pago: string | null
          fecha_ultimo_contacto: string | null
          guia_abogado: string | null
          hoja_encargo_token: string | null
          id: string
          limite_compras: number
          motivo_consulta: string | null
          nif_cif_borrador: string | null
          nombre_borrador: string | null
          nombre_gerente_borrador: string | null
          preferencia_horaria_contacto: string | null
          presupuesto_enviado_at: string | null
          presupuesto_metodo: string | null
          propuesta_cliente: string | null
          propuesta_enviada_at: string | null
          propuesta_estructurada: Json | null
          razon_social_borrador: string | null
          resumen_caso: string | null
          session_token: string | null
          solicitud_presupuesto_whatsapp: boolean | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          telefono_borrador: string | null
          tiene_notificaciones_nuevas: boolean | null
          tipo_lead: Database["public"]["Enums"]["caso_tipo_lead_enum"] | null
          tipo_perfil_borrador:
            | Database["public"]["Enums"]["profile_type_enum"]
            | null
          token_reclamacion_pago: string | null
          transcripcion_chat: Json | null
          updated_at: string | null
          valor_estimado: string | null
        }
        Insert: {
          acepto_politicas_inicial?: boolean | null
          apellido_borrador?: string | null
          canal_atencion?: string | null
          cerrado_por?: string | null
          chat_finalizado_at?: string | null
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
          etapa?: Database["public"]["Enums"]["etapa_kanban_enum"]
          fecha_cierre?: string | null
          fecha_pago?: string | null
          fecha_ultimo_contacto?: string | null
          guia_abogado?: string | null
          hoja_encargo_token?: string | null
          id?: string
          limite_compras?: number
          motivo_consulta?: string | null
          nif_cif_borrador?: string | null
          nombre_borrador?: string | null
          nombre_gerente_borrador?: string | null
          preferencia_horaria_contacto?: string | null
          presupuesto_enviado_at?: string | null
          presupuesto_metodo?: string | null
          propuesta_cliente?: string | null
          propuesta_enviada_at?: string | null
          propuesta_estructurada?: Json | null
          razon_social_borrador?: string | null
          resumen_caso?: string | null
          session_token?: string | null
          solicitud_presupuesto_whatsapp?: boolean | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          telefono_borrador?: string | null
          tiene_notificaciones_nuevas?: boolean | null
          tipo_lead?: Database["public"]["Enums"]["caso_tipo_lead_enum"] | null
          tipo_perfil_borrador?:
            | Database["public"]["Enums"]["profile_type_enum"]
            | null
          token_reclamacion_pago?: string | null
          transcripcion_chat?: Json | null
          updated_at?: string | null
          valor_estimado?: string | null
        }
        Update: {
          acepto_politicas_inicial?: boolean | null
          apellido_borrador?: string | null
          canal_atencion?: string | null
          cerrado_por?: string | null
          chat_finalizado_at?: string | null
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
          etapa?: Database["public"]["Enums"]["etapa_kanban_enum"]
          fecha_cierre?: string | null
          fecha_pago?: string | null
          fecha_ultimo_contacto?: string | null
          guia_abogado?: string | null
          hoja_encargo_token?: string | null
          id?: string
          limite_compras?: number
          motivo_consulta?: string | null
          nif_cif_borrador?: string | null
          nombre_borrador?: string | null
          nombre_gerente_borrador?: string | null
          preferencia_horaria_contacto?: string | null
          presupuesto_enviado_at?: string | null
          presupuesto_metodo?: string | null
          propuesta_cliente?: string | null
          propuesta_enviada_at?: string | null
          propuesta_estructurada?: Json | null
          razon_social_borrador?: string | null
          resumen_caso?: string | null
          session_token?: string | null
          solicitud_presupuesto_whatsapp?: boolean | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          telefono_borrador?: string | null
          tiene_notificaciones_nuevas?: boolean | null
          tipo_lead?: Database["public"]["Enums"]["caso_tipo_lead_enum"] | null
          tipo_perfil_borrador?:
            | Database["public"]["Enums"]["profile_type_enum"]
            | null
          token_reclamacion_pago?: string | null
          transcripcion_chat?: Json | null
          updated_at?: string | null
          valor_estimado?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "casos_cerrado_por_fkey"
            columns: ["cerrado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      client_activation_tokens: {
        Row: {
          caso_id: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          max_resends: number | null
          resend_count: number | null
          token: string
          updated_at: string | null
          used_at: string | null
        }
        Insert: {
          caso_id: string
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          max_resends?: number | null
          resend_count?: number | null
          token: string
          updated_at?: string | null
          used_at?: string | null
        }
        Update: {
          caso_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          max_resends?: number | null
          resend_count?: number | null
          token?: string
          updated_at?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_activation_tokens_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
        ]
      }
      comunicaciones: {
        Row: {
          canal: string
          caso_id: string | null
          cuerpo: string
          destinatario_numero: string
          enviado_at: string | null
          error: string | null
          estado: string
          id: string
          media_url: string | null
          tipo: string
        }
        Insert: {
          canal: string
          caso_id?: string | null
          cuerpo: string
          destinatario_numero: string
          enviado_at?: string | null
          error?: string | null
          estado?: string
          id?: string
          media_url?: string | null
          tipo: string
        }
        Update: {
          canal?: string
          caso_id?: string | null
          cuerpo?: string
          destinatario_numero?: string
          enviado_at?: string | null
          error?: string | null
          estado?: string
          id?: string
          media_url?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunicaciones_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_logs: {
        Row: {
          accepted_marketing: boolean | null
          accepted_privacy: boolean | null
          accepted_terms: boolean | null
          caso_id: string | null
          consent_type: string
          cookies_policy_version: number | null
          created_at: string
          id: string
          ip: string | null
          policy_privacy_version: number | null
          policy_terms_version: number | null
          proposal_token: string | null
          solicitud_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accepted_marketing?: boolean | null
          accepted_privacy?: boolean | null
          accepted_terms?: boolean | null
          caso_id?: string | null
          consent_type: string
          cookies_policy_version?: number | null
          created_at?: string
          id?: string
          ip?: string | null
          policy_privacy_version?: number | null
          policy_terms_version?: number | null
          proposal_token?: string | null
          solicitud_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_marketing?: boolean | null
          accepted_privacy?: boolean | null
          accepted_terms?: boolean | null
          caso_id?: string | null
          consent_type?: string
          cookies_policy_version?: number | null
          created_at?: string
          id?: string
          ip?: string | null
          policy_privacy_version?: number | null
          policy_terms_version?: number | null
          proposal_token?: string | null
          solicitud_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_logs_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_solicitud_id"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_abogado"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_cliente: {
        Row: {
          caso_id: string
          cliente_id: string | null
          created_at: string
          descripcion: string | null
          fecha_subida: string
          id: string
          nombre_archivo: string
          ruta_archivo: string
          subido_por_abogado_id: string | null
          tamaño_archivo: number | null
          tipo_documento: string
        }
        Insert: {
          caso_id: string
          cliente_id?: string | null
          created_at?: string
          descripcion?: string | null
          fecha_subida?: string
          id?: string
          nombre_archivo: string
          ruta_archivo: string
          subido_por_abogado_id?: string | null
          tamaño_archivo?: number | null
          tipo_documento?: string
        }
        Update: {
          caso_id?: string
          cliente_id?: string | null
          created_at?: string
          descripcion?: string | null
          fecha_subida?: string
          id?: string
          nombre_archivo?: string
          ruta_archivo?: string
          subido_por_abogado_id?: string | null
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
          {
            foreignKeyName: "fk_subido_por_abogado"
            columns: ["subido_por_abogado_id"]
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
      hojas_encargo: {
        Row: {
          abogado_id: string | null
          caso_id: string | null
          contenido: string
          contenido_original: string | null
          estado: string | null
          fecha_creacion: string | null
          fecha_firma: string | null
          fecha_modificacion: string | null
          id: string
          id_dokusign: string | null
          metadata: Json | null
          titulo: string
          url_dokusign: string | null
          version: number | null
        }
        Insert: {
          abogado_id?: string | null
          caso_id?: string | null
          contenido: string
          contenido_original?: string | null
          estado?: string | null
          fecha_creacion?: string | null
          fecha_firma?: string | null
          fecha_modificacion?: string | null
          id?: string
          id_dokusign?: string | null
          metadata?: Json | null
          titulo: string
          url_dokusign?: string | null
          version?: number | null
        }
        Update: {
          abogado_id?: string | null
          caso_id?: string | null
          contenido?: string
          contenido_original?: string | null
          estado?: string | null
          fecha_creacion?: string | null
          fecha_firma?: string | null
          fecha_modificacion?: string | null
          id?: string
          id_dokusign?: string | null
          metadata?: Json | null
          titulo?: string
          url_dokusign?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hojas_encargo_abogado_id_fkey"
            columns: ["abogado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hojas_encargo_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
        ]
      }
      invitaciones_clientes: {
        Row: {
          caso_id: string
          created_at: string | null
          expires_at: string
          id: string
          profile_id: string
          token: string
          used: boolean | null
          used_at: string | null
        }
        Insert: {
          caso_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          profile_id: string
          token: string
          used?: boolean | null
          used_at?: string | null
        }
        Update: {
          caso_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          profile_id?: string
          token?: string
          used?: boolean | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitaciones_clientes_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitaciones_clientes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_activation_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          solicitud_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          solicitud_id: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          solicitud_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_activation_tokens_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_abogado"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_caso: {
        Row: {
          autor_id: string | null
          autor_rol: string
          caso_id: string | null
          contenido: string
          created_at: string
          destinatario: string
          id: string
        }
        Insert: {
          autor_id?: string | null
          autor_rol: string
          caso_id?: string | null
          contenido: string
          created_at?: string
          destinatario: string
          id?: string
        }
        Update: {
          autor_id?: string | null
          autor_rol?: string
          caso_id?: string | null
          contenido?: string
          created_at?: string
          destinatario?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_caso_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_caso_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          caso_id: string | null
          created_at: string
          id: string
          leida: boolean
          mensaje: string
          url_destino: string | null
          usuario_id: string
        }
        Insert: {
          caso_id?: string | null
          created_at?: string
          id?: string
          leida?: boolean
          mensaje: string
          url_destino?: string | null
          usuario_id: string
        }
        Update: {
          caso_id?: string | null
          created_at?: string
          id?: string
          leida?: boolean
          mensaje?: string
          url_destino?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
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
          caso_id: string | null
          comision: number | null
          concepto: string | null
          created_at: string | null
          descripcion: string
          estado: Database["public"]["Enums"]["pago_estado_enum"]
          exencion_motivo: string | null
          exento: boolean | null
          id: string
          iva_monto: number | null
          iva_tipo: number | null
          metadata_pago: Json | null
          moneda: string
          monto: number
          monto_base: number | null
          monto_neto: number | null
          monto_total: number | null
          payout_at: string | null
          payout_reference: string | null
          payout_status: string | null
          solicitado_por: string | null
          solicitante_rol: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          tipo_cobro: string | null
          usuario_id: string
        }
        Insert: {
          caso_id?: string | null
          comision?: number | null
          concepto?: string | null
          created_at?: string | null
          descripcion: string
          estado: Database["public"]["Enums"]["pago_estado_enum"]
          exencion_motivo?: string | null
          exento?: boolean | null
          id?: string
          iva_monto?: number | null
          iva_tipo?: number | null
          metadata_pago?: Json | null
          moneda?: string
          monto: number
          monto_base?: number | null
          monto_neto?: number | null
          monto_total?: number | null
          payout_at?: string | null
          payout_reference?: string | null
          payout_status?: string | null
          solicitado_por?: string | null
          solicitante_rol?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tipo_cobro?: string | null
          usuario_id: string
        }
        Update: {
          caso_id?: string | null
          comision?: number | null
          concepto?: string | null
          created_at?: string | null
          descripcion?: string
          estado?: Database["public"]["Enums"]["pago_estado_enum"]
          exencion_motivo?: string | null
          exento?: boolean | null
          id?: string
          iva_monto?: number | null
          iva_tipo?: number | null
          metadata_pago?: Json | null
          moneda?: string
          monto?: number
          monto_base?: number | null
          monto_neto?: number | null
          monto_total?: number | null
          payout_at?: string | null
          payout_reference?: string | null
          payout_status?: string | null
          solicitado_por?: string | null
          solicitante_rol?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tipo_cobro?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pagos_solicitado_por_profiles"
            columns: ["solicitado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: unknown | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: unknown | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: unknown | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          acepta_comunicacion: boolean
          acepta_politicas: boolean
          apellido: string
          avatar_url: string | null
          carta_motivacion: string | null
          ciudad: string | null
          colegio_profesional: string | null
          created_at: string | null
          creditos_disponibles: number
          cv_url: string | null
          direccion_fiscal: string | null
          documentos_verificacion: Json | null
          email: string
          especialidades: number[] | null
          experiencia_anos: number | null
          id: string
          nif_cif: string | null
          nombre: string
          nombre_gerente: string | null
          numero_colegiado: string | null
          politicas_aceptadas_at: string | null
          politicas_version: number | null
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
          carta_motivacion?: string | null
          ciudad?: string | null
          colegio_profesional?: string | null
          created_at?: string | null
          creditos_disponibles?: number
          cv_url?: string | null
          direccion_fiscal?: string | null
          documentos_verificacion?: Json | null
          email: string
          especialidades?: number[] | null
          experiencia_anos?: number | null
          id: string
          nif_cif?: string | null
          nombre: string
          nombre_gerente?: string | null
          numero_colegiado?: string | null
          politicas_aceptadas_at?: string | null
          politicas_version?: number | null
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
          carta_motivacion?: string | null
          ciudad?: string | null
          colegio_profesional?: string | null
          created_at?: string | null
          creditos_disponibles?: number
          cv_url?: string | null
          direccion_fiscal?: string | null
          documentos_verificacion?: Json | null
          email?: string
          especialidades?: number[] | null
          experiencia_anos?: number | null
          id?: string
          nif_cif?: string | null
          nombre?: string
          nombre_gerente?: string | null
          numero_colegiado?: string | null
          politicas_aceptadas_at?: string | null
          politicas_version?: number | null
          razon_social?: string | null
          role?: Database["public"]["Enums"]["profile_role_enum"]
          stripe_customer_id?: string | null
          telefono?: string | null
          tipo_abogado?: Database["public"]["Enums"]["abogado_tipo_enum"] | null
          tipo_perfil?: Database["public"]["Enums"]["profile_type_enum"]
        }
        Relationships: []
      }
      proposal_tokens: {
        Row: {
          caso_id: string
          created_at: string
          expires_at: string
          revoked: boolean
          token: string
        }
        Insert: {
          caso_id: string
          created_at?: string
          expires_at: string
          revoked?: boolean
          token: string
        }
        Update: {
          caso_id?: string
          created_at?: string
          expires_at?: string
          revoked?: boolean
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_tokens_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
        ]
      }
      propuestas: {
        Row: {
          assistant_message: string | null
          caso_id: string
          content: Json | null
          created_at: string
          created_by: string | null
          id: string
          rendered_html: string | null
          sent_at: string | null
          sent_to_email: string | null
          sent_via: string | null
          version: number
        }
        Insert: {
          assistant_message?: string | null
          caso_id: string
          content?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          rendered_html?: string | null
          sent_at?: string | null
          sent_to_email?: string | null
          sent_via?: string | null
          version?: number
        }
        Update: {
          assistant_message?: string | null
          caso_id?: string
          content?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          rendered_html?: string | null
          sent_at?: string | null
          sent_to_email?: string | null
          sent_via?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "propuestas_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
        ]
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
          amount_total_cents: number | null
          caso_id: string | null
          created_at: string | null
          currency: string | null
          data: Json | null
          data_sanitizada: Json | null
          error_message: string | null
          event_type: string
          id: string
          price_id: string | null
          processed: boolean | null
          processed_at: string | null
          product_id: string | null
          stripe_event_id: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_total_cents?: number | null
          caso_id?: string | null
          created_at?: string | null
          currency?: string | null
          data?: Json | null
          data_sanitizada?: Json | null
          error_message?: string | null
          event_type: string
          id?: string
          price_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          product_id?: string | null
          stripe_event_id: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_total_cents?: number | null
          caso_id?: string | null
          created_at?: string | null
          currency?: string | null
          data?: Json | null
          data_sanitizada?: Json | null
          error_message?: string | null
          event_type?: string
          id?: string
          price_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          product_id?: string | null
          stripe_event_id?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_webhook_events_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
        ]
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
      activate_lawyer_account: {
        Args: { p_auth_user_id: string; p_token: string }
        Returns: Json
      }
      actualizar_etapa_caso: {
        Args:
          | {
              p_caso_id: string
              p_nueva_etapa: Database["public"]["Enums"]["etapa_kanban_enum"]
            }
          | { p_caso_id: string; p_nueva_etapa: string }
        Returns: undefined
      }
      aprobar_solicitud_abogado: {
        Args: { p_notas_admin?: string; p_solicitud_id: string }
        Returns: boolean
      }
      aprobar_solicitud_abogado_automatizado: {
        Args: { p_notas_admin?: string; p_solicitud_id: string }
        Returns: Json
      }
      assign_anonymous_case_to_user: {
        Args: { p_caso_id: string; p_session_token: string; p_user_id: string }
        Returns: boolean
      }
      assign_case_to_lawyer: {
        Args: { p_abogado_id: string; p_caso_id: string; p_notas?: string }
        Returns: boolean
      }
      can_access_case: {
        Args: { p_caso_id: string }
        Returns: boolean
      }
      check_password_reset_rate_limit: {
        Args: { p_email: string; p_ip_address?: unknown }
        Returns: boolean
      }
      cleanup_expired_activation_tokens: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_anonymous_cases: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_client_tokens: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      crear_abogado_desde_solicitud: {
        Args: {
          p_password: string
          p_solicitud_id: string
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
      get_proposal_by_token: {
        Args: { p_token: string }
        Returns: {
          analysis_md: string
          assistant_message: string
          caso_id: string
        }[]
      }
      is_super_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      limpiar_invitaciones_expiradas: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      link_case_by_proposal_token: {
        Args: { p_token: string }
        Returns: string
      }
      log_password_reset_attempt: {
        Args: {
          p_email: string
          p_ip_address?: unknown
          p_success?: boolean
          p_user_agent?: string
        }
        Returns: string
      }
      procesar_whatsapp_presupuesto_pendiente: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      rechazar_solicitud_abogado: {
        Args: {
          p_motivo_rechazo: string
          p_notas_admin?: string
          p_solicitud_id: string
        }
        Returns: boolean
      }
      set_caso_listo_para_presupuesto: {
        Args: { p_caso_id: string }
        Returns: undefined
      }
      set_caso_listo_para_propuesta: {
        Args: { p_caso_id: string }
        Returns: boolean
      }
    }
    Enums: {
      abogado_tipo_enum: "super_admin" | "regular"
      canal_atencion_enum: "web_vito" | "chat_abg" | "manual_admin"
      caso_estado_enum:
        | "borrador"
        | "esperando_pago"
        | "disponible"
        | "asignado"
        | "agotado"
        | "cerrado"
        | "listo_para_propuesta"
        | "propuesta_enviada"
        | "oportunidad"
        | "pago_realizado_pendiente_registro"
        | "listo_para_presupuesto"
        | "presupuesto_enviado_whatsapp"
        | "presupuesto_enviado_email"
        | "presupuesto_enviado_ambos"
      caso_tipo_lead_enum: "estandar" | "premium" | "urgente"
      etapa_kanban_enum:
        | "bandeja_entrada"
        | "en_analisis"
        | "esperando_cliente"
        | "en_preparacion"
        | "en_proceso"
        | "finalizado"
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
      canal_atencion_enum: ["web_vito", "chat_abg", "manual_admin"],
      caso_estado_enum: [
        "borrador",
        "esperando_pago",
        "disponible",
        "asignado",
        "agotado",
        "cerrado",
        "listo_para_propuesta",
        "propuesta_enviada",
        "oportunidad",
        "pago_realizado_pendiente_registro",
        "listo_para_presupuesto",
        "presupuesto_enviado_whatsapp",
        "presupuesto_enviado_email",
        "presupuesto_enviado_ambos",
      ],
      caso_tipo_lead_enum: ["estandar", "premium", "urgente"],
      etapa_kanban_enum: [
        "bandeja_entrada",
        "en_analisis",
        "esperando_cliente",
        "en_preparacion",
        "en_proceso",
        "finalizado",
      ],
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
