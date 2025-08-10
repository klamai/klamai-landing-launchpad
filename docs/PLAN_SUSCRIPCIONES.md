## Plan de Suscripciones (Compatibilidad con cobros ad‑hoc)

### Objetivo
Diseñar un plan de implementación de suscripciones para abogados y clientes que sea 100% compatible con el modelo actual de cobros puntuales (ad‑hoc), sin romper el flujo existente y cumpliendo RGPD y principios de seguridad por defecto.

### Alcance y compatibilidad
- Mantener `pagos` para cobros one‑time y también registrar facturas de suscripción.
- Añadir una tabla `suscripciones` y reutilizar un único `Stripe Customer` por usuario.
- Extender el webhook principal para reflejar estados de suscripción e invoices en BD.
- No introducir cambios de UI bloqueantes: añadir gating progresivo por rol/plan.

## Modelo de datos propuesto

### 1) `profiles`
- Añadir `stripe_customer_id TEXT UNIQUE NULL` para reutilizar el mismo Customer en Stripe tanto en cobros one‑time como en suscripciones.

### 2) Catálogo de productos/precios (opcional, pero recomendable)
- `billing_products` y `billing_prices` como espejo mínimo de Stripe (IDs y metadatos), para consultas/BI y validaciones.
- Alternativa rápida: usar únicamente `stripe_price_id` en `suscripciones` con validaciones en código y Stripe como fuente de verdad del catálogo.

### 3) `suscripciones`
- Campos sugeridos:
  - `id UUID PK`
  - `profile_id UUID NOT NULL REFERENCES profiles(id)`
  - `role_destino TEXT CHECK (role_destino IN ('abogado','cliente')) NOT NULL`
  - `stripe_subscription_id TEXT UNIQUE NOT NULL`
  - `stripe_price_id TEXT NOT NULL`
  - `status TEXT CHECK (status IN ('trialing','active','past_due','canceled','unpaid','paused','incomplete')) NOT NULL`
  - `quantity INTEGER DEFAULT 1`
  - `current_period_start TIMESTAMPTZ NULL`
  - `current_period_end TIMESTAMPTZ NULL`
  - `cancel_at_period_end BOOLEAN DEFAULT FALSE`
  - `trial_end TIMESTAMPTZ NULL`
  - `metadata JSONB DEFAULT '{}'::jsonb`
- Índices recomendados: `(profile_id)`, `(status)`, `(stripe_subscription_id)`.

### 4) `pagos` (extensiones)
- Mantener compatibilidad con cobros ad‑hoc existentes.
- Añadir para invoices de suscripción:
  - `stripe_invoice_id TEXT NULL`
  - `suscripcion_id UUID NULL REFERENCES suscripciones(id)`
  - `origen TEXT CHECK (origen IN ('one_time','subscription_invoice')) DEFAULT 'one_time'`
- Mantener la granularidad actual (monto, currency, breakdown, comisiones cuando aplique) y los campos de trazabilidad (session/intent/price/product).

### 5) Entitlements/Features (control de acceso)
- Alternativa simple: derivar permisos en runtime desde `suscripciones.status` y `stripe_price_id` (cacheado con React Query).
- Alternativa robusta: `entitlements` (catálogo por `tier` y `role_destino`) y cálculo materializado en `user_entitlements`.

## Webhooks a soportar
- `checkout.session.completed` (mode=subscription): crear/activar `suscripciones`.
- `customer.subscription.created|updated|deleted`: reflejar `status`, períodos, `cancel_at_period_end`.
- `invoice.payment_succeeded|failed`: insertar en `pagos` como `subscription_invoice` (con `stripe_invoice_id`) y actualizar estado visible al usuario.
- Mantener manejo de `mode=payment` para cobros ad‑hoc existentes.
- Idempotencia por `stripe_event_id` y por claves naturales (subscription_id + invoice_id) cuando aplique.

## Edge Functions

### `stripe-webhook` (único, extendido)
- Mantener CORS y JWT OFF (webhook externo) y sanitización de logs.
- Ramas de manejo por tipo de evento y `mode`.
- Enriquecer `stripe_webhook_events` con `price_id`, `product_id`, `amount_total_cents`, `currency`, `customer`, `subscription`, `invoice`.

