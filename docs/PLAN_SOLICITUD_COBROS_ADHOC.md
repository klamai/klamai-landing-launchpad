## Plan de Solicitud de Cobros Ad-hoc (Stripe) — KlamAI

### 1) Objetivo
- Habilitar a superadmins y abogados regulares a solicitar pagos ad-hoc a clientes, con concepto e importe personalizado, generando un enlace de pago de Stripe y registrando el cobro en el caso del cliente.
- Calcular IVA (ES) por defecto al 21% con opciones de exención, y aplicar comisión de plataforma cuando el solicitante sea un abogado regular.

### 2) Alcance
- Fase 1 (sin Stripe Connect): cobros se ingresan a la cuenta de plataforma. Las comisiones se contabilizan en BD; liquidaciones al abogado se gestionan fuera de Stripe (proceso contable/financiero posterior).
- Fase 2 (opcional, Stripe Connect Express): onboarding de abogados y uso de `application_fee_amount` + `transfer_data.destination` para liquidación automática.

### 3) Diseño funcional
- Roles autorizados para solicitar cobros:
  - Superadmin: puede solicitar cobros sobre cualquier caso.
  - Abogado regular: puede solicitar cobros solo para casos que tenga asignados y activos.
- Flujo alto nivel:
  1. Usuario (superadmin/abogado regular) abre modal “Solicitar pago”.
  2. Introduce Concepto y Monto base (€). Selecciona si aplica una exención (ver IVA).
  3. Vista previa: base, IVA (21% u 0%), total; etiqueta de comisión si el solicitante es abogado regular.
  4. Se invoca función Edge `crear-cobro` → se crea `pagos` en estado `pending` y una Checkout Session con `price_data` (sin usar price predefinido), se guarda `stripe_session_id` y se retorna `url`.
  5. El cliente recibe/ve el enlace en su dashboard y paga.
  6. `stripe-webhook` procesa `checkout.session.completed` → marca `pagos` como `succeeded`, registra `stripe_payment_intent_id`, calcula y guarda comisión si aplica, notifica al cliente (y opcional al abogado), e idempotencia estricta.
- Observabilidad: vistas SQL y listados para ver pagos pendientes, completados, comisiones por abogado y totales por período.

### 4) IVA (España) y exenciones
- Regla general: servicios jurídicos llevan IVA 21%.
- Exenciones típicas a considerar (confirmar con asesoría fiscal):
  - B2B intracomunitario con NIF-IVA válido → inversión del sujeto pasivo (0% en España).
  - Cliente fuera de la UE → fuera de ámbito IVA España (0%).
  - Suplidos/gastos repercutidos en nombre del cliente → fuera de base imponible del profesional si cumplen requisitos (0%).
  - AJG (asistencia jurídica gratuita) → situación particular; suele no repercutirse al beneficiario (0%).
- Modal “Solicitar pago”:
  - Campos: Concepto (texto), Monto base (€).
  - Checkboxes de exención (solo uno aplicará): `b2b_ue`, `fuera_ue`, `suplido`, `ajg`, o `none`.
  - Switch “Aplicar IVA 21%”: por defecto activo cuando no hay exención.
  - Vista previa: base, IVA, total.
- Persistencia en BD: `monto_base`, `iva_tipo` (0.21 o 0), `iva_monto`, `monto_total`, `exento boolean`, `exencion_motivo` (enum texto).

### 5) Comisión para abogado regular (Fase 1 sin Connect)
- Si el solicitante es abogado regular: aplicar comisión de plataforma (env `PLATFORM_COMMISSION_REGULAR_PCT`, p.ej. 0.15) sobre `monto_total` una vez pagado.
- Guardar `comision` y `monto_neto` (= `monto_total - comision`) en BD.
- Liquidación al abogado: fuera de Stripe en esta fase (informes de comisiones/pendientes de pago).

### 6) Seguridad y cumplimiento (RGPD)
- Autorización:
  - `crear-cobro` requiere `verify_jwt = true` y validación con `auth.getUser`.
  - Abogado regular solo puede solicitar si está asignado al caso (RPC `can_access_case` o consulta verificada con RLS).
  - Superadmin sin restricciones dentro del sistema.
- RLS en `pagos`:
  - INSERT por superadmin o abogado regular asignado.
  - SELECT por el cliente dueño del caso y por superadmin/abogado asignado (según vistas e interfaces).
  - UPDATE para cambios de estado vía webhook (mediante service role).
- Logs: sanitizados en Edge Functions (no exponer PII, truncar IDs/URLs, activar detalle solo en `ENV=dev`).
- Idempotencia en webhook: por `stripe_event_id` y por estado de `pagos`.
- CORS: permitir `x-client-version` y métodos `OPTIONS`.
- No usar Stripe Tax: cálculo de IVA propio y transparente para el cliente (previa confirmación legal interna).

### 7) Arquitectura técnica
- Base de datos (tabla `pagos`):
  - Nuevas columnas:
    - `concepto text`
    - `tipo_cobro text DEFAULT 'ad_hoc'` (para distinguir de pagos de “plan consulta”)
    - `monto_base numeric(10,2)`
    - `iva_tipo numeric(4,2)`
    - `iva_monto numeric(10,2)`
    - `monto_total numeric(10,2)`
    - `exento boolean DEFAULT false`
    - `exencion_motivo text` (enum textual: `none|b2b_ue|fuera_ue|suplido|ajg`)
    - `solicitado_por uuid REFERENCES auth.users(id)`
    - `solicitante_rol text CHECK (solicitante_rol IN ('superadmin','abogado_regular'))`
    - `stripe_session_id text`
    - `comision numeric(10,2) DEFAULT 0`
    - `monto_neto numeric(10,2) GENERATED ALWAYS AS (monto_total - comision) STORED`
  - Índices recomendados:
    - `idx_pagos_caso_id`, `idx_pagos_solicitado_por`, `idx_pagos_stripe_session_id`, `idx_pagos_estado`.
