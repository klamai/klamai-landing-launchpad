# PRD: Plan de Acción de Seguridad y Autenticación

## 1. Contexto y Objetivo

Tras una revisión exhaustiva de la implementación de seguridad y autenticación del frontend en React y del backend en Supabase, se ha determinado la necesidad de un plan de acción para robustecer la plataforma. El objetivo principal es asegurar que la aplicación esté lista para producción, cumpliendo con las mejores prácticas de seguridad, protegiendo los datos de los usuarios y garantizando el cumplimiento del RGPD.

Este documento define las tareas críticas inmediatas y las mejoras a medio y largo plazo.

## 2. Requisitos Funcionales y Tareas

### P0: Prioridad Crítica (Bloqueante para Producción)

1.  **Implementación Total de RLS (Row Level Security):**
    *   **Descripción:** Aunque se ha confirmado que RLS está activo en tablas clave, es imperativo realizar una auditoría completa y asegurar que **TODAS** las tablas con datos sensibles o de usuario tengan políticas de RLS estrictas y correctamente configuradas.
    *   **Criterios de Aceptación:**
        *   Cada tabla en Supabase debe ser revisada.
        *   Se deben crear o actualizar políticas para permitir operaciones `SELECT`, `INSERT`, `UPDATE`, `DELETE` únicamente a los usuarios autorizados (propietarios de los datos, abogados asignados, super-administradores, etc.).
        *   Las políticas deben ser probadas para confirmar que previenen el acceso no autorizado.

2.  **Corrección de Vulnerabilidad en Funciones de PostgreSQL:**
    *   **Descripción:** El análisis de Supabase (`supabase db lint`) ha identificado 13 funciones con un `search_path` mutable, lo que representa una vulnerabilidad de seguridad. Estas funciones deben ser corregidas.
    *   **Criterios de Aceptación:**
        *   Aplicar una migración SQL que establezca explícitamente `SET search_path = ''` para cada una de las 13 funciones identificadas.
        *   Verificar que la migración se aplica correctamente tanto en el entorno local como en la nube.
        *   Volver a ejecutar el linter de la base de datos para confirmar que la advertencia ha sido resuelta.

### P1: Mejoras de Seguridad a Medio Plazo

3.  **Implementación de Rate Limiting (Limitación de Tasa):**
    *   **Descripción:** Proteger la aplicación contra ataques de fuerza bruta y abuso de API mediante la implementación de limitación de tasa en los endpoints de autenticación y otras funciones críticas.
    *   **Criterios de Aceptación:**
        *   Configurar el `Rate Limiting` en la configuración de autenticación de Supabase.
        *   Establecer límites razonables para el inicio de sesión, solicitud de reseteo de contraseña y otros flujos sensibles.

4.  **Implementación de un Sistema de Auditoría (Audit Trail):**
    *   **Descripción:** Crear un sistema para registrar eventos de seguridad importantes. Esto es crucial para la trazabilidad, el cumplimiento del RGPD y la respuesta a incidentes.
    *   **Criterios de Aceptación:**
        *   Crear una nueva tabla `audit_log`.
        *   Usar triggers o funciones de base de datos para registrar eventos como: inicios de sesión exitosos y fallidos, cambios de contraseña, cambios de permisos, acceso a datos sensibles, etc.
        *   El log debe registrar el ID de usuario, la acción realizada, la dirección IP y la marca de tiempo.

### P2: Mejoras Futuras y Opcionales

5.  **Activación de "Leaked Password Protection":**
    *   **Descripción:** Habilitar la funcionalidad de Supabase que comprueba las contraseñas contra bases de datos de contraseñas filtradas (como HaveIBeenPwned).
    *   **Criterios de Aceptación:**
        *   Esta tarea queda en estado "deferred" (aplazado) hasta que el proyecto se actualice a un plan de pago de Supabase.

6.  **Auditoría de Seguridad Externa:**
    *   **Descripción:** Considerar la contratación de un servicio externo para realizar una auditoría de seguridad completa (pentesting) una vez que la aplicación esté en un estado más maduro.
    *   **Criterios de Aceptación:**
        *   Evaluar proveedores y presupuestos para una futura auditoría.

## 3. Requisitos No Funcionales

*   **Seguridad:** Todos los cambios deben seguir el principio de "defensa en profundidad".
*   **Cumplimiento RGPD:** Todas las implementaciones, especialmente el logging de auditoría, deben ser diseñadas considerando los requisitos del RGPD.
*   **Escalabilidad:** Las soluciones implementadas no deben crear cuellos de botella de rendimiento.
*   **Mantenibilidad:** El código y las políticas deben estar bien documentados y ser fáciles de entender.
