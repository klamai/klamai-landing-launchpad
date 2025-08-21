# Estrategia de Gestión de Consentimiento y Cumplimiento RGPD

Este documento describe la estrategia unificada para obtener, registrar y gestionar el consentimiento del usuario en la plataforma KlamAI, asegurando el cumplimiento con el Reglamento General de Protección de Datos (RGPD).

## Principios Clave

1.  **Consentimiento Explícito y Centralizado:** El consentimiento principal sobre los Términos de Servicio y la Política de Privacidad se obtiene una única vez y de forma explícita en el momento de la creación de la cuenta de usuario.
2.  **Registro Inmutable:** Cada acto de consentimiento se registra de forma inmutable en la tabla `auditoria_seguridad` con información detallada (ID de usuario, fecha, hora, tipo de consentimiento).
3.  **Mínima Fricción:** En puntos de interacción posteriores al registro (ej. envío de un caso), se recordará al usuario que la acción está sujeta a las políticas ya aceptadas, pero no se requerirá una nueva aceptación explícita, para mantener una experiencia de usuario fluida.
4.  **Transparencia:** Los enlaces a los documentos legales estarán siempre accesibles desde los formularios y el pie de página de la aplicación.

## Flujo de Implementación

### 1. Registro de Nuevos Clientes (`/auth/registro`)

-   **Acción Requerida:** El usuario debe marcar activamente una casilla de verificación (checkbox) antes de poder completar el registro.
-   **Texto Legal:** "He leído y acepto los [Térmenos y Condiciones](mdc:/terminos-y-condiciones) y la [Política de Privacidad](mdc:/politicas-privacidad)."
-   **Registro en Backend:** Al registrarse con éxito, se invocará una función RPC `registrar_consentimiento_cliente` que creará una entrada en `auditoria_seguridad` con la acción `ACEPTA_POLITICAS_REGISTRO`.

### 2. Formularios para Usuarios Autenticados

(Ej: Envío de nuevo caso, actualización de perfil, etc.)

-   **Acción Requerida:** Ninguna. El usuario ya ha aceptado los términos al registrarse.
-   **Texto Legal:** Justo encima del botón de envío, se mostrará un texto informativo: "Al continuar, confirmas que tu acción se rige por nuestros [Térmenos y Condiciones](mdc:/terminos-y-condiciones)."
-   **Registro en Backend:** No se requiere un nuevo registro de consentimiento para estas acciones.

### 3. Formularios para Usuarios No Autenticados

(Ej: Formulario inicial de consulta, solicitud de abogado)

-   **Acción Requerida:** El usuario debe marcar activamente una casilla de verificación.
-   **Texto Legal:** "He leído y acepto los [Térmenos y Condiciones](mdc:/terminos-y-condiciones) y la [Política de Privacidad](mdc:/politicas-privacidad) para el envío de esta información."
-   **Registro en Backend:** El consentimiento se registra en `auditoria_seguridad` vinculado al email o al ID de la solicitud/caso creado, con una acción específica como `ACEPTA_POLITICAS_SOLICITUD_ABOGADO`.

### 4. Actualización de Políticas

-   **Flujo Futuro:** Si los documentos legales cambian significativamente, se implementará un mecanismo para requerir que los usuarios existentes acepten las nuevas versiones la próxima vez que inicien sesión. Esto se registrará como una nueva entrada en la auditoría.

## Estructura de la Tabla `auditoria_seguridad`

La tabla seguirá siendo la fuente central de verdad para el consentimiento. Un registro de ejemplo sería:

-   `usuario_id`: `uuid_del_usuario`
-   `accion`: `'ACEPTA_POLITICAS_REGISTRO'`
-   `tabla_afectada`: `'auth.users'`
-   `registro_id`: `uuid_del_usuario`
-   `datos_nuevos`: `{ "ip_address": "x.x.x.x", "user_agent": "...", "version_politicas": "1.0" }`