- Edge Functions:
  - Nueva `crear-cobro` (JWT ON):
    - Body: `{ caso_id, concepto, monto_base, exencion_tipo }`.
    - Validación de permisos (rol y acceso al caso).
    - Cálculo de IVA y total; crea `pagos (pending)`; Checkout con `price_data` y metadata `{ pago_id, caso_id, solicitado_por, solicitante_rol, exencion_tipo }`.
    - Guarda `stripe_session_id` en `pagos` y retorna `{ url }`.
  - Extensión mínima a `stripe-webhook` (JWT OFF):
    - Resolver `pago_id` desde `metadata` (o por `stripe_session_id`).
    - Idempotencia por `pagos.estado` y `stripe_event_id`.
    - Si `solicitante_rol='abogado_regular'`: aplicar `comision = monto_total * PLATFORM_COMMISSION_REGULAR_PCT`.
    - Actualizar `pagos` a `succeeded`, set `stripe_payment_intent_id`, `comision` y notificar.

### 8) Variables de entorno
- `PLATFORM_COMMISSION_REGULAR_PCT` (p.ej., `0.15`).
- `APP_BASE_URL` (ya en uso). Opcional: `SUCCESS_URL_BASE`, `CANCEL_URL_BASE`.
- Ya existentes: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`.

### 9) Fases de ejecución (sin aplicar aún)
- Fase 1 — Migraciones y RLS (MCP):
  - Añadir columnas en `pagos` e índices.
  - Actualizar/crear políticas RLS (insert/select/update) por rol y caso.
  - Documentar cambios en `SECURITY_SETUP.md`/`SECURITY_AUDIT.md`.
- Fase 2 — Función `crear-cobro`:
  - Implementar con validación de permisos, cálculo IVA, creación de `pagos` pending, creación de Checkout con `price_data`.
  - Sanitizar logs y CORS.
- Fase 3 — Webhook:
  - Extender `stripe-webhook` para manejar `pago_id`/`stripe_session_id`, calcular comisión si aplica y completar el pago.
  - Idempotencia estricta y notificaciones.
- Fase 4 — UI (Superadmin/Abogado):
  - Botón “Solicitar pago” en detalle de caso.
  - Modal con Concepto, Monto base, exenciones y vista previa; mutación React Query a `crear-cobro`.
- Fase 5 — UI (Cliente):
  - Sección “Pagos pendientes” en `Mis Casos` y en el detalle; botón “Pagar” (abre URL de Stripe) y refresco tras volver.
- Fase 6 — Observabilidad:
  - Vistas SQL: `vw_pagos_por_caso`, `vw_comisiones_por_abogado`, `vw_pagos_pendientes`.
  - Widget en dashboard admin (React Query).
- Fase 7 — Documentación y compliance:
  - Actualizar `SECURITY_AUDIT.md`, `SECURITY_SETUP.md` y añadir entrada resumida en `@SEPARACION_DASHBOARDS.md` (solo cambios nuevos).
- Fase 8 — (Opcional) Stripe Connect Express:
  - Onboarding de abogados.
  - Checkout con `application_fee_amount` y `transfer_data.destination`.

### 10) Criterios de aceptación por fase
- F1: Migraciones aplicadas (cloud via MCP y guardadas local), RLS probadas (abogado solo en casos asignados).
- F2: `crear-cobro` retorna URL válida; `pagos` pending con desglose IVA guardado.
- F3: Tras pagar, `pagos` → `succeeded` con `intent`, comisión aplicada si corresponde, notificación creada; idempotencia verificada.
- F4: Modal usable, validaciones (2 decimales, >0), vista previa correcta; link accesible.
- F5: Cliente ve pagos pendientes y puede pagar; estado se actualiza.
- F6: Métricas consultables; sin PII en vistas públicas.
- F7: Documentos de seguridad y separación actualizados.

### 11) Pruebas manuales
- Roles: superadmin vs abogado regular (asignado/no asignado) y cliente.
- IVA: sin exención vs cada exención → cálculos coherentes.
- Caducidad de sesión de Stripe → reintento recreando sesión.
- Idempotencia: reenvío de eventos desde Stripe.
- RLS: abogado no puede ver/crear cobros de casos ajenos.

### 12) Riesgos y mitigación
- Fiscalidad: excepciones de IVA requieren confirmación del asesor. Mitigar con etiquetas claras y registro `exencion_motivo`.
- Caducidad de sesiones: manejar reuso/creación nueva si expira.
- Conectividad: reintentos controlados y logs sanitizados.
- Evolución a Connect: planificada en Fase 8; mantener metadata compatible.

### 13) Despliegue y operaciones
- Usar Supabase MCP para migraciones/funciones (no CLI).
- Reconfigurar Secrets si es necesario (`PLATFORM_COMMISSION_REGULAR_PCT`).
- Actualizar `config.toml` si añadimos nuevas funciones.
- Verificar webhook en Stripe (reenvío de eventos de prueba).

### 14) Pendientes de decisión
- Valor por defecto de `PLATFORM_COMMISSION_REGULAR_PCT` (propuesta: 0.15).
- ¿Separar `SUCCESS_URL_BASE`/`CANCEL_URL_BASE` o continuar con `APP_BASE_URL`?
- ¿Personalizar comisión por abogado (campo en `profiles`) en futuro?

---

Nota: Este documento define el plan; no se han aplicado cambios aún. Al implementar, se actualizarán `SECURITY_AUDIT.md`, `SECURITY_SETUP.md` y `@SEPARACION_DASHBOARDS.md` únicamente con lo nuevo/modificado.