### `crear-suscripcion` (JWT ON)
- Recibe `stripe_price_id`, `role_destino`, y reutiliza `profiles.stripe_customer_id`.
- Crea Checkout Session `mode=subscription` con `allow_promotion_codes`, `trial_period_days` opcional.
- URLs de `success/cancel` con `APP_BASE_URL`.

### `crear-portal-facturacion` (JWT ON)
- Genera sesión de Stripe Customer Portal para actualizar tarjeta, cambiar plan y descargar facturas.

## Flujos de pago (resumen)

### Cobro ad‑hoc (actual)
- `mode=payment` → mantiene lógica e idempotencia actual.

### Suscripción nueva
1) Front: el usuario selecciona plan → llama a `crear-suscripcion`.
2) Inicia Checkout (reutiliza `stripe_customer_id`).
3) Webhook `checkout.session.completed` crea/activa `suscripciones` y guarda trazas.

### Gestión de suscripción
- Botón “Gestionar facturación” → `crear-portal-facturacion` → Customer Portal.
- Webhooks de `customer.subscription.updated` y `invoice.*` actualizan BD.

## Seguridad y RGPD
- RLS en `suscripciones` y `pagos` por `profile_id` (admins con bypass). Auditoría mínima.
- Guardar únicamente identificadores Stripe, importes, currency y fechas (sin PII sensible de tarjeta). 
- Logs sanitizados (emails enmascarados, IDs truncados, query params ocultos).
- Derecho al olvido: desvincular `stripe_customer_id` bajo proceso de baja y conservar lo fiscalmente requerido de forma anonimizada.

## UI/UX
- Badge de estado de suscripción visible en dashboards (abogado/cliente).
- Botones: “Suscribirme”, “Cambiar plan”, “Gestionar facturación”.
- Gating progresivo: hooks `useSubscription(profileId)` y `useEntitlements()`.

## Roadmap de implementación

### Fase A: Cimientos de datos y webhook
- Añadir columnas/tabla (`stripe_customer_id`, `suscripciones`, extensiones de `pagos`).
- Extender `stripe-webhook` para `subscription` e `invoice`.
- Sin cambios obligatorios en UI.

### Fase B: Funciones de creación/portal
- `crear-suscripcion` y `crear-portal-facturacion` (JWT ON).
- Reutilización de `stripe_customer_id` y URLs basadas en `APP_BASE_URL`.

### Fase C: UI mínima
- Botón de alta, estado visible, acceso a portal.
- React Query para estado en tiempo real y degradación de features.

### Fase D: Entitlements y BI
- Gating por plan/rol, límites (casos activos, IA tokens, etc.).
- Métricas por `price_id/product_id` y por estado de suscripción.

## Métricas y BI
- Vista `vw_sales_by_price_id` (ya planificada para one‑time) extendida a invoices de suscripción.
- Widgets en `SuperAdminMetrics` con ventas por producto/precio y MRR/Churn básico.

## Variables de entorno / Secrets
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- App: `APP_BASE_URL`.
- Opcionales: `SUCCESS_URL_BASE`, `CANCEL_URL_BASE`, `ALLOW_PROMO_CODES`, `TRIAL_DAYS`.
- Mantener `PLATFORM_COMMISSION_REGULAR_PCT` para cobros ad‑hoc solicitados por abogados regulares (no aplica a cuotas de suscripción a menos que se defina lo contrario).

## Riesgos y mitigación
- Estados Stripe `incomplete/past_due/paused`: reflejarlos y degradar permisos sin bloquear el acceso a facturas.
- Duplicidad de events: idempotencia por `event_id` y claves naturales.
- RGPD: verificar minimización de datos y retención fiscal.

## Notas de compatibilidad
- No se rompen los cobros ad‑hoc: `pagos` sigue siendo la fuente de verdad de cobros puntuales, y además registra invoices de suscripción con `origen='subscription_invoice'`.
- El webhook único maneja ambos mundos (payment y subscription) y reduce complejidad operativa.

